"use client";

import React, { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { UploadCloud, FileText, Trash2, PhoneCall, Smartphone, Phone, Activity, Printer } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

interface LogEntry {
  id: number;
  timestamp: string;
  overallScore: string | number;
  caller: any;
  callee: any;
}

export default function Utility3CXLog() {
  const [logData, setLogData] = useState<LogEntry[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Report_3CX_Log",
  });

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
    
    // Parse the specific 3cx format
    const entries = rows.slice(1).filter(row => row.length >= 4).map((row, index) => {
        const timestamp = row[2] || "Sconosciuto";
        const jsonStr = row[3];
        let parsedJson = null;

        try {
            parsedJson = JSON.parse(jsonStr);
        } catch (e) {
            return null; // Skip invalid rows
        }

        return {
            id: index,
            timestamp,
            overallScore: parsedJson?.OverallScore ?? "N/A",
            caller: parsedJson?.Party1 ?? {},
            callee: parsedJson?.Party2 ?? {},
        };
    }).filter((item): item is LogEntry => item !== null && item.overallScore !== 0 && item.overallScore !== "0");

    if (entries.length === 0) {
        setError("Nessun dato 3CX valido trovato nel CSV fornito.");
    }

    setLogData(entries);
  };

  const clearData = () => {
    setLogData([]);
    setFileName("");
    setError("");
  };

  const getScoreColor = (score: number | string) => {
    if (score === "N/A") return "bg-gray-100 text-gray-800 border-gray-200";
    const num = Number(score);
    if (num >= 4) return "bg-green-100 text-green-800 border-green-200";
    if (num >= 3) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getJitterColor = (tx: any, rx: any) => {
    if ((tx === null || tx === undefined || tx === "") && (rx === null || rx === undefined || rx === "")) return "bg-gray-50 text-gray-600 border-gray-200";
    const maxVal = Math.max(Number(tx) || 0, Number(rx) || 0);
    if (maxVal < 10) return "bg-green-50 text-green-700 border-green-200";
    if (maxVal <= 20) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const getLossColor = (tx: any, rx: any) => {
    if ((tx === null || tx === undefined || tx === "") && (rx === null || rx === undefined || rx === "")) return "bg-gray-50 text-gray-600 border-gray-200";
    const maxVal = Math.max(Number(tx) || 0, Number(rx) || 0);
    if (maxVal <= 0.5) return "bg-green-50 text-green-700 border-green-200";
    if (maxVal <= 2) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const pieData = React.useMemo(() => {
    const counts: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0, "N/A": 0 };
    logData.forEach(call => {
      const s = call.overallScore;
      if (s === "N/A") {
         counts["N/A"]++;
      } else {
         const scoreVal = Math.round(Number(s));
         if (scoreVal >= 5) counts["5"]++;
         else if (scoreVal === 4) counts["4"]++;
         else if (scoreVal === 3) counts["3"]++;
         else if (scoreVal === 2) counts["2"]++;
         else counts["1"]++;
      }
    });
    return [
      { name: "Score 5", value: counts["5"], color: "#10b981" },
      { name: "Score 4", value: counts["4"], color: "#a3e635" },
      { name: "Score 3", value: counts["3"], color: "#fbbf24" },
      { name: "Score 2", value: counts["2"], color: "#fb923c" },
      { name: "Score 1", value: counts["1"], color: "#ef4444" },
      { name: "Non Assegnato", value: counts["N/A"], color: "#9ca3af" }
    ].filter(d => d.value > 0);
  }, [logData]);

  const lineData = React.useMemo(() => {
    const timeGroups: Record<string, { sum: number; count: number }> = {};
    logData.forEach(call => {
      if (call.overallScore !== "N/A") {
        const dateKey = call.timestamp.substring(0, 10);
        if (!timeGroups[dateKey]) timeGroups[dateKey] = { sum: 0, count: 0 };
        timeGroups[dateKey].sum += Number(call.overallScore);
        timeGroups[dateKey].count += 1;
      }
    });

    return Object.entries(timeGroups)
      .map(([time, data]) => ({
        time,
        scoreMedio: parseFloat((data.sum / data.count).toFixed(2))
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [logData]);

  return (
    <div className="bg-gray-50 p-4 md:p-8 font-sans h-screen overflow-y-auto pb-20">
      <div className="max-w-[1500px] mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Utility 3CX Log Interpreter</h1>
            <p className="text-gray-500 mt-1">Carica il log chiamate CSV esportato dal sistema 3CX</p>
          </div>
          {logData.length > 0 && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-4 py-2 border border-blue-200 rounded-md transition-colors bg-white shadow-sm print:hidden"
              >
                <Printer className="w-5 h-5" />
                <span>Stampa / PDF</span>
              </button>
              <button
                onClick={clearData}
                className="flex items-center space-x-2 text-red-600 hover:text-red-800 hover:bg-red-50 px-4 py-2 border border-red-200 rounded-md transition-colors bg-white shadow-sm print:hidden"
              >
                <Trash2 className="w-5 h-5" />
                <span>Rimuovi File</span>
              </button>
            </div>
          )}
        </div>
        
        {!logData.length ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-8">
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
                <div className="p-4 bg-green-50 rounded-full text-green-600">
                  <UploadCloud className="w-10 h-10" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-800">
                    Clicca per caricare il tuo file CSV
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    I log 3CX verranno decodificati automaticamente
                  </p>
                </div>
              </label>
            </div>
            
            {error && (
              <div className="mt-4 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm flex items-center mb-4 print:hidden">
               <FileText className="w-5 h-5 text-gray-500 mr-2" />
               <span className="font-medium text-gray-800 mr-2">{fileName}</span>
               <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                  {logData.length} chiamate analizzate
               </span>
            </div>

            <div ref={componentRef} className="space-y-6 print:block">
              <div className="hidden print:block p-4 font-bold text-2xl mb-2 text-gray-800">Report 3CX Log Analytics</div>
              <div className="hidden print:block px-4 text-gray-500 mb-6 border-b pb-4">File sorgente: {fileName} | Chiamate Analizzate: {logData.length}</div>

              {/* Sezione Grafici */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:mb-8">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0">
                  <h3 className="font-semibold text-gray-700 text-center mb-4 text-sm uppercase tracking-wider">Distribuzione Qualità (Overall Score)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0">
                  <h3 className="font-semibold text-gray-700 text-center mb-4 text-sm uppercase tracking-wider">Trend Qualità (Media Giornaliera)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="time" fontSize={11} tickMargin={10} />
                        <YAxis domain={[0, 5]} fontSize={11} />
                        <RechartsTooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }}/>
                        <Line
                          type="monotone"
                          dataKey="scoreMedio"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          name="Score Medio"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Sezione Tabella */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto max-h-[60vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none">
                <table className="min-w-full text-left border-collapse text-sm whitespace-nowrap relative">
                <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600 w-32">Data e Ora</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-center w-20">Score</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 min-w-[200px]">Da (User Agent)</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 min-w-[200px]">A (User Agent)</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 w-40 text-center">Jitter (Tx/Rx)</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 w-40 text-center">Pack. Loss % (Tx/Rx)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logData.map((call) => (
                    <tr key={call.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700">{call.timestamp}</td>
                      <td className="px-4 py-3 text-center">
                        <div className={`mx-auto w-10 h-10 flex items-center justify-center rounded-full text-lg font-extrabold border-2 shadow-sm ${getScoreColor(call.overallScore)}`}>
                          {call.overallScore}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium max-w-[250px] truncate" title={call.caller.UserAgent}>
                        {call.caller.UserAgent || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium max-w-[250px] truncate" title={call.callee.UserAgent}>
                        {call.callee.UserAgent || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        <div className="flex flex-col gap-1 items-center">
                          <span className={`px-1.5 py-0.5 rounded w-full text-center border font-medium ${getJitterColor(call.caller.TxJitter, call.caller.RxJitter)}`}>Da: {call.caller.TxJitter ?? "-"}/{call.caller.RxJitter ?? "-"} ms</span>
                          <span className={`px-1.5 py-0.5 rounded w-full text-center border font-medium ${getJitterColor(call.callee.TxJitter, call.callee.RxJitter)}`}>A: {call.callee.TxJitter ?? "-"}/{call.callee.RxJitter ?? "-"} ms</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        <div className="flex flex-col gap-1 items-center">
                          <span className={`px-1.5 py-0.5 rounded w-full text-center border font-medium ${getLossColor(call.caller.TxLost, call.caller.RxLost)}`}>Da: {call.caller.TxLost ?? "-"}/{call.caller.RxLost ?? "-"} %</span>
                          <span className={`px-1.5 py-0.5 rounded w-full text-center border font-medium ${getLossColor(call.callee.TxLost, call.callee.RxLost)}`}>A: {call.callee.TxLost ?? "-"}/{call.callee.RxLost ?? "-"} %</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
