// 📄 RecordsTablePreview.jsx

import React from 'react';

const RecordsCardPreview = () => {
  return (
    <div className="w-96 h-46 p-10  rounded-lg shadow-lg bg-records-background dark:bg-gray-800 border-2 border-table-border justify-items-center ">
      {/* Intestazione della tabella */}
     <table className="bg-table-background w-full rounded-xl">
       <thead className="bg-table-header">
         <tr>
           <th>Dato</th>
           <th>Valore</th>
           <th>Stato</th>
         </tr>
       </thead>
       <tbody>
         <tr className="hover:bg-gray-50">
           <td>Dato A</td>
           <td>Valore X</td>
           <td>Stato 1</td>
         </tr>
         <tr className="hover:bg-gray-50">
           <td>Dato B</td>
           <td>Valore Y</td>
           <td>Stato 2</td>
         </tr>
         <tr className="hover:bg-gray-50">
           <td>Dato C</td>
           <td>Valore Z</td>
           <td>Stato 3</td>
         </tr>
         <tr className="hover:bg-gray-50">
           <td>Dato D</td>
           <td>Valore W</td>
           <td>Stato 4</td>
         </tr>
       </tbody>
       <tfoot className="bg-table-header rounded-b-lg">
         <tr>
           <td colSpan={2} className="text-left text-sm font-semibold">Totale: 4</td>
           <td className="text-left text-sm font-bold"></td>
         </tr>
       </tfoot>
     </table>
    </div>
    
  );
};

export default RecordsCardPreview;