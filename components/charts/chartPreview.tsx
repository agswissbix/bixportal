import React, { useEffect, useMemo, useState } from "react";
import { useApi } from "@/utils/useApi";
import BlockChart from "../blockChart";
import GenericComponent from "../genericComponent";

interface ChartPreviewProps {
  chartId: number;
  viewId: number
}

interface ChartResponse {
  id: number;
  name: string;
  type: string;
  chart_data: string;
  config?: any;
}

const ChartPreview: React.FC<ChartPreviewProps> = ({ chartId,viewId }) => {
  const payload = useMemo(() => {
    return {
        apiRoute: "get_chart_data",
        chart_id: chartId,
        viewid: viewId
    }
  }, [chartId, viewId])

  const { response, loading, error } = useApi<ChartResponse>(payload);

  return (
    <GenericComponent response={response} loading={loading} error={error}>
      {(response: ChartResponse) => (
        <div className="bg-white border rounded-lg shadow-sm p-6 h-[35rem]">

        {response?.type !== "table" && (
        <BlockChart
            id={response.id}
            name={response.name}
            type={response.type}
            chart_data={response.chart_data || ""}
            onDelete={() => {}}
            onExport={() => {}}
        />
        )}
        </div>
      )}
      </GenericComponent>
  );
};

export default ChartPreview;
