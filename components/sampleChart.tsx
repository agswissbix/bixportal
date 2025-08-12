import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ComposedChart, // Import ComposedChart for mixed types
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- SAMPLE DATA ---
// Data for the charts
const sampleData1 = [
  { id: 1, Anno: 2007, nr_giri_soci: 8575, nr_soci: 567 },
  { id: 2, Anno: 2008, nr_giri_soci: 9299, nr_soci: 576 },
  { id: 3, Anno: 2020, nr_giri_soci: 21926, nr_soci: 737 },
  { id: 4, Anno: 2021, nr_giri_soci: 23328, nr_soci: 761 },
];

// --- UTILITY FUNCTION for Data Processing ---
const processChartData = (data, valueField, categoryField, aggregationType) => {
  if (!data || !valueField || !categoryField || !aggregationType) {
    return [];
  }

  const grouped = data.reduce((acc, item) => {
    const key = item[categoryField];
    if (key === undefined || key === null) return acc;

    if (!acc[key]) {
      acc[key] = [];
    }
    const value = parseFloat(item[valueField]);
    if (!isNaN(value)) {
      acc[key].push(value);
    }
    return acc;
  }, {});

  return Object.entries(grouped).map(([name, values]) => {
    let aggregatedValue;
    switch (aggregationType) {
      case "sum":
        aggregatedValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case "average":
        aggregatedValue =
          values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case "count":
        aggregatedValue = values.length;
        break;
      default:
        aggregatedValue = 0;
    }
    return { name, value: aggregatedValue };
  });
};

// --- UI COMPONENTS ---

const Select = ({ label, value, onChange, options }) => (
  <div className="w-full" data-oid="0.mra.d">
    <label
      className="block text-sm font-medium text-gray-700 mb-1"
      data-oid="nd10k_z"
    >
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
      data-oid="bgo1jc-"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} data-oid="nx2bpv_">
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const Button = ({ onClick, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full p-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
    data-oid=".av_586"
  >
    {children}
  </button>
);

// --- DYNAMIC CHART COMPONENT ---
const DynamicChart = ({
  data,
  valueField,
  categoryField,
  aggregationType,
  chartType,
}) => {
  const processedData = useMemo(() => {
    return processChartData(data, valueField, categoryField, aggregationType);
  }, [data, valueField, categoryField, aggregationType]);

  const PIE_COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#AF19FF",
    "#FF1943",
  ];

  const valueFormatter = (value) => {
    if (typeof value !== "number") return value;
    const currencyFields = [
      "nr_soci",
      "tassa_ammissione",
      "tassa_annua",
      "vendite",
      "profitto",
    ];
    if (currencyFields.includes(valueField)) {
      return new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "CHF",
      }).format(value);
    }
    if (valueField === "media_giri_per_socio") {
      return value.toFixed(2);
    }
    return value.toLocaleString("it-IT");
  };

  const yAxisFormatter = (value) =>
    new Intl.NumberFormat("it-IT", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);

  const renderChart = () => {
    if (processedData.length === 0) {
      return (
        <p className="text-center text-gray-500" data-oid="q48mi_f">
          Dati non sufficienti per visualizzare il grafico.
        </p>
      );
    }

    const legendName = `${aggregationType.charAt(0).toUpperCase() + aggregationType.slice(1)} di ${valueField}`;

    switch (chartType) {
      case "bar":
        return (
          <BarChart data={processedData} data-oid="vqtjs.h">
            <CartesianGrid strokeDasharray="3 3" data-oid=":os8uzs" />
            <XAxis dataKey="name" data-oid="e60n.wr" />
            <YAxis tickFormatter={yAxisFormatter} data-oid="9ldvldr" />
            <Tooltip formatter={valueFormatter} data-oid="4o::l5q" />
            <Legend data-oid="ymrhyq5" />
            <Bar
              dataKey="value"
              fill="#8884d8"
              name={legendName}
              data-oid="2egzqd."
            />
          </BarChart>
        );

      case "line":
        return (
          <LineChart data={processedData} data-oid=":6enbz2">
            <CartesianGrid strokeDasharray="3 3" data-oid="4j2u4ue" />
            <XAxis dataKey="name" data-oid="0mtk4k8" />
            <YAxis tickFormatter={yAxisFormatter} data-oid="jrttylh" />
            <Tooltip formatter={valueFormatter} data-oid="-e7mfef" />
            <Legend data-oid="wubqb-1" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#82ca9d"
              name={legendName}
              data-oid="ufveell"
            />
          </LineChart>
        );

      case "pie":
        return (
          <PieChart data-oid="kggls1h">
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={"80%"}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              data-oid="egmoj6b"
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                  data-oid="_ns6318"
                />
              ))}
            </Pie>
            <Tooltip formatter={valueFormatter} data-oid="r_gt7ek" />
            <Legend data-oid="fc6gd1e" />
          </PieChart>
        );

      default:
        return (
          <p className="text-center text-gray-500" data-oid="vxx4hid">
            Tipo di grafico non supportato.
          </p>
        );
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%" data-oid="17b7y4i">
      {renderChart()}
    </ResponsiveContainer>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
const App = () => {
  const [chartType1, setChartType1] = useState("bar");
  const [chartType2, setChartType2] = useState("line");
  const [isPapaReady, setIsPapaReady] = useState(false);

  const [valueField1] = useState("nr_giri_soci");

  // Load PapaParse library for CSV export
  useEffect(() => {
    if (window.Papa) {
      setIsPapaReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js";
    script.async = true;
    script.onload = () => setIsPapaReady(true);
    document.body.appendChild(script);
  }, []);

  // --- Data pre-computation ---
  const dataForChart2 = useMemo(() => {
    return sampleData1.map((item) => ({
      ...item,
      media_giri_per_socio:
        item.nr_soci > 0 ? item.nr_giri_soci / item.nr_soci : 0,
    }));
  }, []);

  const combinedData = useMemo(() => {
    const totalGiri = processChartData(
      sampleData1,
      "nr_giri_soci",
      "Anno",
      "sum",
    );
    const mediaGiri = processChartData(
      dataForChart2,
      "media_giri_per_socio",
      "Anno",
      "average",
    );

    const combined = totalGiri.map((item1) => {
      const item2 = mediaGiri.find((item) => item.name === item1.name);
      return {
        Anno: item1.name,
        totalGiri: item1.value,
        mediaGiri: item2 ? item2.value : 0,
      };
    });
    return combined;
  }, [dataForChart2]);

  // --- Utility Functions ---
  const handleExport = (data, fileName) => {
    if (!isPapaReady) {
      alert("Libreria di esportazione non ancora pronta.");
      return;
    }
    const csv = window.Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const yAxisFormatter = (value) =>
    new Intl.NumberFormat("it-IT", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);

  const combinedTooltipFormatter = (value, name) => {
    if (name === "Totale Giri") return [value.toLocaleString("it-IT"), name];
    if (name === "Media Giri per Socio") return [value.toFixed(2), name];
    return [value, name];
  };

  return (
    <div
      className="bg-gray-100 p-4 sm:p-6 font-sans min-h-screen"
      data-oid="qrjc7d-"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-6" data-oid="1qev.ld">
        {/* --- Row for the first two charts --- */}
        <div className="flex flex-col lg:flex-row gap-6" data-oid="m3-besa">
          <div
            className="w-full lg:w-1/2 bg-white rounded-xl shadow-lg p-6 flex flex-col"
            data-oid=".se4856"
          >
            <h2
              className="text-xl font-bold text-gray-800 mb-4"
              data-oid="2i9po-j"
            >
              Nr giri totali (Somma)
            </h2>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg"
              data-oid="s7ey2og"
            >
              <Select
                label="Tipo di Grafico"
                value={chartType1}
                onChange={setChartType1}
                options={[
                  { value: "bar", label: "Istogramma" },
                  { value: "line", label: "Linea" },
                  { value: "pie", label: "Torta" },
                ]}
                data-oid="68woa5d"
              />

              <Button
                onClick={() =>
                  handleExport(
                    processChartData(
                      sampleData1,
                      "nr_giri_soci",
                      "Anno",
                      "sum",
                    ),
                    "giri_totali.csv",
                  )
                }
                disabled={!isPapaReady}
                data-oid="idt96v_"
              >
                Esporta CSV
              </Button>
            </div>
            <div className="w-full flex-grow h-[400px] mt-2" data-oid="gtgncfs">
              <DynamicChart
                data={sampleData1}
                chartType={chartType1}
                aggregationType="sum"
                valueField={valueField1}
                categoryField="Anno"
                data-oid="lme4h4w"
              />
            </div>
          </div>

          <div
            className="w-full lg:w-1/2 bg-white rounded-xl shadow-lg p-6 flex flex-col"
            data-oid="0n1pu0i"
          >
            <h2
              className="text-xl font-bold text-gray-800 mb-4"
              data-oid="fkva8k:"
            >
              Media giri per socio (Media)
            </h2>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg"
              data-oid="a4rd:vi"
            >
              <Select
                label="Tipo di Grafico"
                value={chartType2}
                onChange={setChartType2}
                options={[
                  { value: "bar", label: "Istogramma" },
                  { value: "line", label: "Linea" },
                  { value: "pie", label: "Torta" },
                ]}
                data-oid="hzzyujt"
              />

              <Button
                onClick={() =>
                  handleExport(
                    processChartData(
                      dataForChart2,
                      "media_giri_per_socio",
                      "Anno",
                      "average",
                    ),
                    "media_giri_socio.csv",
                  )
                }
                disabled={!isPapaReady}
                data-oid="d:hx2ml"
              >
                Esporta CSV
              </Button>
            </div>
            <div className="w-full flex-grow h-[400px] mt-2" data-oid=".-fz1-8">
              <DynamicChart
                data={dataForChart2}
                chartType={chartType2}
                aggregationType="average"
                valueField="media_giri_per_socio"
                categoryField="Anno"
                data-oid="2luuhd5"
              />
            </div>
          </div>
        </div>

        {/* --- Row for the third chart (full width) --- */}
        <div
          className="w-full bg-white rounded-xl shadow-lg p-6 flex flex-col"
          data-oid="8lkm:ml"
        >
          <div
            className="flex justify-between items-center mb-4"
            data-oid=":_0rf9-"
          >
            <h2 className="text-xl font-bold text-gray-800" data-oid="_q-.0a4">
              Grafico Sovrapposto: Totale vs. Media
            </h2>
            <div className="w-full max-w-xs" data-oid="yb99mp3">
              <Button
                onClick={() => handleExport(combinedData, "dati_combinati.csv")}
                disabled={!isPapaReady}
                data-oid="gd_y2es"
              >
                Esporta CSV
              </Button>
            </div>
          </div>
          <div className="w-full flex-grow h-[450px] mt-2" data-oid=".d8yr:p">
            <ResponsiveContainer width="100%" height="100%" data-oid="g3lk317">
              <ComposedChart
                data={combinedData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                data-oid="tkobei2"
              >
                <CartesianGrid stroke="#f5f5f5" data-oid="i7_frag" />
                <XAxis dataKey="Anno" scale="band" data-oid="pk_hnrt" />
                <YAxis
                  yAxisId="left"
                  label={{
                    value: "Totale Giri",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  tickFormatter={yAxisFormatter}
                  data-oid="aiuq:46"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{
                    value: "Media per Socio",
                    angle: -90,
                    position: "insideRight",
                  }}
                  data-oid="ttbpq4q"
                />
                <Tooltip
                  formatter={combinedTooltipFormatter}
                  data-oid="-qa6e.g"
                />
                <Legend data-oid="_0.d75d" />
                <Bar
                  dataKey="totalGiri"
                  yAxisId="left"
                  name="Totale Giri"
                  barSize={20}
                  fill="#413ea0"
                  data-oid="czzpuem"
                />
                <Line
                  type="monotone"
                  yAxisId="right"
                  dataKey="mediaGiri"
                  name="Media Giri per Socio"
                  stroke="#ff7300"
                  data-oid="fyxsu0m"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
