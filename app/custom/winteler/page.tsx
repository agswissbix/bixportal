'use client'
import React, { use, useMemo } from 'react';
import AppLayout from '@/components/scheduleCalendar';
import WipBarcodeScan from './components/wipBarcodeScan';
// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
}

export default function CustomWinteler({ tableid }: PropsInterface) {

  return (
    <div>
      <WipBarcodeScan></WipBarcodeScan>
    </div>
  );
};

