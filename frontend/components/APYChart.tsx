"use client";

import { useState, useEffect } from "react";
import { getAssetAPYHistory, formatChartData, APYSnapshot } from "@/services/graphService";

interface APYChartProps {
  assetAddress: string;
  assetSymbol: string;
}

export default function APYChart({ assetAddress, assetSymbol }: APYChartProps) {
  const [timeframe, setTimeframe] = useState<'30D' | '6M' | '1Y'>('30D');
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const snapshots = await getAssetAPYHistory(assetAddress, timeframe);
        
        if (snapshots.length === 0) {
          setError("No historical data available yet");
          setChartData([]);
          return;
        }
        
        const formatted = formatChartData(snapshots, 'supplyAPY');
        setChartData(formatted);
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError("Failed to load chart data");
      } finally {
        setIsLoading(false);
      }
    };

    loadChartData();
  }, [assetAddress, timeframe]);

  // Calculate min and max for Y-axis
  const values = chartData.map(d => d.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 20);
  const range = maxValue - minValue || 1;

  // SVG dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate path for line chart
  const generatePath = () => {
    if (chartData.length === 0) return "";
    
    const points = chartData.map((d, i) => {
      const x = padding.left + (i / (chartData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    });
    
    return points.join(' ');
  };

  // Generate area path
  const generateAreaPath = () => {
    if (chartData.length === 0) return "";
    
    const path = generatePath();
    const lastPoint = chartData.length - 1;
    const x1 = padding.left + (lastPoint / (chartData.length - 1)) * chartWidth;
    const x0 = padding.left;
    const y0 = padding.top + chartHeight;
    
    return `${path} L ${x1} ${y0} L ${x0} ${y0} Z`;
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-green-400/30 cursor-pointer transition-all duration-300 hover-glow animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          <span className="text-white">Supply</span>{" "}
          <span className="text-gradient-zen">info</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimeframe('30D')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all duration-300 ${
              timeframe === '30D'
                ? 'bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 text-white border border-green-400/30'
                : 'text-gray-400 hover:text-green-400 border border-transparent'
            }`}
          >
            30D
          </button>
          <button
            onClick={() => setTimeframe('6M')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all duration-300 ${
              timeframe === '6M'
                ? 'bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 text-white border border-green-400/30'
                : 'text-gray-400 hover:text-green-400 border border-transparent'
            }`}
          >
            6M
          </button>
          <button
            onClick={() => setTimeframe('1Y')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all duration-300 ${
              timeframe === '1Y'
                ? 'bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 text-white border border-green-400/30'
                : 'text-gray-400 hover:text-green-400 border border-transparent'
            }`}
          >
            1Y
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2">Data will appear after transactions are indexed</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            <p className="text-sm">No data available</p>
          </div>
        ) : (
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = padding.top + (i / 4) * chartHeight;
              const value = maxValue - (i / 4) * range;
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    fill="rgba(255,255,255,0.5)"
                    fontSize="10"
                    textAnchor="end"
                  >
                    {value.toFixed(1)}%
                  </text>
                </g>
              );
            })}

            {/* Area gradient */}
            <defs>
              <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area */}
            <path
              d={generateAreaPath()}
              fill="url(#areaGradient)"
            />

            {/* Line */}
            <path
              d={generatePath()}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {chartData.map((d, i) => {
              const x = padding.left + (i / (chartData.length - 1)) * chartWidth;
              const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
              
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#22c55e"
                    stroke="#0a0e27"
                    strokeWidth="2"
                  />
                  {/* Tooltip on hover */}
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill="transparent"
                    className="cursor-pointer hover:fill-white/10"
                  >
                    <title>{`${d.date}: ${d.value.toFixed(2)}%`}</title>
                  </circle>
                </g>
              );
            })}

            {/* X-axis labels */}
            {chartData.filter((_, i) => i % Math.ceil(chartData.length / 6) === 0).map((d, i, arr) => {
              const index = chartData.indexOf(d);
              const x = padding.left + (index / (chartData.length - 1)) * chartWidth;
              const y = height - padding.bottom + 20;
              
              return (
                <text
                  key={index}
                  x={x}
                  y={y}
                  fill="rgba(255,255,255,0.5)"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              );
            })}

            {/* Y-axis label */}
            <text
              x={padding.left - 40}
              y={padding.top + chartHeight / 2}
              fill="rgba(255,255,255,0.5)"
              fontSize="10"
              textAnchor="middle"
              transform={`rotate(-90, ${padding.left - 40}, ${padding.top + chartHeight / 2})`}
            >
              Supply APY (%)
            </text>
          </svg>
        )}
      </div>

      {/* Current APY */}
      {chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Current Supply APY</span>
            <span className="text-sm font-medium text-green-400">
              {chartData[chartData.length - 1]?.value.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
