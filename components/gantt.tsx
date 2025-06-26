import React, { useState } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

const GanttComponent: React.FC = () => {
    const [view, setView] = useState<ViewMode>(ViewMode.Day);

    const tasks: Task[] = [
        {
            id: '1',
            name: 'Progettazione',
            start: new Date(new Date().setDate(new Date().getDate() + 1)),
            end: new Date(new Date().setDate(new Date().getDate() + 5)),
            type: 'task',
            progress: 25,
            isDisabled: false,
        },
        {
            id: '2',
            name: 'Sviluppo',
            start: new Date(new Date().setDate(new Date().getDate() + 6)),
            end: new Date(new Date().setDate(new Date().getDate() + 15)),
            type: 'task',
            progress: 50,
            dependencies: ['1'],
        },
        {
            id: '3',
            name: 'Testing',
            start: new Date(new Date().setDate(new Date().getDate() + 16)),
            end: new Date(new Date().setDate(new Date().getDate() + 20)),
            type: 'task',
            progress: 10,
            dependencies: ['2'],
        },
        {
            id: '4',
            name: 'Documentazione',
            start: new Date(new Date().setDate(new Date().getDate() + 21)),
            end: new Date(new Date().setDate(new Date().getDate() + 24)),
            type: 'task',
            progress: 0,
            dependencies: ['3'],
        },
        {
            id: '5',
            name: 'Rilascio',
            start: new Date(new Date().setDate(new Date().getDate() + 25)),
            end: new Date(new Date().setDate(new Date().getDate() + 25)),
            type: 'milestone',
            progress: 0,
            dependencies: ['4'],
        },
    ];


    return (
        <div
            className="max-w-full overflow-x-auto p-6 bg-white rounded-md shadow-lg"
            style={{ position: 'relative', overflowX: 'scroll' }}
        >

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">📊 Gantt di progetto</h2>
                <select
                    value={view}
                    onChange={(e) => setView(e.target.value as ViewMode)}
                    className="border border-gray-300 rounded px-3 py-1 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    {Object.values(ViewMode).map((mode) => (
                        <option key={mode} value={mode}>
                            {mode}
                        </option>
                    ))}
                </select>
            </div>
            <Gantt
                tasks={tasks}
                viewMode={view}
                locale="it"
                // Personalizzazioni aggiuntive stile Gantt:
                columnWidth={70}
                barCornerRadius={6}
            // Se vuoi, puoi passare funzioni onClick, onDateChange ecc.
            />
        </div>
    );
};

export default GanttComponent;
