import React, { use, useEffect, useMemo, useRef } from 'react';
import { useRecordsStore } from './records/recordsStore';
import { GridStack, GridStackOptions } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';

// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  searchTerm?: string;
}

export default function ExampleComponent({ tableid, searchTerm }: PropsInterface) {

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current) {
      const options: GridStackOptions = {
        float: true,
        cellHeight: 80,
        draggable: { handle: '.grid-stack-item-content' },
      };

      const grid = GridStack.init(options, gridRef.current);

      // Aggiungi widget di esempio (solo una volta)
      if (grid.engine.nodes.length === 0) {
        grid.addWidget({ w: 2, h: 2, content: 'Widget 1', id: 'widget-1' });
        grid.addWidget({ w: 3, h: 2, content: 'Widget 2', id: 'widget-2' });
      }

      return () => { grid.destroy(false); }; // pulizia
    }
    return undefined;
  }, []);

  return (
    <div className="grid-stack" ref={gridRef}></div>
  );
}
