import React, { use, useMemo } from 'react';
import { useRecordsStore } from './records/recordsStore';

// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  searchTerm?: string;
}

export default function Kanban({ tableid, searchTerm }: PropsInterface) {

  const {handleRowClick} = useRecordsStore();
  return (
    <div>
        <p>Kanban</p>
    </div>
  );
};

