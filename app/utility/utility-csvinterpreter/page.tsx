"use client";

import React, { useState } from "react";
import { UploadCloud, FileText, Trash2 } from "lucide-react";

export default function UtilityPage() {
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("Per favore, carica un file CSV valido.");
      return;
    }

    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        parseCSV(text);
      }
    };
    reader.onerror = () => {
      setError("Errore durante la lettura del file.");
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    // Basic CSV parser to handle quotes and newlines
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"' && insideQuotes && nextChar === '"') {
            currentCell += '"';
            i++; 
        } else if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if ((char === ',' || char === ';') && !insideQuotes) {
            // Support both comma and semicolon
            currentRow.push(currentCell.trim());
            currentCell = "";
        } else if (char === '\n' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = "";
        } else if (char === '\r' && !insideQuotes && nextChar === '\n') {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = "";
            i++;
        } else {
            currentCell += char;
        }
    }
    if (currentCell !== "" || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }
    
    const filteredRows = rows.filter(row => row.some(cell => cell !== ""));
    setCsvData(filteredRows);
  };

  const clearData = () => {
    setCsvData([]);
    setFileName("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Utility CSV visualizer</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            {!csvData.length ? (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-4 w-full h-full"
                >
                  <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-800">
                      Clicca per caricare il tuo file CSV
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      (Il file verrà elaborato localmente senza essere inviato al server)
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3 text-green-800 mb-4 md:mb-0">
                  <FileText className="w-6 h-6" />
                  <span className="font-medium text-lg truncate max-w-[200px] md:max-w-xs">{fileName}</span>
                  <span className="text-sm bg-green-200 px-3 py-1 rounded-full whitespace-nowrap">
                    {csvData.length - 1} righe trovate
                  </span>
                </div>
                <button
                  onClick={clearData}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-800 hover:bg-red-50 px-4 py-2 rounded-md transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Rimuovi File</span>
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {csvData.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
                <table className="min-w-full text-left border-collapse">
                  <thead className="bg-gray-100 z-10 sticky top-0 shadow-sm border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-100 w-16 text-center">#</th>
                      {csvData[0].map((header, index) => (
                        <th
                          key={index}
                          className="px-6 py-4 text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap bg-gray-100"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {csvData.slice(1).map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-500 font-medium text-center border-r border-gray-100 bg-gray-50/50">
                          {rowIndex + 1}
                        </td>
                        {/* Fill missing cells with empty strings if the row is shorter than header */}
                        {csvData[0].map((_, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap max-w-sm overflow-hidden text-ellipsis border-r border-gray-100"
                            title={row[cellIndex] || ""}
                          >
                            {row[cellIndex] || <span className="text-gray-300 italic">Vuoto</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
