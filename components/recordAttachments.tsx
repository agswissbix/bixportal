import React, { use, useMemo } from 'react';
import { useRecordsStore } from './records/recordsStore';
import GalleryView from './gallery';

// INTERFACCIA PROPS
interface PropsInterface {
  tableid: string;
}

export default function RecordAttachments({ tableid }: PropsInterface) {

  return (
    <div className="h-full w-full">
        <GalleryView
          tableid={tableid}
          context='linked'
        />
    </div>
  );
};

