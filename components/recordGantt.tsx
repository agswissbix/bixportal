import React, { useMemo, useContext, useState, useEffect, useRef } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { start } from 'repl';

import { ArrowRightIcon, ArrowLeftIcon, ChevronRightIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        interface Task {
            id: string;
            title: string;
            startDate: Date;
            endDate: Date;
            progress: number;
            subTasks?: Task[];
        }

        interface GanttChartProps {
            tasks: Task[];
            startDate: Date;
            endDate: Date;
            title: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            gantt: GanttChartProps;
        }

        // BULK EXAMPLE DATA GENERATOR
        const generateExampleData = (): GanttChartProps => {
          const title = "Tasks";
        
          const today = new Date();
          today.setHours(0, 0, 0, 0); 
          const startDate = new Date(today);
          startDate.setDate(today.getDate() - 1);
          
          const endDate = new Date(today);
          endDate.setDate(today.getDate() + 60);
        
          const tasks: Task[] = [
            {
              id: '1',
              title: 'Project Planning',
              startDate: new Date(today),
              endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
              progress: 100,
              subTasks: [
                {
                  id: '1-1',
                  title: 'Requirements Gathering',
                  startDate: new Date(today),
                  endDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
                  progress: 100
                },
                {
                  id: '1-2',
                  title: 'Resource Allocation',
                  startDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
                  endDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
                  progress: 80
                }
              ]
            },
            {
              id: '2',
              title: 'Design Phase',
              startDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
              endDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000),
              progress: 75,
              subTasks: [
                {
                  id: '2-1',
                  title: 'UI/UX Design',
                  startDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
                  endDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
                  progress: 90
                },
                {
                  id: '2-2',
                  title: 'Technical Architecture',
                  startDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
                  endDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000),
                  progress: 60
                }
              ]
            },
            {
              id: '3',
              title: 'Development Sprint 1',
              startDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
              endDate: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000),
              progress: 50,
              subTasks: [
                {
                  id: '3-1',
                  title: 'Backend Development',
                  startDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
                  endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
                  progress: 70
                },
                {
                  id: '3-2',
                  title: 'Frontend Development',
                  startDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000),
                  endDate: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000),
                  progress: 30
                }
              ]
            },
            {
              id: '4',
              title: 'Testing Phase',
              startDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
              endDate: new Date(today.getTime() + 50 * 24 * 60 * 60 * 1000),
              progress: 25,
              subTasks: [
                {
                  id: '4-1',
                  title: 'Unit Testing',
                  startDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
                  endDate: new Date(today.getTime() + 40 * 24 * 60 * 60 * 1000),
                  progress: 40
                },
                {
                  id: '4-2',
                  title: 'Integration Testing',
                  startDate: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000),
                  endDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000),
                  progress: 10
                },
                {
                  id: '4-3',
                  title: 'User Acceptance Testing',
                  startDate: new Date(today.getTime() + 40 * 24 * 60 * 60 * 1000),
                  endDate: new Date(today.getTime() + 50 * 24 * 60 * 60 * 1000),
                  progress: 0
                }
              ]
            },
            {
              id: '5',
              title: 'Deployment',
              startDate: new Date(today.getTime() + 50 * 24 * 60 * 60 * 1000),
              endDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
              progress: 0,
              subTasks: [
                {
                  id: '5-1',
                  title: 'Production Deployment',
                  startDate: new Date(today.getTime() + 50 * 24 * 60 * 60 * 1000),
                  endDate: new Date(today.getTime() + 55 * 24 * 60 * 60 * 1000),
                  progress: 0
                },
                {
                  id: '5-2',
                  title: 'Post-Launch Monitoring',
                  startDate: new Date(today.getTime() + 55 * 24 * 60 * 60 * 1000),
                  endDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
                  progress: 0
                }
              ]
            }
          ];
        
          return {
            tasks,
            startDate,
            endDate,
            title
          };
        };

        // --- CONSTANT FOR DAY WIDTH ---
        const DAY_WIDTH_PX = 60;
        const MAIN_TASK_HEIGHT_PX = 56; 
        const SUB_TASK_HEIGHT_PX = 40;  


const findTaskById = (tasks: Task[], id: string | null): Task | null => {
    if (!id) return null;
    for (const task of tasks) {
        if (task.id === id) return task;
        if (task.subTasks) {
            const subTask = task.subTasks.find(st => st.id === id);
            if (subTask) return subTask;
        }
    }
    return null;
};

export default function Gantt({ propExampleValue }: PropsInterface) {
    const timelineContentRef = useRef<HTMLDivElement>(null);
    const taskSidebarRef = useRef<HTMLDivElement>(null);

    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]); 

    const toggleTaskExpansion = (taskId: string) => {
        setExpandedTaskIds(prevIds => {
            if (prevIds.includes(taskId)) {
                return prevIds.filter(id => id !== taskId);
            } else {
                return [...prevIds, taskId];
            }
        });
    };

    // DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                gantt: {
                    tasks: [],
                    startDate: new Date(),
                    endDate: new Date(),
                    title: ""
                }
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                gantt: generateExampleData()
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);


    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'examplepost', // riferimento api per il backend
            example1: propExampleValue
        };
    }, [propExampleValue]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error, elapsedTime } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    // PER DEVELOPMENT 
    useEffect(() => {
        const interval = setInterval(() => {
            setResponseData({ ...responseDataDEV }); 
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const start = responseData.gantt.startDate;
    const end = responseData.gantt.endDate;

    const totalDays =  Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // --- UTILITY FUNCTIONS ---

    const getDayDifference = (date1: Date, date2: Date): number => {
        const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
        const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
        const diffTime = d2.getTime() - d1.getTime(); 
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const getDurationDays = (startDate: Date, endDate: Date): number => {
        const diffTime = endDate.getTime() - startDate.getTime(); 
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const getProgressColor = (progress: number) => {
        if (progress === 100) return 'bg-green-500';
        if (progress >= 75) return 'bg-blue-500';
        if (progress >= 50) return 'bg-yellow-500';
        if (progress >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getTaskRowHeight = (task: Task) => {
        return MAIN_TASK_HEIGHT_PX;
    }

    // --- INITIAL SCROLL EFFECTS ---
    useEffect(() => {
        if (timelineContentRef.current && responseData.gantt.tasks.length > 0) {
            
            const allTasks = responseData.gantt.tasks.flatMap(task => 
                [task, ...(task.subTasks || [])]
            );

            const projectStartDate = allTasks.reduce((minDate, task) => {
                return task.startDate < minDate ? task.startDate : minDate;
            }, allTasks[0].startDate);

            const daysOffset = getDayDifference(start, projectStartDate);
            const pixelOffset = daysOffset * DAY_WIDTH_PX;

            timelineContentRef.current.scrollLeft = pixelOffset;

            const ganttHeader = document.getElementById('gantt-header');
            if (ganttHeader) {
                ganttHeader.scrollLeft = pixelOffset;
            }
        }
    }, [responseData.gantt.tasks, start]);

    const focusOnTask = (task: Task) => {
        if (timelineContentRef.current) {
            const daysOffset = getDayDifference(start, task.startDate);
            const pixelOffset = daysOffset * DAY_WIDTH_PX;
            
            timelineContentRef.current.scrollLeft = pixelOffset;

            const ganttHeader = document.getElementById('gantt-header');
            if (ganttHeader) {
                ganttHeader.scrollLeft = pixelOffset;
            }
        }
    }
    
    const handleTaskClick = (task: Task) => {
        const newSelectedId = task.id === selectedTaskId ? null : task.id;
        setSelectedTaskId(newSelectedId);

        if (newSelectedId !== null) {
            focusOnTask(task);
        }
    }


    
    // --- RENDERING ---
    const renderMonthHeader = () => {
        const months = [];
        let currentDay = new Date(start);
        
        while (currentDay <= end) { 
            const currentMonth = currentDay.getMonth();
            const year = currentDay.getFullYear();

            const lastDayOfMonth = new Date(year, currentMonth + 1, 0);
            lastDayOfMonth.setHours(0, 0, 0, 0);
            
            const spanEndDate = lastDayOfMonth < end ? lastDayOfMonth : end;
            
            const daysInSpan = getDayDifference(currentDay, spanEndDate) + 1;

            if (daysInSpan > 0) {
                 const monthName = currentDay.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }); 
                 
                 months.push(
                     <div 
                         key={`${currentMonth}-${year}`}
                         className="text-center py-1 border-r border-gray-300 font-bold text-gray-800 bg-gray-200 text-sm flex-shrink-0"
                         style={{ width: `${daysInSpan * DAY_WIDTH_PX}px` }}
                     >
                         {monthName}
                     </div>
                 );
            }

            currentDay = new Date(year, currentMonth + 1, 1);
            currentDay.setHours(0, 0, 0, 0);
        }
        
        return months;
    };


    const renderDateHeader = () => {
        const dateHeaders = [];
        for (let i = 0; i < totalDays; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i);
            const isToday = getDayDifference(currentDate, new Date()) === 0;

            dateHeaders.push(
                <div 
                    key={i}
                    className={`px-1 py-1 border-r text-center text-xs flex-shrink-0 ${isToday ? 'bg-blue-100 font-bold border-blue-300' : 'border-gray-200 text-gray-700'}`}
                    style={{ width: `${DAY_WIDTH_PX}px` }}
                >
                    <div className="font-semibold">{currentDate.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                    <div className="text-xs">{currentDate.toLocaleDateString('it-IT', { month: 'numeric', day: 'numeric' })}</div>
                </div>
            );
        }
        return dateHeaders;
    }

    const renderGridLines = (borderColor: string) => {
        const gridItems = Array.from({ length: totalDays }).map((_, index) => (
            <div 
                key={index}
                className={`flex-shrink-0 border-r ${borderColor}`}
                style={{ width: `${DAY_WIDTH_PX}px` }}
            ></div>
        ));
        
        gridItems.push(<div key="last-line" className={`flex-shrink-0 border-r ${borderColor}`} style={{ width: `0px` }}></div>)

        return gridItems;
    }

    const getTaskBarPositionAndWidth = (task: Task) => {
        const daysFromStart = getDayDifference(start, task.startDate);
        const durationDays = getDurationDays(task.startDate, task.endDate); 

        return {
            left: `${daysFromStart * DAY_WIDTH_PX}px`,
            width: `${durationDays * DAY_WIDTH_PX}px`,
        };
    }
    
    const renderTaskRow = (task: Task) => {
        const isExpanded = expandedTaskIds.includes(task.id);
        const hasSubTasks = task.subTasks && task.subTasks.length > 0;

        return (
            <React.Fragment key={task.id}>
                <div 
                    className={`border-b border-gray-200 transition-colors flex-shrink-0 cursor-pointer 
                                ${selectedTaskId === task.id ? 'bg-blue-50 border-blue-500 border-l-4 border-l-blue-500' : 'hover:bg-blue-50/50'}
                                flex items-center justify-between
                    `}
                    style={{ height: `${MAIN_TASK_HEIGHT_PX}px` }}
                    onClick={() => handleTaskClick(task)} 
                >
                    <div className="p-3 w-full">
                        <div className="font-medium text-gray-800 flex justify-between items-center">
                            <span className="truncate">{task.title}</span>
                            {hasSubTasks && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTaskExpansion(task.id);
                                    }}
                                    className="ml-2 p-1 text-gray-500 hover:text-gray-900 rounded-full"
                                    aria-label={isExpanded ? "Contrai Task" : "Espandi Task"}
                                >
                                    {isExpanded ? (
                                        <ChevronDownIcon className="h-4 w-4" />
                                    ) : (
                                        <ChevronRightIcon className="h-4 w-4" />
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="flex items-center mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${getProgressColor(task.progress)}`}
                                    style={{ width: `${task.progress}%` }}
                                ></div>
                            </div>
                            <span className="ml-2 text-xs font-semibold text-gray-600 whitespace-nowrap">
                                {task.progress}%
                            </span>
                        </div>
                    </div>
                </div>

                {hasSubTasks && isExpanded && (
                    <div className="pl-6 border-l border-gray-300">
                        {task.subTasks!.map(subTask => (
                            <div 
                                key={subTask.id} 
                                className={`border-b border-gray-100 hover:bg-blue-50/20 cursor-pointer 
                                            ${selectedTaskId === subTask.id ? 'bg-blue-100/50 border-l-2 border-l-blue-400' : ''}
                                `}
                                style={{ height: `${SUB_TASK_HEIGHT_PX}px` }}
                                onClick={() => handleTaskClick(subTask)}
                            >
                                <div className="flex justify-between items-center text-xs w-full h-full p-2">
                                    <span className="text-gray-700 font-normal truncate">{subTask.title}</span>
                                    <span className="text-gray-500 font-medium">{subTask.progress}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </React.Fragment>
        );
    };

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => {
                
                const selectedTask = useMemo(() => 
                    findTaskById(response.gantt.tasks, selectedTaskId),
                    [response.gantt.tasks, selectedTaskId]
                );

                return (
                    <div className="relative w-full h-screen">
                        
                        <div className="w-full h-full flex flex-col border border-gray-300 rounded-lg shadow-xl overflow-hidden">
                            
                            <div className="flex flex-shrink-0 border-b border-gray-300">
                                <div 
                                    className={`p-4 bg-gray-100 font-bold text-gray-700 border-r border-gray-300 flex-shrink-0 
                                        md:w-80 md:block 
                                        ${isSidebarVisible ? 'w-full' : 'hidden'} 
                                    `}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        {response.gantt.title}
                                    </div>
                                </div>
                                
                                <div 
                                    id="gantt-header"
                                    className={`flex-1 bg-gray-100 overflow-x-hidden relative`}
                                >
                                    <div className={`${isSidebarVisible ? 'hidden md:block' : 'block'}`}>
                                        <div className="flex border-b border-gray-300" style={{ width: `${totalDays * DAY_WIDTH_PX}px` }}>
                                            {renderMonthHeader()}
                                        </div>

                                        <div 
                                            className="flex h-10 items-end"
                                            style={{ width: `${totalDays * DAY_WIDTH_PX}px` }} 
                                        >
                                            {renderDateHeader()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-1 min-h-0 relative"> 
                                <div 
                                    id="task-sidebar"
                                    ref={taskSidebarRef} 
                                    className={`
                                        flex flex-col border-r border-gray-300 bg-white z-20 overflow-y-scroll overflow-x-hidden flex-shrink-0 
                                        md:w-80 md:static md:block
                                        absolute inset-0
                                        ${isSidebarVisible ? 'block' : 'hidden'}
                                    `}
                                    onScroll={(e) => {
                                        const timelineContent = timelineContentRef.current;
                                        if (timelineContent) {
                                            timelineContent.scrollTop = e.currentTarget.scrollTop;
                                        }
                                    }}
                                >
                                    {response.gantt.tasks.map(renderTaskRow)}
                                </div>
                                
                                {/* Timeline */}
                                <div 
                                    id="timeline-content"
                                    ref={timelineContentRef} 
                                    className={`
                                        overflow-auto flex-1
                                        md:static md:block
                                        absolute inset-0
                                        ${!isSidebarVisible ? 'block' : 'hidden md:block'}
                                    `}
                                    onScroll={(e) => {
                                        const ganttHeader = document.getElementById('gantt-header');
                                        if (ganttHeader) {
                                            ganttHeader.scrollLeft = e.currentTarget.scrollLeft;
                                        }
                                        const taskSidebar = taskSidebarRef.current;
                                        if (taskSidebar) {
                                            taskSidebar.scrollTop = e.currentTarget.scrollTop;
                                        }
                                    }}
                                >
                                    <div 
                                        className="relative min-h-full"
                                        style={{ 
                                            width: `${totalDays * DAY_WIDTH_PX}px`,
                                        }}
                                    >
                                        {/* Today Red Line */}
                                        {getDayDifference(start, new Date()) >= 0 && (
                                            <div 
                                                className="absolute inset-y-0 w-0.5 bg-red-500 z-10" 
                                                style={{ 
                                                    left: `${getDayDifference(start, new Date()) * DAY_WIDTH_PX + (DAY_WIDTH_PX / 2)}px`, 
                                                    height: '100%',
                                                }}
                                            ></div>
                                        )}

                                        {response.gantt.tasks.map((task) => {
                                            const isExpanded = expandedTaskIds.includes(task.id);
                                            const { left: mainLeft, width: mainWidth } = getTaskBarPositionAndWidth(task);

                                            return (
                                                <React.Fragment key={task.id}>
                                                    <div 
                                                        className={`border-b border-gray-200`} 
                                                        style={{ 
                                                            height: `${MAIN_TASK_HEIGHT_PX}px`, 
                                                            width: `${totalDays * DAY_WIDTH_PX}px`
                                                        }} 
                                                    >
                                                        {/* Main Task Bar Row  */}
                                                        <div className="relative h-14 flex items-center">
                                                            <div className="absolute inset-0 flex">
                                                                {renderGridLines('border-gray-100')}
                                                            </div>

                                                            {/* Task Bar */}
                                                            <div 
                                                                className={`absolute h-8 rounded-lg overflow-hidden cursor-pointer transition-shadow shadow-md hover:shadow-lg bg-gray-300`}
                                                                style={{
                                                                    left: mainLeft,
                                                                    width: mainWidth,
                                                                    minWidth: `${DAY_WIDTH_PX}px`,
                                                                    zIndex: 20 
                                                                }}
                                                                onClick={() => handleTaskClick(task)}
                                                            >
                                                                <div 
                                                                    className={`absolute inset-y-0 left-0 ${getProgressColor(task.progress)}`}
                                                                    style={{ 
                                                                        width: `${task.progress}%`,
                                                                    }}
                                                                ></div>
                                                                <div className="absolute inset-0 flex items-center px-2 text-white text-sm font-medium">
                                                                    <span className="truncate">{task.title}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Subtasks Rows */}
                                                    {isExpanded && task.subTasks && task.subTasks.map((subTask) => {
                                                        const { left: subLeft, width: subWidth } = getTaskBarPositionAndWidth(subTask);

                                                        return (
                                                            <div 
                                                                key={subTask.id} 
                                                                className={`relative h-10 flex items-center bg-gray-50/10 border-t border-gray-100 cursor-pointer 
                                                                            ${selectedTaskId === subTask.id ? 'bg-blue-100/50' : ''}`}
                                                                style={{ height: `${SUB_TASK_HEIGHT_PX}px` }} 
                                                                onClick={() => handleTaskClick(subTask)}
                                                            >
                                                                {/* Grid Lines */}
                                                                <div className="absolute inset-0 flex">
                                                                    {renderGridLines('border-gray-100')}
                                                                </div>
                                                                
                                                                {/* Sub Task Bar */}
                                                                <div 
                                                                    className={`absolute h-5 rounded-full overflow-hidden cursor-pointer transition-shadow shadow-sm hover:shadow-md bg-gray-300`}
                                                                    style={{
                                                                        left: subLeft,
                                                                        width: subWidth,
                                                                        minWidth: `${DAY_WIDTH_PX/2}px`,
                                                                        opacity: 0.9,
                                                                        zIndex: 20 
                                                                    }}
                                                                >
                                                                    <div 
                                                                        className={`absolute inset-y-0 left-0 ${getProgressColor(task.progress)}`}
                                                                        style={{ 
                                                                            width: `${subTask.progress}%`, 
                                                                        }}
                                                                    ></div>
                                                                    <div className="absolute inset-0 flex items-center px-2 text-black text-xs font-medium">
                                                                        <span className="truncate">{subTask.title}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:hidden fixed bottom-4 right-4 z-50">
                            {isSidebarVisible && (
                                <button
                                    className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                    onClick={() => setIsSidebarVisible(false)}
                                    aria-label="Mostra Timeline"
                                >
                                    <span className="font-semibold">Timeline</span>
                                    <ArrowRightIcon className="w-5 h-5" /> 
                                </button>
                            )}

                            {!isSidebarVisible && (
                                <button
                                    className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                    onClick={() => setIsSidebarVisible(true)}
                                    aria-label="Mostra Tasks"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                    <span className="font-semibold">Tasks</span>
                                </button>
                            )}
                        </div>

                    </div>
                );
            }}
        </GenericComponent>
    );
};