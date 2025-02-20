import React, { useState, useEffect, useMemo  } from 'react';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { useApi } from '@/utils/useApi';
import axios from 'axios';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


const ScheduleCalendarTelefono = () => {
  //const { user } = useContext(AppContext);
  const exportToPDF = async () => {
    const calendarElement = document.getElementById("calendar-table");
    if (!calendarElement) return;
  
    try {
      // Save original styling
      const originalStyle = {
        maxHeight: calendarElement.style.maxHeight,
        height: calendarElement.style.height,
        overflow: calendarElement.style.overflow
      };
  
      // Temporarily modify the element to capture full content
      calendarElement.style.height = 'auto';
      calendarElement.style.maxHeight = 'none';
      calendarElement.style.overflow = 'visible';
  
      // Get scroll dimensions before modifying
      const originalScrollHeight = calendarElement.scrollHeight;
      const originalScrollWidth = calendarElement.scrollWidth;
  
      // Capture the full calendar
      const canvas = await html2canvas(calendarElement, {
        scale: 2, // Higher quality
        height: originalScrollHeight,
        width: originalScrollWidth,
        windowHeight: originalScrollHeight,
        windowWidth: originalScrollWidth,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('calendar-table');
          if (clonedElement) {
            clonedElement.style.height = 'auto';
            clonedElement.style.maxHeight = 'none';
            clonedElement.style.overflow = 'visible';
          }
        }
      });
  
      // Restore original styling
      calendarElement.style.maxHeight = originalStyle.maxHeight;
      calendarElement.style.height = originalStyle.height;
      calendarElement.style.overflow = originalStyle.overflow;
  
      const imgData = canvas.toDataURL('image/png');
  
      // Create PDF in landscape orientation
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
  
      // Calculate dimensions to fit the page with margins
      const margin = 10;
      const availableWidth = pageWidth - (2 * margin);
      const availableHeight = pageHeight - (2 * margin);
  
      // Calculate scaling to fit width while maintaining aspect ratio
      const aspectRatio = canvas.height / canvas.width;
      const imgWidth = availableWidth;
      const imgHeight = imgWidth * aspectRatio;
  
      // If image height exceeds page height, we need multiple pages
      if (imgHeight <= availableHeight) {
        // Single page
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        // Multiple pages
        let heightLeft = imgHeight;
        let position = 0;
        let page = 1;
  
        while (heightLeft > 0) {
          pdf.addImage(imgData, 'PNG', margin, page === 1 ? margin : -position + margin, imgWidth, imgHeight);
          heightLeft -= availableHeight;
          position += availableHeight;
  
          if (heightLeft > 0) {
            pdf.addPage();
            page++;
          }
        }
      }
  
      // Save the PDF
      pdf.save(`Calendario_${currentYear}_${months[currentMonth]}.pdf`);
  
    } catch (error) {
      console.error('Errore nella generazione del PDF:', error);
    }
  };
  

  const [currentYear, setCurrentYear] = useState(2025);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  interface ActiveSlot {
    dayIndex: number;
    slotIndex: number;
    slot: Slot | null;
    timeSlot: string;
  }

  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);
  const [formData, setFormData] = useState({ name: '', shift: '', dev: '' });
  const [shiftError, setShiftError] = useState<string | null>(null);


  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];


  const volunteersDEV = [
    'Alessandro Galli', 'Mariangela Rosa'
  ].sort();

  const shiftsDEV = [
    { value: 'B', label: 'Bellinzona' },
    { value: 'C', label: 'Casa' },
    { value: 'L', label: 'Lugano' },
    { value: 'M', label: 'Monti' },
    { value: 'S', label: 'Stabio' }
  ];

// Stato per memorizzare shifts, volunteers, slots e timeSlots
const [shifts, setShifts] = useState<{ value: string; label: string }[]>([]);
const [volunteers, setVolunteers] = useState<string[]>([]);
const [slots, setSlots] = useState<{ date: string; timeSlot: string; name: string; shift: string; dev: string; access: "edit" | "view" | "delete" }[]>([]);
const [timeSlots, setTimeSlots] = useState<string[]>([]);

    // Variabile di controllo ambiente sviluppo
  const isDev = false

  // Payload per le chiamate API
  const payload = useMemo(() => (!isDev ? { apiRoute: 'get_shifts_and_volunteers' } : null), []);

// Chiamata API unica per ottenere shifts, volunteers, slots e timeSlots
const { response, loading } = !isDev && payload 
  ? useApi<{ 
      shifts: { value: string; label: string }[]; 
      volunteers: string[]; 
      slots: { date: string; timeSlot: string; name: string; shift: string; dev: string;access: string }[];
      timeSlots: string[];
    }>(payload) 
  : { response: null, loading: false };


// Aggiornamento dello stato quando la risposta arriva
useEffect(() => {
  if (!isDev && response) {
    if (response.shifts) setShifts(response.shifts);
    if (response.volunteers) setVolunteers(response.volunteers.sort());
    if (response.slots) {
      setSlots(response.slots.map(slot => ({
        ...slot,
        access: ["edit", "view", "delete"].includes(slot.access) ? slot.access as "edit" | "view" | "delete" : "view"
      })));
    }
    if (response.timeSlots) setTimeSlots(response.timeSlots);
  }
}, [response]);


interface Slot {
  id: string;
  name: string;
  shift: string;
  dev: string;
  access: "edit" | "view" | "delete";
}

  
  interface Day {
    day: number;
    dayName: string;
    dayType: string;
    slots: (Slot | null)[];
  }
  
  const [scheduleData, setScheduleData] = useState<Day[]>([]);

  useEffect(() => {
    loadMonthData(currentYear, currentMonth);
  }, [currentYear, currentMonth]);


  useEffect(() => {
    if (shifts.length > 0 && volunteers.length > 0) {
      loadMonthData(currentYear, currentMonth);
    }
  }, [currentYear, currentMonth, shifts, volunteers]);

  const loadMonthData = (year: number, month: number) => {
    if (shifts.length === 0 || volunteers.length === 0) {
      return; // Evita di generare dati fino a quando non sono disponibili
    }


    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const newScheduleData = [];

    // Verifica che shifts e volunteers abbiano dati validi
    const safeVolunteers = volunteers && volunteers.length > 0 ? volunteers : ["Default Volunteer"];
    const safeShifts = shifts && shifts.length > 0 ? shifts : [{ value: "D", label: "Default Shift" }];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split("T")[0]; // Formato YYYY-MM-DD
      const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' });
      const dayType = [0, 6].includes(date.getDay()) ? 'weekend' : 'weekday';

      // Creazione di uno schema vuoto per gli slot della giornata
      const daySlots: (Slot | null)[] = Array(timeSlots.length).fill(null);
      
      // Inserimento degli slot nella giusta posizione in base alla data e alla fascia oraria
      slots.forEach(slot => {
        if (slot.date === dateStr) {
          const timeIndex = timeSlots.indexOf(slot.timeSlot);
          if (timeIndex !== -1) {
            daySlots[timeIndex] = {
              id: `${day}-${timeIndex}`,
              name: slot.name,
              shift: slot.shift,
              dev: slot.dev,
              access: slot.access
            };
          }
        }
      });

      // Generazione degli slot casuali con controllo di sicurezza
      const randomSlots: (Slot | null)[] = Array(6).fill(null).map((_, index) => {
        if (Math.random() > 0.5) {
          return {
            id: `${day}-${index}`,
            name: safeVolunteers[Math.floor(Math.random() * safeVolunteers.length)],
            shift: safeShifts[Math.floor(Math.random() * safeShifts.length)].value,
            dev: Math.random() > 0.5 ? 'X' : '',
            access: "view"
          };
        }
        return null;
      });

      newScheduleData.push({
        day,
        dayName,
        dayType,
        slots: daySlots
      });
    }
    

    setScheduleData(newScheduleData);
  };

  const openModal = (slot: Slot | null, dayIndex: number, slotIndex: number) => {
    setActiveSlot({ dayIndex, slotIndex, slot, timeSlot: timeSlots[slotIndex] });
  
    setFormData({
      name: slot ? slot.name : volunteers.length > 0 ? volunteers[0] : '',
      shift: slot ? slot.shift : '',
      dev: slot ? slot.dev || '' : ''
    });
  
    setIsModalOpen(true);
  };
  

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Cambiamento input - Nome: ${name}, Valore: ${value}`); // Debug
    setFormData({ ...formData, [name]: value });
  };

  const handleDevToggle = () => {
    setFormData(prev => ({
      ...prev,
      dev: prev.dev ? '' : 'X'
    }));
  };

  const handleFormSubmit = async () => {
    if (!activeSlot) return;
  
    // Controlla se la sede è stata selezionata
    if (!formData.shift) {
      setShiftError("Seleziona una sede prima di salvare.");
      return;
    } else {
      setShiftError(null); // Rimuove l'errore se la selezione è valida
    }
  
    const { dayIndex, slotIndex } = activeSlot;
    const newSlot = {
      date: `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${(dayIndex + 1).toString().padStart(2, '0')}`,
      timeSlot: timeSlots[slotIndex],
      name: formData.name,
      shift: formData.shift,
      dev: formData.dev || '',
      access: "edit" as "edit" | "view" | "delete" // Assicura che abbia un valore valido per TypeScript
    };
  
    const payload = {
      apiRoute: "save_shift",
      ...newSlot,
    };
  
    try {
      const res = await axios.post('/postApi/', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
  
      console.log("Turno salvato con successo:", res.data);
  
      // Aggiornare lo stato locale con il nuovo turno
      setSlots(prevSlots => [...prevSlots, newSlot]);
  
      setScheduleData(prevData =>
        prevData.map((day, index) => {
          if (index !== dayIndex) return day;
          const updatedSlots = [...day.slots];
          updatedSlots[slotIndex] = {
            id: `${dayIndex}-${slotIndex}`,
            name: formData.name,
            shift: formData.shift,
            dev: formData.dev || '',
            access: "edit"
          };
          return { ...day, slots: updatedSlots };
        })
      );
  
    } catch (error) {
      console.error('Errore nel salvataggio del turno:', error);
    }
  
    setIsModalOpen(false);
  };
  
  

  const handleDeleteShift = async () => {
    if (!activeSlot) return;
    const { dayIndex, slotIndex } = activeSlot;
  
    const payload = {
      apiRoute: "delete_shift",
      date: `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${(dayIndex + 1).toString().padStart(2, '0')}`,
      timeSlot: timeSlots[slotIndex]
    };
  
    try {
      const res = await axios.post('/postApi/', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
  
      console.log("Turno eliminato con successo:", res.data);
  
      // 1. Rimuovere il turno dallo stato `slots`
      setSlots(prevSlots => prevSlots.filter(slot =>
        !(slot.date === payload.date && slot.timeSlot === payload.timeSlot)
      ));
  
      // 2. Aggiornare il calendario rimuovendo lo slot eliminato
      setScheduleData(prevData =>
        prevData.map((day, index) => {
          if (index !== dayIndex) return day;
          const updatedSlots = [...day.slots];
          updatedSlots[slotIndex] = null; // Rimuove il turno dallo slot
          return { ...day, slots: updatedSlots };
        })
      );
  
    } catch (error) {
      console.error("Errore nell'eliminazione del turno:", error);
    }
  
    setIsModalOpen(false);
  };
  
  

  const isFullyBooked = (slots: (Slot | null)[]) => {
    return slots.every(slot => slot !== null);
  };

  const getCellClassName = (slot: Slot | null) => {
    const baseClasses = 'py-2 px-4 border-l cursor-pointer';
    if (!slot) return baseClasses;
    
    const matchesVolunteer = !selectedVolunteer || slot.name === selectedVolunteer;
    const matchesShift = !selectedShift || slot.shift === selectedShift;
    
    if (!matchesVolunteer || !matchesShift) {
      return `${baseClasses} opacity-25`;
    }
    
    // Se è stato selezionato un filtro e la cella corrisponde, aggiungi sfondo verde e grassetto
    if ((selectedVolunteer || selectedShift) && matchesVolunteer && matchesShift) {
      return `${baseClasses} bg-green-50 font-bold`;
    }
    
    return baseClasses;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full mx-auto bg-white rounded-lg shadow-lg">
      <div className="w-full h-5 bg-red-500 rounded-md"></div>
        <div className="w-full h-[85vh] p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-white text-red-500 px-4 py-2 rounded-lg">
              <Phone size={30} />
            </div>              
            <select
                className="border rounded px-2 py-1 bg-white"
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              >
                {[2023, 2024, 2025].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <button
                  className="p-1 hover:bg-gray-100 rounded"
                  onClick={() => currentMonth === 0
                    ? (setCurrentMonth(11), setCurrentYear(prev => prev - 1))
                    : setCurrentMonth(prev => prev - 1)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <select
                  className="border rounded px-2 py-1 bg-white"
                  value={months[currentMonth]}
                  onChange={(e) => setCurrentMonth(months.indexOf(e.target.value))}
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>

                <button
                  className="p-1 hover:bg-gray-100 rounded"
                  onClick={() => currentMonth === 11
                    ? (setCurrentMonth(0), setCurrentYear(prev => prev + 1))
                    : setCurrentMonth(prev => prev + 1)}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Filtra per Volontario 2:</label>
                <select
                  className="border rounded px-2 py-1 bg-white min-w-[200px]"
                  value={selectedVolunteer}
                  onChange={(e) => setSelectedVolunteer(e.target.value)}
                >
                  <option value="">Tutti</option>
                  {volunteers.map(volunteer => (
                    <option key={volunteer} value={volunteer}>{volunteer}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Filtra per Sede:</label>
                <select
                  className="border rounded px-2 py-1 bg-white w-24"
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                >
                  <option value="">Tutte le sedi</option>
                  {shifts.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={exportToPDF}
              >
                Esporta PDF
              </button>
            </div>
            </div>
          </div>

          <div id="calendar-table" className="border rounded overflow-auto h-[70vh]">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="py-2 px-2 text-left w-8">STATO</th>
                  <th className="py-2 px-4 text-left">DIC</th>
                  {timeSlots.map((slot, index) => (
                    <React.Fragment key={`header-${index}`}>
                      <th className="py-2 px-4 text-center border-l border-blue-500 w-12 bg-yellow-50">Dev</th>
                      <th className="py-2 px-4 text-center border-l border-blue-500">{slot}</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleData.map((day, dayIndex) => (
                  <tr key={day.day} className="border-t bg-white">
                    <td className={`py-2 px-2 border-r text-center w-8 ${isFullyBooked(day.slots) ? 'bg-green-100' : 'bg-red-100'}`}></td>
                    <td className={`py-2 px-4 border-r font-bold ${day.dayType === 'weekend' ? 'bg-yellow-100' : isFullyBooked(day.slots) ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <div className="text-2xl">{day.day}</div>
                      <div className="text-sm">{day.dayName}</div>
                    </td>
                    {day.slots.map((slot, slotIndex) => (
                      <React.Fragment key={`slot-${dayIndex}-${slotIndex}`}>
                        <td className={`border-l text-center font-bold bg-yellow-50 ${(!selectedVolunteer || slot?.name === selectedVolunteer) && (!selectedShift || slot?.shift === selectedShift) ? '' : 'opacity-25'}`}>
                          {slot?.shift}
                        </td>
                        <td
                          className={getCellClassName(slot)}
                          onClick={() => openModal(slot, dayIndex, slotIndex)}
                        >
                          {slot && (
                            <div className="text-center">
                              <div>{slot.name}</div>
                            </div>
                          )}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow-lg w-[90%] max-w-md">
      <h2 className="text-lg font-bold mb-4">TURNO</h2>
      <div className="mb-4 text-sm text-gray-600">
        Fascia oraria: {activeSlot ? activeSlot.timeSlot : ''}
      </div>

      {/* Nome Volontario */}
      <div className="mb-4">
        <label className="block mb-2">Nome Volontario</label>
        <select
          name="name"
          className="border rounded px-3 py-2 w-full"
          value={formData.name || (volunteers.includes("Alessandro Galli") ? "Alessandro Galli" : "")}
          onChange={handleInputChange}
          disabled={activeSlot?.slot?.access === "view"}
        >
          <option value="">Seleziona volontario</option>
          {volunteers.map(volunteer => (
            <option key={volunteer} value={volunteer}>
              {volunteer}
            </option>
          ))}
        </select>
      </div>

      {/* Sede */}
      <div className="mb-4">
        <label className="block mb-2">Sede</label>
        <select
          name="shift"
          className={`border rounded px-3 py-2 w-full ${shiftError ? 'border-red-500' : ''}`}
          value={formData.shift}
          onChange={handleInputChange}
          disabled={activeSlot?.slot?.access === "view"}
        >
          <option value="">Seleziona sede</option>
          {shifts.map(shift => (
            <option key={shift.value} value={shift.value}>{shift.label}</option>
          ))}
        </select>
        {shiftError && <p className="text-red-500 text-sm mt-1">{shiftError}</p>}
      </div>

      {/* Pulsanti */}
      <div className="flex justify-end gap-2">
        <button
          className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          onClick={() => setIsModalOpen(false)}
        >
          Annulla
        </button>

        {/* Pulsante "Elimina" visibile solo se access === "delete" o "edit" */}
        {activeSlot?.slot && (activeSlot.slot.access === "delete" || activeSlot.slot.access === "edit") && (
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={handleDeleteShift}
          >
            Elimina
          </button>
        )}

        {/* Pulsante "Salva" visibile solo se access === "edit" */}
        {activeSlot?.slot?.access === "edit" && (
          <button
            className={`px-4 py-2 rounded ${formData.shift ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            onClick={handleFormSubmit}
            disabled={!formData.shift}
          >
            Salva
          </button>
        )}
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendarTelefono;