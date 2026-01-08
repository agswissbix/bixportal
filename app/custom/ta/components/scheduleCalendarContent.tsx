import React, { useState, useEffect, useMemo , useContext } from 'react';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { useApi } from '@/utils/useApi';
import axios from 'axios';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AppContext } from '@/context/appContext';
const borderClass = "border border-gray-400";

interface ScheduleCalendarContentProps {
  tipologia: string;
}

const ScheduleCalendarContent = ({ tipologia }: ScheduleCalendarContentProps) => {
  const now = new Date();
  const realCurrentYear = now.getFullYear();
  const realCurrentMonth = now.getMonth(); // 0 = Gennaio, 11 = Dicembre

  
  const { user, role, userName } = useContext(AppContext);
  const [viewMode, setViewMode] = useState<"calendar" | "agenda">("calendar");
  const isAdmin = role && role.toLowerCase() === 'amministratore';
    // All’interno del componente, aggiungi lo state per i filtri dell'agenda:
  const [agendaFilters, setAgendaFilters] = useState({
    startDate: '',
    endDate: '',
    volunteer: role === 'Utente' ? (userName || '') : '',
    shift: ''
  });


  // Funzione per esportare in PDF
  const exportToPDF = async () => {
    const calendarElement = document.getElementById("calendar-table");
    if (!calendarElement) return;

    try {
      const originalStyle = {
        maxHeight: calendarElement.style.maxHeight,
        height: calendarElement.style.height,
        overflow: calendarElement.style.overflow
      };

      calendarElement.style.height = 'auto';
      calendarElement.style.maxHeight = 'none';
      calendarElement.style.overflow = 'visible';

      const originalScrollHeight = calendarElement.scrollHeight;
      const originalScrollWidth = calendarElement.scrollWidth;

      const canvas = await html2canvas(calendarElement, {
        scale: 2,
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

      calendarElement.style.maxHeight = originalStyle.maxHeight;
      calendarElement.style.height = originalStyle.height;
      calendarElement.style.overflow = originalStyle.overflow;

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const availableWidth = pageWidth - 2 * margin;
      const availableHeight = pageHeight - 2 * margin;

      const aspectRatio = canvas.height / canvas.width;
      const imgWidth = availableWidth;
      const imgHeight = imgWidth * aspectRatio;

      if (imgHeight <= availableHeight) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
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

      pdf.save(`Calendario_${currentYear}_${months[currentMonth]}.pdf`);

    } catch (error) {
      console.error('Errore nella generazione del PDF:', error);
    }
  };


  const [currentYear, setCurrentYear] = useState(realCurrentYear);
  const [currentMonth, setCurrentMonth] = useState(realCurrentMonth);
  const availableYears = [2025, 2026];
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

  // Definisci prima tutti i mesi
  const allMonths = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  const months = useMemo(() => {
    // Se l'anno è 2026 E l'utente NON è admin, mostra solo Gennaio
    if (currentYear === 2026 && !isAdmin) {
      return ['Gennaio', 'Febbraio', 'Marzo'];
    }
    
    // In tutti gli altri casi (2025 per tutti, o 2026 per admin), mostra tutti i mesi
    return allMonths;
  }, [currentYear, isAdmin]); // Assicurati che le dipendenze siano [currentYear, isAdmin]
  


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

  const [shifts, setShifts] = useState<{ value: string; label: string }[]>([]);
  const [volunteers, setVolunteers] = useState<string[]>([]);
  const [slots, setSlots] = useState<{ date: string; timeSlot: string; name: string; shift: string; dev: string; access: "edit" | "view" | "delete" }[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  const isDev = false;
  const payload = useMemo(() => (!isDev ? { apiRoute: `get_shifts_and_volunteers_${tipologia}` } : null), [isDev, tipologia]);

  const { response, loading } = !isDev && payload 
    ? useApi<{ 
        shifts: { value: string; label: string }[]; 
        volunteers: string[]; 
        slots: { date: string; timeSlot: string; name: string; shift: string; dev: string; access: string }[];
        timeSlots: string[];
      }>(payload) 
    : { response: null, loading: false };

  useEffect(() => {
    if (!isDev && response) {
      // Caricamento Sedi
      if (response.shifts) {
        setShifts(response.shifts);
      }

      // Caricamento Volontari (ordinati)
      if (response.volunteers) {
        setVolunteers(response.volunteers.sort());
      }

      // Caricamento Slots con NORMALIZZAZIONE
      if (response.slots) {
        setSlots(response.slots.map(slot => {
          // 1. Normalizziamo l'accesso in minuscolo per sicurezza
          // Gestisce casi null, undefined o misti (es: "Edit", "EDIT")
          const rawAccess = slot.access ? slot.access.toLowerCase() : "view";
          
          // 2. Verifichiamo se il valore è valido, altrimenti default a "view"
          const validAccess = ["edit", "view", "delete"].includes(rawAccess)
            ? (rawAccess as "edit" | "view" | "delete")
            : "view";

          return {
            ...slot,
            // 3. Trim delle stringhe per evitare spazi vuoti invisibili
            name: slot.name ? slot.name.trim() : "",
            shift: slot.shift ? slot.shift.trim() : "",
            dev: slot.dev ? slot.dev.trim() : "",
            access: validAccess
          };
        }));
      }

      // Caricamento TimeSlots
      if (response.timeSlots) {
        setTimeSlots(response.timeSlots);
      }
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

  useEffect(() => {
    setSelectedVolunteer(''); // Imposta "Tutti" come default per tutti gli utenti
  }, [role, userName]);

  const loadMonthData = (year: number, month: number) => {
    if (shifts.length === 0 || volunteers.length === 0) {
      return;
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const newScheduleData = [];

    // Verifica che shifts e volunteers abbiano dati validi
    const safeVolunteers = volunteers.length > 0 ? volunteers : ["Default Volunteer"];
    const safeShifts = shifts.length > 0 ? shifts : [{ value: "D", label: "Default Shift" }];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' });
      const dayType = [0, 6].includes(date.getDay()) ? 'weekend' : 'weekday';
      const dateStr = `${year.toString().padStart(4, '0')}-${(month + 1)
        .toString()
        .padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const daySlots: (Slot | null)[] = Array(timeSlots.length).fill(null);

      // Inserimento degli slot dalla risposta API
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

      newScheduleData.push({
        day,
        dayName,
        dayType,
        slots: daySlots
      });
    }
    setScheduleData(newScheduleData);
  };

	const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newYear = parseInt(e.target.value);
		setCurrentYear(newYear);

		// Se il nuovo anno è 2026, l'utente NON è admin
		// e il mese attualmente selezionato è > 0 (non Gennaio),
		// reimposta il mese a 0 (Gennaio) per evitare errori.
		if (newYear === 2026 && !isAdmin && currentMonth > 0) {
		  setCurrentMonth(0);
		}
	  };
  
  // Funzione per aprire il modal
  const openModal = (slot: Slot | null, dayIndex: number, slotIndex: number) => {
    setActiveSlot({ dayIndex, slotIndex, slot, timeSlot: timeSlots[slotIndex] });
    setFormData({
      name: slot ? slot.name : (userName || ''),
      shift: slot ? slot.shift : '',
      dev: slot ? slot.dev || '' : ''
    });
    setIsModalOpen(true);
  };

  // Funzione chiamata al click sulla cella: gestisce i permessi
  // Funzione chiamata al click sulla cella: gestisce i permessi
  const handleCellClick = (dayIndex: number, slotIndex: number) => {
    console.log("--- CLICK RILEVATO ---");
    
    // Recupero dati dello slot e del giorno
    const dayInfo = scheduleData[dayIndex];
    if (!dayInfo) return;

    const slot = dayInfo.slots[slotIndex];
    const dayDate = new Date(currentYear, currentMonth, dayInfo.day);

    // Normalizzazione date (reset ore a 00:00:00 per confronti corretti)
    dayDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Definizione del limite (21 giorni come nel tuo codice originale)
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 21);
    limitDate.setHours(0, 0, 0, 0);

    // 1. FIX IMPORTANTE: Normalizziamo il ruolo in minuscolo
    // Gestisce casi come "Amministratore", "amministratore", "AMMINISTRATORE"
    const userRole = role ? role.toLowerCase() : '';
    
    console.log(`Ruolo: ${userRole} | Utente: ${userName} | Data Click: ${dayDate.toLocaleDateString()}`);

    // --- LOGICA AMMINISTRATORE ---
    if (userRole === 'amministratore') {
      console.log("Accesso Amministratore: Apro modale.");
      openModal(slot, dayIndex, slotIndex);
      return;
    }

    // --- LOGICA UTENTE ---
    if (userRole === 'utente') {
      
      // Caso A: Data passata o odierna -> Nessuna azione
      if (dayDate <= today) {
        console.warn("Data passata o odierna: modifica bloccata.");
        return;
      }

      // Caso B: Entro il limite (prossime 3 settimane circa)
      // Regola: Puoi solo aggiungere nuovi turni, non modificare esistenti
      if (dayDate > today && dayDate <= limitDate) {
        if (!slot) {
          // Slot vuoto -> OK inserimento
          openModal(null, dayIndex, slotIndex);
        } else {
          // Slot pieno -> BLOCCO
          console.warn("Slot già occupato: modifica bloccata nel breve periodo.");
        }
        return;
      }

      // Caso C: Oltre il limite (futuro lontano)
      // Regola: Puoi inserire o modificare SOLO i tuoi turni
      if (dayDate > limitDate) {
        if (!slot) {
          // Slot vuoto -> OK inserimento
          openModal(null, dayIndex, slotIndex);
        } else {
          // Slot pieno -> Controllo se è il tuo
          if (slot.name.toLowerCase() === userName?.toLowerCase()) {
            openModal(slot, dayIndex, slotIndex);
          } else {
            console.warn(`Slot occupato da ${slot.name}: non puoi modificarlo.`);
          }
        }
        return;
      }
    }

    // Se arriviamo qui, il ruolo non è stato riconosciuto o non ci sono permessi
    console.warn("Nessun permesso valido trovato per questa azione.");
  };

  // Gestione onChange select nel modal
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Eventuale toggle del DEV
  const handleDevToggle = () => {
    setFormData(prev => ({
      ...prev,
      dev: prev.dev ? '' : 'X'
    }));
  };

  // Salvataggio del turno (POST)
  const handleFormSubmit = async () => {
    if (!activeSlot) return;

    if (!formData.shift) {
      setShiftError("Seleziona una sede prima di salvare.");
      return;
    } else {
      setShiftError(null);
    }

    const { dayIndex, slotIndex } = activeSlot;
    const newSlot = {
      date: `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${(dayIndex + 1).toString().padStart(2, '0')}`,
      timeSlot: timeSlots[slotIndex],
      name: formData.name,
      shift: formData.shift,
      dev: formData.dev || '',
      type: tipologia,
      access: "edit" as "edit" | "view" | "delete"
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

  // Eliminazione del turno
  const handleDeleteShift = async () => {
    if (!activeSlot) return;
    const { dayIndex, slotIndex } = activeSlot;

    const payload = {
      apiRoute: "delete_shift",
      date: `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${(dayIndex + 1).toString().padStart(2, '0')}`,
      timeSlot: timeSlots[slotIndex],
      type: tipologia
    };

    try {
      const res = await axios.post('/postApi/', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      console.log("Turno eliminato con successo:", res.data);

      setSlots(prevSlots =>
        prevSlots.filter(slot =>
          !(slot.date === payload.date && slot.timeSlot === payload.timeSlot)
        )
      );

      setScheduleData(prevData =>
        prevData.map((day, index) => {
          if (index !== dayIndex) return day;
          const updatedSlots = [...day.slots];
          updatedSlots[slotIndex] = null;
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

  // Classe base per le celle
  const getCellClassName = (slot: Slot | null) => {
    const baseClasses = 'py-2 px-4 border '+borderClass+' cursor-pointer';
    if (!slot) return baseClasses;

    const matchesVolunteer = !selectedVolunteer || slot.name === selectedVolunteer;
    const matchesShift = !selectedShift || slot.shift === selectedShift;

    if (!matchesVolunteer || !matchesShift) {
      return `${baseClasses} opacity-25`;
    }

    // Se è stato selezionato un filtro e la cella corrisponde
    if ((selectedVolunteer || selectedShift) && matchesVolunteer && matchesShift) {
      return `${baseClasses} bg-green-50 font-bold`;
    }

    return baseClasses;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full mx-auto bg-white rounded-lg shadow-lg">

        {/* Barra per selezionare Calendario o Agenda */}
        <div className={`w-full h-12 ${tipologia === 'telefono' && 'bg-red-500'} ${tipologia === 'chat' && 'bg-green-500'} rounded-md flex items-center gap-4 p-2`}>
          <button
            className={`bg-white ${tipologia === 'telefono' && 'text-red-500'} ${tipologia === 'chat' && 'text-green-500'} px-4 py-2 rounded-md text-sm font-medium shadow hover:bg-gray-100`}
            onClick={() => setViewMode("calendar")}
          >
            Calendario
          </button>
          <button
            className={`bg-white ${tipologia === 'telefono' && 'text-red-500'} ${tipologia === 'chat' && 'text-green-500'} px-4 py-2 rounded-md text-sm font-medium shadow hover:bg-gray-100`}
            onClick={() => setViewMode("agenda")}
          >
            Agenda
          </button>
        </div>

        {/* Contenuto variabile in base a viewMode */}
        {viewMode === "calendar" ? (
          <div className="w-full h-[85vh] p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-white text-red-500 px-4 py-2 rounded-lg">
                  <Phone size={30} />
                </div>
                <select
                  className="border rounded px-2 py-1 bg-white"
                  value={currentYear}
                  onChange={handleYearChange} // Usa la nuova funzione handler
                >
                  {availableYears.map((year) => ( // Usa la costante availableYears
                    <option key={year} value={year}>
					  {year}
					</option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                 

                  <select
                    className="border rounded px-2 py-1 bg-white"
                    value={months[currentMonth]}
                    onChange={(e) => setCurrentMonth(months.indexOf(e.target.value))}
                  >
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>

                
                </div>
              </div>

              

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Filtra per Volontario:</label>
                  <select
                  className="border rounded px-2 py-1 bg-white min-w-[200px]"
                  value={selectedVolunteer}
                  onChange={(e) => setSelectedVolunteer(e.target.value)}
                >
                  <option value="">Tutti</option>
                  {isAdmin ? (
                    volunteers.map((volunteer) => (
                      <option key={volunteer} value={volunteer}>
                        {volunteer}
                      </option>
                    ))
                  ) : (
                    <option value={userName || ''}>{userName || ''}</option>
                  )}
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
                    {shifts.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
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
                <thead className="sticky top-0 z-10">
                  <tr className="bg-blue-600 text-white">
                    <th className={`py-2 px-2 text-left w-0 ${borderClass}`}></th>
                    <th className={`py-2 px-4 text-left ${borderClass}`}>
                      {new Date(currentYear, currentMonth, 1).toLocaleDateString("it-IT", { month: "short" }).toUpperCase()}
                    </th>

                    {timeSlots.map((slot, index) => (
                      <React.Fragment key={`header-${index}`}>
                        <th className={`py-1 px-1 w-8 text-center ${borderClass} w-12 bg-yellow-50 `}>
                          
                        </th>
                        <th className={`py-2 px-4 text-center ${borderClass} `}>
                          {slot}
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/**
                   * Mostriamo tutti i giorni oppure solo quelli che hanno almeno uno slot
                   * con il volontario selezionato se `selectedVolunteer` non è vuoto.
                   */}
                  {scheduleData
                    .filter((day) => {
                      if (!selectedVolunteer) return true;
                      return day.slots.some((slot) => slot && slot.name === selectedVolunteer);
                    })
                    .map((day, dayIndex) => {
                      // Calcolo se il giorno rientra nelle prossime 2 settimane
                      const today = new Date();
                      today.setHours(0,0,0,0);

                      const twoWeeksFromToday = new Date();
                      twoWeeksFromToday.setDate(twoWeeksFromToday.getDate() + 21);
                      twoWeeksFromToday.setHours(0,0,0,0);

                      const dayDate = new Date(currentYear, currentMonth, day.day);
                      dayDate.setHours(0,0,0,0);

                      const isInNextTwoWeeks = (dayDate >= today && dayDate <= twoWeeksFromToday);

                      // Scegliamo il colore di sfondo per la cella del giorno
                      let dayBackground = '';
        
                      dayBackground = day.dayType === "weekend"
                        ? "bg-yellow-100"
                        : isFullyBooked(day.slots)
                        ? "bg-green-100"
                        : "bg-blue-100";
                      

                      return (
                        <tr key={day.day} className="border-t bg-white">
                          <td  className={`py-2 px-2 ${borderClass} text-center w-8 ${isFullyBooked(day.slots) ? "bg-green-100" : "bg-red-100"}`}>

                          </td>
                          <td className={`py-2 px-4 ${borderClass} font-bold ${dayBackground}`}>
                            <div className="text-2xl">{day.day}</div>
                            <div className="text-sm">{day.dayName}</div>
                          </td>

                          {day.slots.map((slot, slotIndex) => (
                            <React.Fragment key={`slot-${dayIndex}-${slotIndex}`}>
                              {/* Colonna "Dev" (shift) */}
                              <td
                                className={`${borderClass} text-center font-bold ${
                                  isInNextTwoWeeks ? "bg-yellow-50" : "bg-yellow-50"
                                } ${
                                  (!selectedVolunteer || slot?.name === selectedVolunteer) &&
                                  (!selectedShift || slot?.shift === selectedShift)
                                    ? ""
                                    : "opacity-25"
                                }`}
                              >
                                {slot?.shift}
                              </td>

                              {/* Colonna "Volontario" */}
                              <td
                                className={`${getCellClassName(slot)} ${
                                  isInNextTwoWeeks ? "bg-red-100" : ""
                                }`}
                                onClick={() => handleCellClick(dayIndex, slotIndex)}
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
                      );
                    })}
                </tbody>
              </table>
            </div>

            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded shadow-lg w-[90%] max-w-md">
                  <h2 className="text-lg font-bold mb-4">TURNO</h2>
                  <div className="mb-4 text-sm text-gray-600">
                    Fascia oraria: {activeSlot ? activeSlot.timeSlot + " Giorno: " +scheduleData[activeSlot.dayIndex].day : ""}
                  </div>

                  {/* Nome Volontario */}
                  <div className="mb-4">
                    <label className="block mb-2">
                      Nome Volontario {user} {userName} {role}
                    </label>
                    <select
                      name="name"
                      className="border rounded px-3 py-2 w-full"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={role?.toLowerCase() !== "amministratore"}// Disabilita la select se il ruolo non è "Amministratore"
                    >
                      {volunteers.map((volunteer) => (
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
                      className={`border rounded px-3 py-2 w-full ${
                        shiftError ? "border-red-500" : ""
                      }`}
                      value={formData.shift}
                      onChange={handleInputChange}
                      disabled={activeSlot?.slot?.access === "view"}
                    >
                      <option value="">Seleziona sede</option>
                      {shifts.map((shift) => (
                        <option key={shift.value} value={shift.value}>
                          {shift.label}
                        </option>
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

                    {activeSlot?.slot && (activeSlot.slot.access === "view" || activeSlot.slot.access === "edit") && (
                      <button
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        onClick={handleDeleteShift}
                      >
                        Elimina
                      </button>
                    )}

                    <button
                      className={`px-4 py-2 rounded ${
                        formData.shift
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                      onClick={handleFormSubmit}
                      disabled={!formData.shift}
                    >
                      Salva
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Contenuto alternativo (Agenda) */
          <div className="w-full h-[85vh] p-4">
            {/* Barra di controllo: filtri e selettori, adattali alle tue necessità */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <label className="text-sm font-semibold">Da:</label>
              <input type="date" className="border px-2 py-1 rounded" />
              <label className="text-sm font-semibold">A:</label>
              <input type="date" className="border px-2 py-1 rounded" />

              <select className="border rounded px-2 py-1 bg-white">
                <option>- Volontario -</option>
                {volunteers.map((v, idx) => (
                  <option key={idx} value={v}>{v}</option>
                ))}
              </select>

              <select className="border rounded px-2 py-1 bg-white">
                <option>- Turno -</option>
                {shifts.map((s, idx) => (
                  <option key={idx} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Tabella "Agenda" */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="py-2 px-4 text-left">Data</th>
                  <th className="py-2 px-4 text-left">Orario</th>
                  <th className="py-2 px-4 text-left">Volontario</th>
                </tr>
              </thead>
              <tbody>
                {scheduleData.map((day) =>
                  day.slots.map((slot, slotIndex) => {
                    if (!slot) return null;
                    return (
                      <tr key={`${day.day}-${slotIndex}`} className="border-b">
                        <td className="py-2 px-4 w-1/4 align-top">
                          <div className="font-bold text-base text-gray-700">
                            {currentYear} {months[currentMonth]} {day.day}
                          </div>
                          <div className="text-sm text-gray-500">{day.dayName}</div>
                        </td>
                        <td className="py-2 px-4 w-1/4 align-top">
                          {timeSlots[slotIndex] || "Orario Non Definito"}
                          <div className="text-xs ${borderClass} mt-1">{slot.shift}</div>
                        </td>
                        <td className="py-2 px-4 align-top">
                          {slot.name}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleCalendarContent;
