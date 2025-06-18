import React, { use, useMemo } from 'react';
import { useRecordsStore } from './records/recordsStore';
import UserFavTables from './userFavTables'
import UserProfie from './userProfile';

// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  searchTerm?: string;
}

export default function UserSettings({ tableid, searchTerm }: PropsInterface) {

  return (
    <div className="h-full w-full">
      <UserProfie />
      <UserFavTables />
    </div>
  );
};

