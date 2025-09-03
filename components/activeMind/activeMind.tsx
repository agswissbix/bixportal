import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';
import ActiveMindServices from '@/components/activeMind/activeMindServices';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
// INTERFACCIA PROPS
interface PropsInterface {
  recordIdTrattativa?: string;
}

export default function ActiveMind({ recordIdTrattativa }: PropsInterface) {
    //DATI
    // DATI PROPS PER LO SVILUPPO
    const devPropRecordIdTrattativa = isDev ? "000012" : recordIdTrattativa;

    return (
			<div className='overflow-y-auto overflow-x-hidden h-screen'>
        <GenericComponent> 
            {() => (
              <ActiveMindServices recordIdTrattativa={devPropRecordIdTrattativa!} />
            )}
        </GenericComponent>
			</div>
    );
};


