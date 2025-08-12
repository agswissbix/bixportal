import React, { useMemo, useContext, useState, useEffect } from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "./genericComponent";
import { AppContext } from "@/context/appContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface PropsInterface {
  propExampleValue?: string;
  selectedGlobalYear: string;
  selectedCompareYear?: string;
  dashboardRevenueData: any[]; // Replace 'any' with proper interface for your revenue data
}

interface ResponseInterface {
  responseExampleValue: string;
}

function BarChartComp({
  propExampleValue,
  selectedGlobalYear,
  selectedCompareYear,
  dashboardRevenueData,
}: PropsInterface) {
  const { user } = useContext(AppContext);
  const [responseData, setResponseData] = useState<ResponseInterface>({
    responseExampleValue: "Default",
  });

  // PAYLOAD
  const payload = useMemo(() => {
    return {
      apiRoute: "examplepost",
      example1: propExampleValue,
    };
  }, [propExampleValue]);

  // API CALL
  const { response, loading, error } = useApi<ResponseInterface>(payload);

  // UPDATE RESPONSE WITH BACKEND DATA
  useEffect(() => {
    if (response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
    }
  }, [response, responseData]);

  const dashboardTickStyle = {
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    color: "#6b7280",
  };

  return (
    <GenericComponent
      response={responseData}
      loading={loading}
      error={error}
      data-oid="slujntb"
    >
      {() => (
        <div className="col-span-8 space-y-6" data-oid="ev.gg9e">
          {/* Revenue Chart */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            data-oid="gnpu.de"
          >
            <h2
              className="text-xl font-semibold text-gray-900 mb-6"
              data-oid="4q223-3"
            >
              Fatturato Mensile - {selectedGlobalYear}
              {selectedCompareYear && ` vs ${selectedCompareYear}`}
            </h2>
            <div className="h-80" data-oid="am6vwb5">
              <ResponsiveContainer
                width="100%"
                height="100%"
                data-oid="qxtr2rv"
              >
                <BarChart
                  data={dashboardRevenueData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                  data-oid="tej4gwb"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0, 0, 0, 0.1)"
                    data-oid="qz:chlj"
                  />

                  <XAxis
                    dataKey="month"
                    tick={dashboardTickStyle}
                    data-oid="qmb2ync"
                  />

                  <YAxis
                    tickFormatter={(value) =>
                      `€${(value / 1000).toLocaleString("it-IT")}k`
                    }
                    tick={dashboardTickStyle}
                    width={70}
                    data-oid="quqtt2-"
                  />

                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const label =
                        name === "revenue"
                          ? selectedGlobalYear
                          : selectedCompareYear;
                      return [`€${value.toLocaleString("it-IT")}`, label];
                    }}
                    wrapperStyle={{
                      fontFamily: "Inter, sans-serif",
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ color: "#1f2937", fontWeight: "600" }}
                    itemStyle={{ color: "#059669" }}
                    data-oid="we5-ssx"
                  />

                  <Bar
                    dataKey="revenue"
                    name="revenue"
                    fill="rgba(16, 185, 129, 0.8)"
                    stroke="rgba(5, 150, 105, 1)"
                    radius={[6, 6, 0, 0]}
                    data-oid="l30csox"
                  />

                  {selectedCompareYear && (
                    <Bar
                      dataKey="compareRevenue"
                      name="compareRevenue"
                      fill="rgba(59, 130, 246, 0.8)"
                      stroke="rgba(37, 99, 235, 1)"
                      radius={[6, 6, 0, 0]}
                      data-oid="fgotqod"
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </GenericComponent>
  );
}

export default BarChartComp;
