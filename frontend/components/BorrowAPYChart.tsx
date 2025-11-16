"use client";

import { useState, useEffect } from 'react';
import { getAssetAPYHistory } from '@/services/graphService';

interface BorrowAPYChartProps {
  assetAddress: string;
  assetSymbol: string;
}

type Timeframe = '30D' | '6M' | '1Y';

interface ChartDataPoint {
  timestamp: number;
  value: number;
  date: string;
}

export default function BorrowAPYChart({ assetAddress, assetSymbol }: BorrowAPYChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('30D');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getAssetAPYHistory(assetAddress, timeframe, 'borrow');
        setData(result);
      } catch (err) {
        console.error('Failed to load borrow APY data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [assetAddress, timeframe]);

  // Calculate chart dimensions
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const getYScale = () => {
    if (data.length === 0) return { min: 0, max: 10 };
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    return {
      min: Math.max(0, min - range * 0.1),
      max: max + range * 0.1
    };
  };

  const getXScale = () => {
    if (data.length === 0) return { min: 0, max: 1 };
    const timestamps = data.map(d => d.timestamp);
    return {
      min: Math.min(...timestamps),
      max: Math.max(...timestamps)
    };
  };

  const yScale = getYScale();
  const xScale = getXScale();

  // Generate path for line chart
  const generatePath = () => {
    if (data.length === 0) return '';

    return data.map((point, index) => {
      const x = padding.left + ((point.timestamp - xScale.min) / (xScale.max - xScale.min)) * chartWidth;
      const y = padding.top + chartHeight - ((point.value - yScale.min) / (yScale.max - yScale.min)) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Generate path for area under the line
  const generateAreaPath = () => {
    if (data.length === 0) return '';

    const linePath = data.map((point, index) => {
      const x = padding.left + ((point.timestamp - xScale.min) / (xScale.max - xScale.min)) * chartWidth;
      const y = padding.top + chartHeight - ((point.value - yScale.min) / (yScale.max - yScale.min)) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const firstX = padding.left;
    const lastX = padding.left + ((data[data.length - 1].timestamp - xScale.min) / (xScale.max - xScale.min)) * chartWidth;
    const bottomY = padding.top + chartHeight;

    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Format Y-axis labels
  const formatYAxis = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Generate Y-axis labels
  const yAxisLabels = () => {
    const labels = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const value = yScale.min + ((yScale.max - yScale.min) / steps) * i;
      const y = padding.top + chartHeight - ((value - yScale.min) / (yScale.max - yScale.min)) * chartHeight;
      labels.push({ value, y });
    }
    return labels;
  };

  // Generate X-axis labels
  const xAxisLabels = () => {
    if (data.length === 0) return [];
    const labels = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const index = Math.floor((data.length - 1) * (i / steps));
      const point = data[index];
      if (point) {
        const x = padding.left + ((point.timestamp - xScale.min) / (xScale.max - xScale.min)) * chartWidth;
        labels.push({ date: point.date, x });
      }
    }
    return labels;
  };

  return (
    <div className="w-full">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-400">Borrow APY History</h4>
        <div className="flex items-center gap-2">
          {(['30D', '6M', '1Y'] as Timeframe[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeframe(range)}
              className={`px-3 py-1 text-xs font-medium rounded transition-all duration-300 ${
                timeframe === range
                  ? 'bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 text-white border border-green-400/30'
                  : 'text-gray-400 hover:text-green-400 border border-transparent'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative bg-white/5 rounded-lg border border-white/10 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-gray-400 text-sm">Loading chart data...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-gray-400 text-sm">No data available for this timeframe</div>
          </div>
        ) : (
          <svg width={width} height={height} className="w-full">
            <defs>
              {/* Gradient for area fill */}
              <linearGradient id="borrowAreaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {yAxisLabels().map((label, index) => (
              <g key={index}>
                <line
                  x1={padding.left}
                  y1={label.y}
                  x2={width - padding.right}
                  y2={label.y}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={label.y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-400"
                >
                  {formatYAxis(label.value)}
                </text>
              </g>
            ))}

            {/* Area under the line */}
            <path
              d={generateAreaPath()}
              fill="url(#borrowAreaGradient)"
            />

            {/* Line chart */}
            <path
              d={generatePath()}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {data.map((point, index) => {
              const x = padding.left + ((point.timestamp - xScale.min) / (xScale.max - xScale.min)) * chartWidth;
              const y = padding.top + chartHeight - ((point.value - yScale.min) / (yScale.max - yScale.min)) * chartHeight;
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#ef4444"
                    className="hover:r-5 transition-all cursor-pointer"
                  />
                  <title>{`${point.date}: ${point.value.toFixed(2)}%`}</title>
                </g>
              );
            })}

            {/* X-axis labels */}
            {xAxisLabels().map((label, index) => (
              <text
                key={index}
                x={label.x}
                y={height - 5}
                textAnchor="middle"
                className="text-xs fill-gray-400"
              >
                {label.date}
              </text>
            ))}

            {/* Axes */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={height - padding.bottom}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
            />
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
            />
          </svg>
        )}
      </div>

      {/* Current APY Display */}
      {data.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-400">Current Borrow APY</span>
          <span className="text-red-400 font-semibold">
            {data[data.length - 1].value.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
}
