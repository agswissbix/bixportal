'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Phone, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const MobileScheduleCalendar = () => {
  const [currentYear, setCurrentYear] = useState(2024);
  const [currentMonth, setCurrentMonth] = useState(11);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ timeSlot: string; volunteer: string | null; shift: string | null; } | null>(null);
  const [formData, setFormData] = useState({ name: '', shift: '', dev: '' });

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const shifts = [
    { value: 'B', label: 'Bellinzona' },
    { value: 'C', label: 'Casa' },
    { value: 'L', label: 'Lugano' },
    { value: 'M', label: 'Monti' },
    { value: 'S', label: 'Stabio' }
  ];

  const volunteers = [
    'Alessandro Galli', 'Mariangela Rosa', 'Giovanni Bianchi', 'Lucia Verdi'
  ].sort();

  const timeSlots = [
    '07.30-11.30', '11.30-15.30', '15.30-19.30', 
    '19.30-23.30', '23.30-03.30', '03.30-07.30'
  ];

  const generateDaySchedule = (day: number) => {
    return timeSlots.map((timeSlot) => ({
      timeSlot,
      volunteer: Math.random() > 0.7 ? volunteers[Math.floor(Math.random() * volunteers.length)] : null,
      shift: Math.random() > 0.7 ? shifts[Math.floor(Math.random() * shifts.length)].value : null
    }));
  };

  const [scheduleData, setScheduleData] = useState<{ day: number; dayName: string; dayType: string; schedule: { timeSlot: string; volunteer: string | null; shift: string | null; }[]; hasShifts: boolean; }[]>([]);

  useEffect(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const newScheduleData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' });
      const dayType = [0, 6].includes(date.getDay()) ? 'weekend' : 'weekday';
      
      const schedule = generateDaySchedule(day);
      const hasShifts = schedule.some(slot => slot.volunteer);
      
      newScheduleData.push({
        day,
        dayName,
        dayType,
        schedule,
        hasShifts
      });
    }

    setScheduleData(newScheduleData);
  }, [currentYear, currentMonth]);

  interface DayData {
    day: number;
    dayName: string;
    dayType: string;
    schedule: { timeSlot: string; volunteer: string | null; shift: string | null; }[];
    hasShifts: boolean;
  }

  const DayCard = ({ dayData }: { dayData: DayData }) => {
    const bgColor = dayData.dayType === 'weekend' ? 'bg-yellow-50' : 
                   dayData.hasShifts ? 'bg-green-50' : 'bg-white';
    
    const occupiedSlots = dayData.schedule.filter(slot => slot.volunteer).length;
    
    return (
      <div 
        className={`${bgColor} border rounded-lg p-4 shadow-sm cursor-pointer 
        hover:shadow-md transition-shadow`}
        onClick={() => {
          setSelectedDay(dayData);
          setShiftModalOpen(true);
        }}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold">{dayData.day}</div>
            <div className="text-sm text-gray-500">{dayData.dayName}</div>
          </div>
          <div className="flex flex-col items-end">
            <div className={`w-3 h-3 rounded-full ${dayData.hasShifts ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className="text-sm text-gray-500 mt-1">
              {occupiedSlots}/{timeSlots.length} turni
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DayModal = () => {
    if (!selectedDay) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
        <div className="bg-white p-4 rounded-t-xl flex-1 mt-20">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">
                {selectedDay.day} {months[currentMonth]}
              </h2>
              <p className="text-sm text-gray-500">{selectedDay.dayName}</p>
            </div>
            <button 
              onClick={() => {
                setSelectedDay(null);
                setShiftModalOpen(false);
              }}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {/* Time Slots */}
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
            {selectedDay.schedule.map((slot, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  slot.volunteer ? 'bg-white' : 'bg-gray-50 border-dashed'
                } cursor-pointer hover:border-blue-500`}
                onClick={() => {
                  setSelectedTimeSlot(slot);
                  setFormData({
                    name: slot.volunteer || '',
                    shift: slot.shift || '',
                    dev: ''
                  });
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">{slot.timeSlot}</div>
                  {slot.shift && (
                    <div className="px-2 py-1 bg-yellow-100 rounded text-sm font-bold">
                      {slot.shift}
                    </div>
                  )}
                </div>
                {slot.volunteer ? (
                  <div className="text-sm">{slot.volunteer}</div>
                ) : (
                  <div className="text-sm text-gray-500 italic">Nessun turno assegnato</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ShiftModal = () => {
    if (!selectedTimeSlot) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-sm">
          <h3 className="text-lg font-bold mb-4">Imposta Turno</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Fascia Oraria
              </label>
              <div className="text-sm text-gray-600">
                {selectedTimeSlot.timeSlot}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Volontario
              </label>
              <select
                className="w-full border rounded px-3 py-2"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              >
                <option value="">Seleziona volontario</option>
                {volunteers.map(volunteer => (
                  <option key={volunteer} value={volunteer}>
                    {volunteer}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Sede
              </label>
              <select
                className="w-full border rounded px-3 py-2"
                value={formData.shift}
                onChange={(e) => setFormData({...formData, shift: e.target.value})}
              >
                <option value="">Seleziona sede</option>
                {shifts.map(shift => (
                  <option key={shift.value} value={shift.value}>
                    {shift.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              onClick={() => setSelectedTimeSlot(null)}
            >
              Annulla
            </button>
            {selectedTimeSlot.volunteer && (
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => {
                  // Handle delete
                  setSelectedTimeSlot(null);
                }}
              >
                Elimina
              </button>
            )}
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                // Handle save
                setSelectedTimeSlot(null);
              }}
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-lg mx-auto bg-white shadow-lg">
        {/* Header */}
        <div className="bg-red-500 h-2" />
        
        {/* Navigation and Controls */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Phone className="text-red-500" size={24} />
              <span className="font-bold">Telefono</span>
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Filter size={20} />
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <select
              className="border rounded px-2 py-1"
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

              <span className="font-medium w-24 text-center">
                {months[currentMonth]}
              </span>

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
        </div>

        {/* Filters Panel */}
        {isFilterOpen && (
          <div className="p-4 border-b bg-gray-50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Filtra per Volontario:
                </label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={selectedVolunteer}
                  onChange={(e) => setSelectedVolunteer(e.target.value)}
                >
                  <option value="">Tutti</option>
                  {volunteers.map(volunteer => (
                    <option key={volunteer} value={volunteer}>{volunteer}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Filtra per Sede:
                </label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                >
                  <option value="">Tutte le sedi</option>
                  {shifts.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="p-4 grid grid-cols-2 gap-4">
          {scheduleData.map((dayData, index) => (
            <DayCard key={index} dayData={dayData} />
          ))}
        </div>

        {/* Day Modal */}
        {shiftModalOpen && <DayModal />}

        {/* Shift Modal */}
        {selectedTimeSlot && <ShiftModal />}
      </div>
    </div>
  );
};

export default MobileScheduleCalendar;