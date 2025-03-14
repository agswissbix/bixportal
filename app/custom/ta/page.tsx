'use client'
import React, { use, useMemo } from 'react';
import AppLayout from './components/scheduleCalendar';

// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  searchTerm?: string;
}

export default function ExampleComponent({ tableid, searchTerm }: PropsInterface) {

  return (
    <div className="h-full w-full">
      <AppLayout />
    </div>
  );
};

