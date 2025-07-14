import React, { use, useMemo } from 'react';
import { useRecordsStore } from './records/recordsStore';

// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  searchTerm?: string;
}

export default function ExampleComponent({ tableid, searchTerm }: PropsInterface) {

  return (
    <div className="h-full w-full">
      
    </div>
  );
};

