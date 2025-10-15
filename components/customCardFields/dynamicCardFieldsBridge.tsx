import React from "react";
import cardFieldsMap from "./customCardFieldsMap";

interface PropsInterface {
  tableId: string;
  recordid:string
  mastertableid:string
  masterrecordid:string
  [key: string]: any;
}

const DynamicTableBridge = ({ tableId, recordid, mastertableid, masterrecordid, ...rest } : PropsInterface) => {
  const ComponentToRender = cardFieldsMap[tableId];

  if (!ComponentToRender) {
    return (
      <div className="text-red-500 p-4">
        Nessun componente trovato per <b>{tableId}</b>
      </div>
    );
  }

  return (
    <ComponentToRender
      tableid={tableId}
      recordid={recordid}
      mastertableid={mastertableid}
      masterrecordid={masterrecordid}
      {...rest}
    />
  )
};

export default DynamicTableBridge;
