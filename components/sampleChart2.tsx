import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toPng } from "html-to-image";
import * as XLSX from "sheetjs-style"; // Usiamo sheetjs-style per la formattazione

// --- DATI DI ESEMPIO ---
const sampleData1 = [
  { id: 1, Anno: 2007, attivi: 730, passivi: 120, junior: 80 },
  { id: 2, Anno: 2008, attivi: 780, passivi: 110, junior: 60 },
  { id: 3, Anno: 2020, attivi: 900, passivi: 150, junior: 60 },
  { id: 4, Anno: 2021, attivi: 920, passivi: 100, junior: 60 },
  { id: 5, Anno: 2025, attivi: 730, passivi: 107, junior: 81 },
];

const PIE_COLORS = ["#4A90E2", "#D0021B", "#F5A623"];

const sociToPie = (data, year) => {
  const record = data.find((d) => d.Anno === year);
  if (!record) return [];
  return [
    { name: "Attivi", value: record.attivi },
    { name: "Passivi", value: record.passivi },
    { name: "Junior", value: record.junior },
  ];
};

const CustomPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  value,
  percent,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-base font-bold pointer-events-none"
    >
      {`${value}; ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const DynamicPieChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <p className="text-center text-gray-500">
        Dati non disponibili per l'anno selezionato.
      </p>
    );
  }

  return (
      <ResponsiveContainer
          width="100%"
          height="100%">
          <PieChart>
              <Legend
                  layout="horizontal"
                  verticalAlign="top"
                  align="center"
                  iconSize={12}
                  iconType="square"
                  wrapperStyle={{ paddingBottom: "20px" }}
              />
              <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  fill="#8884d8"
                  labelLine={false}
                  label={(props: any) => <CustomPieLabel {...props} />}>
                  {data.map((entry, index) => (
                      <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                  ))}
              </Pie>
              <Tooltip
                  formatter={(value) => [
                      new Intl.NumberFormat("it-IT").format(value as number),
                      "Soci",
                  ]}
                  cursor={{ fill: "rgba(200, 200, 200, 0.2)" }}
              />
          </PieChart>
      </ResponsiveContainer>
  );
};

const App = ({ onOpenPopup }) => {
  const dataPie2025 = useMemo(() => sociToPie(sampleData1, 2025), []);
  const chartRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setReady(true);
      observer.disconnect();
    });
    if (chartRef.current) {
      observer.observe(chartRef.current);
    }
  }, []);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    setExporting(true);

    const buttons = chartRef.current.querySelector(".no-export");
    if (buttons) buttons.style.display = "none";

    try {
      await new Promise((res) => setTimeout(res, 500));
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = "grafico-soci-2025.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Errore PNG:", err);
    } finally {
      if (buttons) buttons.style.display = "";
      setExporting(false);
    }
  };

 const handleExcelExport = () => {
  const record = sampleData1.find((d) => d.Anno === 2025);
  if (!record) return;

  const data = [
    ["Categoria", "Valore"],
    ["Attivi", record.attivi],
    ["Passivi", record.passivi],
    ["Junior", record.junior],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  worksheet["!cols"] = [{ wch: 20 }, { wch: 20 }];

  // Stile base per tutte le celle: bordi + centratura orizzontale e verticale
  const baseStyle = {
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  // Stile header personalizzato
  const headerStyle = {
    font: { bold: true, color: { rgb: "000000" } },
    fill: { fgColor: { rgb: "DCE6F1" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cell_address]) continue;
      // Applica stile header alla prima riga, altrimenti baseStyle
      worksheet[cell_address].s = R === 0 ? headerStyle : baseStyle;
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Composizione 2025");
  XLSX.writeFile(workbook, "composizione-soci-2025.xlsx");
};

  return (
    <div>
      <button
        onClick={onOpenPopup}
        className="top-4 right-4 z-10 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
        title="Apri dettagli aggiuntivi"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <div
        ref={chartRef}
        className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-6 flex flex-col"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Il GCPA oggi</h1>
          <h2 className="text-lg text-gray-500 mb-6">
            2025 – Composizione compagine sociale GCPA (statuto)
          </h2>
        </div>

        <div className="w-full flex-grow h-[450px] mt-2">
          <DynamicPieChart data={dataPie2025} />
        </div>

        <div className="mt-4 flex justify-center gap-4 no-export">
          <button
            onClick={handleDownload}
            disabled={!ready || exporting}
            className={`px-4 py-2 rounded ${
              ready && !exporting
                ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                : "bg-blue-300 cursor-not-allowed"
            } text-white transition duration-200`}
          >
            {exporting ? "Esportazione..." : ready ? "Scarica PNG" : "Caricamento..."}
          </button>

          <button
            onClick={handleExcelExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition duration-200"
          >
            Scarica Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
