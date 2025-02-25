'use client'
import React, { use, useMemo } from 'react';
import AppLayout from '@/components/scheduleCalendar';
// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  searchTerm?: string;
}

export default function Custom({ tableid, searchTerm }: PropsInterface) {

  return (
    <AppLayout />
  );
};

