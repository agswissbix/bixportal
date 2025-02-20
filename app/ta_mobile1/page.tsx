'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Phone, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const MobileScheduleCalendar = () => {
  const [currentYear, setCurrentYear] = useState(2024);
  const [currentMonth, setCurrentMonth] = useState(11);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ day: DayData; slot: { timeSlot: string; volunteer: string | null; shift: string | null; }; slotIndex: number } | null>(null);
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

  // Function to generate daily schedule data
  const generateDaySchedule = (day: number) => {
    return timeSlots.map((timeSlot, index) => ({
      timeSlot,
      volunteer: Math.random() > 0.7 ? volunteers[Math.floor(Math.random() * volunteers.length)] : null,
      shift: Math.random() > 0.7 ? shifts[Math.floor(Math.random() * shifts.length)].value : null
    }));
  };

  const [scheduleData, setScheduleData] = useState<{ day: number; dayName: string; dayType: string; schedule: { timeSlot: string; volunteer: string | null; shift: string | null; }[]; }[]>([]);

  useEffect(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const newScheduleData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' });
      const dayType = [0, 6].includes(date.getDay()) ? 'weekend' : 'weekday';
      
      newScheduleData.push({
        day,
        dayName,
        dayType,
        schedule: generateDaySchedule(day)
      });
    }

    setScheduleData(newScheduleData);
  }, [currentYear, currentMonth]);

  interface DayData {
    day: number;
    dayName: string;
    dayType: string;
    schedule: {
      timeSlot: string;
      volunteer: string | null;
      shift: string | null;
    }[];
  }

  const DayCard = ({ dayData }: { dayData: DayData }) => {
    const hasShifts = dayData.schedule.some(slot => slot.volunteer);
    const bgColor = dayData.dayType === 'weekend' ? 'bg-yellow-50' : 
                   hasShifts ? 'bg-green-50' : 'bg-white';

    return (
      <Card className={`mb-4 ${bgColor} border`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold">{dayData.day}</div>
              <div className="text-sm text-gray-500">{dayData.dayName}</div>
            </div>
            <div className={`w-3 h-3 rounded-full ${hasShifts ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          
          <div className="space-y-2">
            {dayData.schedule.map((slot, index) => (
              <div 
                key={index}
                className={`p-3 rounded border ${slot.volunteer ? 'bg-white shadow-sm' : 'bg-gray-50 border-dashed'}`}
                onClick={() => handleSlotClick(dayData, slot, index)}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-medium">{slot.timeSlot}</div>
                  {slot.shift && (
                    <div className="text-sm font-bold bg-yellow-100 px-2 py-1 rounded">
                      {slot.shift}
                    </div>
                  )}
                </div>
                {slot.volunteer ? (
                  <div className="text-sm">{slot.volunteer}</div>
                ) : (
                  <div className="text-sm text-gray-500 italic">Slot libero</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleSlotClick = (day: DayData, slot: { timeSlot: string; volunteer: string | null; shift: string | null; }, slotIndex: number) => {
    setActiveSlot({ day, slot, slotIndex });
    setFormData({
      name: slot.volunteer || '',
      shift: slot.shift || '',
      dev: ''
    });
    setIsModalOpen(true);
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

        {/* Calendar Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-screen pb-20">
          {scheduleData.map((dayData, index) => (
            <DayCard key={index} dayData={dayData} />
          ))}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold mb-4">Dettagli Turno</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fascia Oraria
                  </label>
                  <div className="text-sm text-gray-600">
                    {activeSlot?.slot.timeSlot}
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
                  onClick={() => setIsModalOpen(false)}
                >
                  Annulla
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => {
                    // Handle delete
                    setIsModalOpen(false);
                  }}
                >
                  Elimina
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => {
                    // Handle save
                    setIsModalOpen(false);
                  }}
                >
                  Salva
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileScheduleCalendar;