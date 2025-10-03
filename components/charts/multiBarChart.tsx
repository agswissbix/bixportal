import React, { useState } from 'react';

interface Dataset {
  label: string;
  data: number[];
}

interface ChartData {
  id: number;
  name: string;
  layout: string;
  labels: string[];
  datasets: Dataset[];
}

interface OverlayBarChartProps {
  chartData: ChartData;
  height?: number;
  leftAxisMax?: number;
  rightAxisMax?: number;
  colors?: string[];
}

export default function OverlayBarChart({ 
  chartData, 
  height = 320, 
  leftAxisMax,
  rightAxisMax,
  colors = ['#4A90E2', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6']
}: OverlayBarChartProps) {
  const [tooltip, setTooltip] = useState<{x: number, y: number, data: any} | null>(null);

  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    return <div className="text-center text-gray-500">Nessun dato disponibile</div>;
  }

  const { name, labels, datasets } = chartData;
  
  // Calculate max values for scaling
  const dataset1Max = leftAxisMax || Math.max(...datasets[0].data);
  const dataset2Max = rightAxisMax || (datasets[1] ? Math.max(...datasets[1].data) : dataset1Max);
  
  // Generate Y-axis labels
  const generateYAxisLabels = (max: number, steps = 8) => {
    const stepValue = max / steps;
    return Array.from({ length: steps + 1 }, (_, i) => Math.round(max - (i * stepValue)));
  };

  const leftYAxisLabels = generateYAxisLabels(dataset1Max);
  const rightYAxisLabels = datasets[1] ? generateYAxisLabels(dataset2Max) : leftYAxisLabels;

  const showTooltip = (e: React.MouseEvent, labelIndex: number, datasetIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      data: {
        label: labels[labelIndex],
        dataset: datasets[datasetIndex].label,
        value: datasets[datasetIndex].data[labelIndex]
      }
    });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  return (
    <div className="w-full p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        {name}
      </h2>
      
      {/* Chart Container */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        {/* Y-axis labels */}
        <div className="flex">
          {/* Left Y-axis */}
          <div className="flex flex-col justify-between w-12 text-xs text-gray-600 pr-2" style={{ height: `${height}px` }}>
            {leftYAxisLabels.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>
          
          {/* Chart area */}
          <div className="flex-1 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {leftYAxisLabels.map((_, i) => (
                <div key={i} className="border-t border-gray-200 w-full"></div>
              ))}
            </div>
            
            {/* Bars container */}
            <div className="flex justify-between items-end px-2 relative" style={{ height: `${height}px` }}>
              {labels.map((label, labelIndex) => (
                <div 
                  key={label} 
                  className="relative flex justify-center"
                  style={{ width: `${100 / labels.length}%` }}
                >
                  {/* First dataset bar (behind) */}
                  <div
                    className="rounded-t-sm cursor-pointer transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: colors[0],
                      height: `${(datasets[0].data[labelIndex] / dataset1Max) * (height - 40)}px`,
                      width: '24px',
                      position: 'absolute',
                      bottom: 0
                    }}
                    onMouseEnter={(e) => showTooltip(e, labelIndex, 0)}
                    onMouseLeave={hideTooltip}
                  >
                    {/* Value label on top of first bar */}
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">
                      {datasets[0].data[labelIndex]}
                    </div>
                  </div>
                  
                  {/* Second dataset bar (in front) - only if exists */}
                  {datasets[1] && (
                    <div
                      className="rounded-t-sm cursor-pointer transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: colors[1],
                        height: `${(datasets[1].data[labelIndex] / dataset2Max) * (height - 80)}px`,
                        width: '16px',
                        position: 'absolute',
                        bottom: 0,
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => showTooltip(e, labelIndex, 1)}
                      onMouseLeave={hideTooltip}
                    >
                      {/* Value label on top of second bar */}
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">
                        {datasets[1].data[labelIndex]}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional datasets (if more than 2) */}
                  {datasets.slice(2).map((dataset, datasetIndex) => (
                    <div
                      key={datasetIndex}
                      className="rounded-t-sm cursor-pointer transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: colors[datasetIndex + 2] || colors[0],
                        height: `${(dataset.data[labelIndex] / dataset1Max) * (height - 40)}px`,
                        width: `${20 - (datasetIndex * 2)}px`,
                        position: 'absolute',
                        bottom: 0,
                        zIndex: 20 + datasetIndex
                      }}
                      onMouseEnter={(e) => showTooltip(e, labelIndex, datasetIndex + 2)}
                      onMouseLeave={hideTooltip}
                    >
                      {/* Value label */}
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">
                        {dataset.data[labelIndex]}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            {/* X-axis labels */}
            <div className="flex justify-between px-2 mt-2">
              {labels.map((label) => (
                <div key={label} className="text-xs text-gray-600 transform -rotate-45 origin-left">
                  {label}
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Y-axis (only if second dataset exists) */}
          {datasets[1] && (
            <div className="flex flex-col justify-between w-12 text-xs text-gray-600 pl-2" style={{ height: `${height}px` }}>
              {rightYAxisLabels.map((label, index) => (
                <span key={index}>{label}</span>
              ))}
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex justify-center gap-4 flex-wrap">
          {datasets.map((dataset, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="rounded-sm" 
                style={{
                  backgroundColor: colors[index],
                  width: index === 0 ? '24px' : index === 1 ? '16px' : '20px',
                  height: '16px'
                }}
              ></div>
              <span className="text-sm text-gray-700">
                {dataset.label} {datasets[1] && index === 0 ? '(scala sinistra)' : datasets[1] && index === 1 ? '(scala destra)' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tooltip */}
      {tooltip && (
        <div 
          className="fixed bg-white p-3 border border-gray-300 rounded shadow-lg z-50 pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 50
          }}
        >
          <p className="font-semibold">{tooltip.data.label}</p>
          <p style={{ color: colors[datasets.findIndex(d => d.label === tooltip.data.dataset)] }}>
            {tooltip.data.dataset}: {tooltip.data.value}
          </p>
        </div>
      )}
    </div>
  );
}