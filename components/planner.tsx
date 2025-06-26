import React, { useState, useEffect, useRef } from 'react';

// Tipo task
type Task = {
  id: string;
  title: string;
  hours: number;
  color: string;
  textColor?: string;
};

// Loader script helper
const loadScript = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Impossibile caricare lo script ${src}`));
    document.head.appendChild(script);
  });

const initialTasks: Task[] = [
  { id: 'task-1', title: 'Progettazione UI/UX', hours: 3, color: 'bg-blue-500' },
  { id: 'task-2', title: 'Sviluppo Frontend', hours: 4, color: 'bg-green-500' },
  { id: 'task-3', title: 'Sviluppo Backend', hours: 5, color: 'bg-purple-500' },
  { id: 'task-4', title: 'Test e QA', hours: 2, color: 'bg-red-500' },
  { id: 'task-5', title: 'Meeting di allineamento', hours: 1, color: 'bg-yellow-500' },
  { id: 'task-6', title: 'Deploy in produzione', hours: 8, color: 'bg-indigo-500' },
];

const COLOR_OPTIONS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-gray-500',
];

// DraggableTask
type DraggableTaskProps = {
  task: Task;
  onColorChange: (taskId: string, newColor: string) => void;
};
function DraggableTask({ task, onColorChange }: DraggableTaskProps) {
  const [showColors, setShowColors] = useState(false);

  return (
    <div
      data-task-id={task.id}
      className={`fc-event ${task.color} ${task.textColor || 'text-white'} p-3 rounded-lg shadow-md mb-3 cursor-pointer select-none`}
      style={{ userSelect: 'none' }}
      onClick={() => setShowColors(!showColors)}
    >
      <div className="flex justify-between items-center w-full">
        <span>{task.title}</span>
        <span className="ml-2 text-sm font-bold text-white">{task.hours}h</span>
      </div>

      {showColors && (
        <div className="mt-2 flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(colorClass => (
            <button
              key={colorClass}
              onClick={e => {
                e.stopPropagation(); // evita toggle continuo
                onColorChange(task.id, colorClass);
                setShowColors(false);
              }}
              className={`${colorClass} w-6 h-6 rounded-full border-2 border-white shadow-sm`}
              aria-label={`Seleziona colore ${colorClass}`}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLibsReady, setLibsReady] = useState(false);
  const [currentView, setCurrentView] = useState<string>('dayGridMonth'); // tieni traccia della vista corrente

  const calendarRef = useRef<HTMLDivElement | null>(null);
  const externalEventsRef = useRef<HTMLDivElement | null>(null);
  const calendarInstanceRef = useRef<any>(null);
  const draggableInstanceRef = useRef<any>(null);

  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js');
        setLibsReady(true);
      } catch (e) {
        console.error('Errore caricamento FullCalendar:', e);
      }
    };

    if (!(window as any).FullCalendar) {
      loadCalendar();
    } else {
      setLibsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isLibsReady) return;

    const fullCalendar = (window as any).FullCalendar;

    if (!fullCalendar) {
      console.warn('FullCalendar non ancora definito');
      return;
    }
    const { Draggable, Calendar } = fullCalendar;

    if (!Draggable || !Calendar) {
      console.warn('Draggable o Calendar non disponibili in FullCalendar');
      return;
    }
    // Init Draggable
    if (externalEventsRef.current && !draggableInstanceRef.current) {
      draggableInstanceRef.current = new Draggable(externalEventsRef.current, {
        itemSelector: '.fc-event',
        eventData: (eventEl: HTMLElement) => {
          const taskId = eventEl.dataset.taskId!;
          const task = tasksRef.current.find(t => t.id === taskId);
          if (!task) return null;
          return {
            id: task.id,
            title: task.title,
            duration: { hours: task.hours },
            extendedProps: { color: task.color, textColor: task.textColor, hours: task.hours },
            backgroundColor: window.getComputedStyle(eventEl).backgroundColor,
            borderColor: window.getComputedStyle(eventEl).backgroundColor,
            classNames: [task.color, task.textColor || 'text-white'],
          };
        },
      });
    }

    // Init Calendar
    if (calendarRef.current && !calendarInstanceRef.current) {
      const calendar = new Calendar(calendarRef.current, {
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek',
        },
        initialView: 'timeGridWeek',
        locale: 'it',
        buttonText: { today: 'Oggi', month: 'Mese', week: 'Settimana' },
        editable: true,
        droppable: true,
        height: '100%',
        eventReceive: (info: any) => {
          const taskId = info.event.id;
          setTasks(current => current.filter(t => t.id !== taskId));
        },
        eventDrop: () => {
          // eventualmente aggiorna dati evento
        },
        eventDragStop: (info: any) => {
          const calendarEl = calendarRef.current;
          if (!calendarEl) return;

          const { clientX, clientY } = info.jsEvent;
          const rect = calendarEl.getBoundingClientRect();
          if (
            clientX < rect.left ||
            clientX > rect.right ||
            clientY < rect.top ||
            clientY > rect.bottom
          ) {
            const event = info.event;
            const props = event.extendedProps;

            const taskFromEvent: Task = {
              id: event.id,
              title: event.title,
              hours: props.hours || 1,
              color: props.color || 'bg-gray-500',
              textColor: props.textColor,
            };

            setTasks(current => {
              if (current.find(t => t.id === taskFromEvent.id)) return current;
              return [...current, taskFromEvent];
            });

            event.remove();
          }
        },
        eventAllow: (dropInfo: any, draggedEvent: any) => {
          // Disabilita drag & drop se siamo in vista mese
          return calendar.view.type !== 'dayGridMonth';
        },
        datesSet: (dateInfo: any) => {
          // Aggiorna stato vista corrente
          setCurrentView(dateInfo.view.type);
        },
        dateClick: (info: any) => {
          // Se siamo in vista mese e clicchiamo un giorno, andiamo alla vista settimana di quel giorno
          if (calendar.view.type === 'dayGridMonth') {
            calendar.changeView('timeGridWeek', info.date);
          }
        },
      });
      calendar.render();
      calendarInstanceRef.current = calendar;
    }

    return () => {
      if (draggableInstanceRef.current) {
        draggableInstanceRef.current.destroy();
        draggableInstanceRef.current = null;
      }
      if (calendarInstanceRef.current) {
        calendarInstanceRef.current.destroy();
        calendarInstanceRef.current = null;
      }
    };
  }, [isLibsReady]);

  // Cambia colore task
  const handleColorChange = (taskId: string, newColor: string) => {
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === taskId ? { ...task, color: newColor } : task
      )
    );
  };

  if (!isLibsReady) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Caricamento del calendario...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans bg-gray-50 text-gray-800">
      <div className="w-full md:w-1/4 lg:w-1/5 p-4 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">Task da Pianificare</h2>
        <p className="text-sm text-gray-500 mb-4">Trascina un task nel calendario o torna a trascinarlo qui.</p>
        <div
          id="external-events-list"
          ref={externalEventsRef}
          className="flex-grow overflow-auto"
          style={{ maxHeight: '65vh' }}
        >
          {tasks.map(task => (
            <DraggableTask key={task.id} task={task} onColorChange={handleColorChange} />
          ))}
        </div>
      </div>
      <div className="flex-grow p-4 md:p-6 h-full">
        <div
          className="bg-white p-4 rounded-lg shadow-md h-full"
          ref={calendarRef}
        ></div>
      </div>
    </div>
  );
}
