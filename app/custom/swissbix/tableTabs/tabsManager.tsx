import React from 'react';
import CustomDeadlines from '@/app/custom/swissbix/tableTabs/customDeadline';
import CustomDeal from '@/app/custom/swissbix/tableTabs/customDeal';
import RecordsTable from '@/components/recordsTable';

interface PropsInterface {
  tableid?: string;
}

export default function tableTabsManager({ tableid }: PropsInterface) {
  switch (tableid || '') {
    case 'deadline':
        return <CustomDeadlines />;
    case 'deal':
        return <CustomDeal />;
    default:
      return <RecordsTable tableid={tableid} />;
  }
}
