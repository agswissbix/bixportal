import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * A component to display aggregated data in various chart types.
 * @param {object[]} data - The array of objects to analyze.
 * @param {string} valueField - The key for the numeric field for the formula.
 * @param {string} categoryField - The key for the field to group data by.
 * @param {'sum' | 'average' | 'count'} aggregationType - The type of aggregation.
 * @param {'bar' | 'line' | 'pie'} chartType - The type of chart to display.
 */
const DynamicChart = ({
  data,
  valueField,
  categoryField,
  aggregationType,
  chartType,
}) => {
  // useMemo hook to process data only when dependencies change
  const processedData = useMemo(() => {
    if (!data || !valueField || !categoryField || !aggregationType) {
      return [];
    }

    // Group data by the specified category field
    const grouped = data.reduce((acc, item) => {
      const key = item[categoryField];
      // Skip items with null or undefined keys
      if (key === undefined || key === null) return acc;

      if (!acc[key]) {
        acc[key] = [];
      }
      const value = parseFloat(item[valueField]);
      // Push the value if it's a valid number
      if (!isNaN(value)) {
        acc[key].push(value);
      }
      return acc;
    }, {});

    // Aggregate the grouped data based on the aggregation type
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
  }, [data, valueField, categoryField, aggregationType]);

  // Colors for the Pie Chart
  const PIE_COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#AF19FF",
    "#FF1943",
  ];

  // Formatter for the tooltip value, handling currency
  const valueFormatter = (value) => {
    if (typeof value !== "number") return value;
    const currencyFields = [
      "cifra_affari",
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
    return value.toLocaleString("it-IT");
  };

  // Formatter for the Y-axis to keep labels compact
  const yAxisFormatter = (value) =>
    new Intl.NumberFormat("it-IT", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);

  // Renders the appropriate chart based on the chartType prop
  const renderChart = () => {
    if (processedData.length === 0) {
      return (
        <p className="text-center text-gray-500" data-oid="5l_v5io">
          Dati non sufficienti per visualizzare il grafico.
        </p>
      );
    }

    switch (chartType) {
      case "bar":
        return (
          <BarChart data={processedData} data-oid="kh4lx7g">
            <CartesianGrid strokeDasharray="3 3" data-oid="g_ctwlw" />
            <XAxis dataKey="name" data-oid="01--gku" />
            <YAxis tickFormatter={yAxisFormatter} data-oid="6uwdeml" />
            <Tooltip formatter={valueFormatter} data-oid="coompfm" />
            <Legend data-oid="a1gmots" />
            <Bar
              dataKey="value"
              fill="#8884d8"
              name={`${aggregationType} di ${valueField}`}
              data-oid="8ckr.hy"
            />
          </BarChart>
        );

      case "line":
        return (
          <LineChart data={processedData} data-oid="jddi5ll">
            <CartesianGrid strokeDasharray="3 3" data-oid="wkfjre2" />
            <XAxis dataKey="name" data-oid="kugw45f" />
            <YAxis tickFormatter={yAxisFormatter} data-oid=":sgux-_" />
            <Tooltip formatter={valueFormatter} data-oid="2_9xc:h" />
            <Legend data-oid="sd9db.6" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#82ca9d"
              name={`${aggregationType} di ${valueField}`}
              data-oid="gm574s."
            />
          </LineChart>
        );

      case "pie":
        return (
          <PieChart data-oid="0di_-0s">
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
              data-oid="k-tfx3_"
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                  data-oid="eetinyn"
                />
              ))}
            </Pie>
            <Tooltip formatter={valueFormatter} data-oid="y4rp4vt" />
            <Legend data-oid="onoyth4" />
          </PieChart>
        );

      default:
        return (
          <p className="text-center text-gray-500" data-oid="m8_oe9v">
            Tipo di grafico non supportato.
          </p>
        );
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%" data-oid="g-brnc.">
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default DynamicChart;
