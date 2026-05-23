"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";

// ==========================================
// 1. LINE CHART
// ==========================================
interface LineChartProps {
  data: { label: string; values: number[] }[]; // values[0] = Total, values[1] = Allocated, values[2] = Pending
  seriesLabels?: string[];
  colors?: string[];
}

export function LineChart({
  data,
  seriesLabels = ["Total Leads", "Allocated", "Pending"],
  colors = ["#3b82f6", "#10b981", "#f59e0b"]
}: LineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 500;
  const height = 200;
  const paddingX = 40;
  const paddingY = 20;

  // Find max value in data
  const maxValue = useMemo(() => {
    let max = 10;
    data.forEach(d => {
      d.values.forEach(v => {
        if (v > max) max = v;
      });
    });
    return Math.ceil(max * 1.15); // Add padding to top
  }, [data]);

  // Coordinates calculators
  const getCoords = (idx: number, val: number) => {
    const x = paddingX + (idx / (data.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (val / maxValue) * (height - 2 * paddingY);
    return { x, y };
  };

  // Build SVG Paths
  const paths = useMemo(() => {
    if (data.length === 0) return { strokePaths: [], fillPaths: [] };
    const seriesCount = data[0].values.length;
    const result: string[] = [];
    const areaResult: string[] = [];

    for (let s = 0; s < seriesCount; s++) {
      let dStr = "";
      let areaStr = "";
      data.forEach((item, idx) => {
        const { x, y } = getCoords(idx, item.values[s]);
        if (idx === 0) {
          dStr += `M ${x} ${y}`;
          areaStr += `M ${x} ${height - paddingY} L ${x} ${y}`;
        } else {
          // Add some curvature or straight lines
          const prev = getCoords(idx - 1, data[idx - 1].values[s]);
          const cpX1 = prev.x + (x - prev.x) / 2;
          const cpY1 = prev.y;
          const cpX2 = prev.x + (x - prev.x) / 2;
          const cpY2 = y;
          dStr += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
          areaStr += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
        }
        if (idx === data.length - 1) {
          const first = getCoords(0, data[0].values[s]);
          areaStr += ` L ${x} ${height - paddingY} L ${first.x} ${height - paddingY} Z`;
        }
      });
      result.push(dStr);
      areaResult.push(areaStr);
    }
    return { strokePaths: result, fillPaths: areaResult };
  }, [data, maxValue]);

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-wrap gap-4 mb-4 text-xs font-medium justify-end">
        {seriesLabels.map((lbl, idx) => (
          <div key={lbl} className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: colors[idx] }} />
            <span className="text-slate-500 dark:text-slate-400">{lbl}</span>
          </div>
        ))}
      </div>

      <div className="relative w-full h-[220px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grids */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const yVal = maxValue * p;
            const y = height - paddingY - (yVal / maxValue) * (height - 2 * paddingY);
            return (
              <g key={i} className="opacity-25 dark:opacity-10">
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="currentColor" strokeDasharray="3 3" />
                <text x={paddingX - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-current font-medium">
                  {Math.round(yVal)}
                </text>
              </g>
            );
          })}

          {/* X Axis labels */}
          {data.map((item, idx) => {
            const { x } = getCoords(idx, 0);
            return (
              <text
                key={idx}
                x={x}
                y={height - 2}
                textAnchor="middle"
                className="text-[10px] font-medium fill-slate-400 dark:fill-slate-500 opacity-80"
              >
                {item.label}
              </text>
            );
          })}

          {/* Fill Areas */}
          {paths.fillPaths?.map((path, idx) => (
            <motion.path
              key={idx}
              d={path}
              fill={`url(#area-gradient-${idx})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{ duration: 0.8 }}
            />
          ))}

          {/* Line Strokes */}
          {paths.strokePaths?.map((path, idx) => (
            <motion.path
              key={idx}
              d={path}
              fill="none"
              stroke={colors[idx]}
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          ))}

          {/* Gradients declarations */}
          <defs>
            {colors.map((color, idx) => (
              <linearGradient key={idx} id={`area-gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                <stop offset="100%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>

          {/* Hover Indicators */}
          {data.map((item, idx) => {
            const { x } = getCoords(idx, 0);
            return (
              <g key={idx}>
                {/* Vertical hover track */}
                <line
                  x1={x}
                  y1={paddingY}
                  x2={x}
                  y2={height - paddingY}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className={`text-indigo-500/25 transition-opacity ${hoveredIdx === idx ? "opacity-100" : "opacity-0"}`}
                />
                
                {/* Interactive bar triggers */}
                <rect
                  x={x - (width / data.length) / 2}
                  y={0}
                  width={width / data.length}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* Circle Dots on hover */}
                {hoveredIdx === idx &&
                  item.values.map((v, s) => {
                    const c = getCoords(idx, v);
                    return (
                      <circle
                        key={s}
                        cx={c.x}
                        cy={c.y}
                        r="4.5"
                        fill={colors[s]}
                        stroke="white"
                        strokeWidth="1.5"
                        className="shadow"
                      />
                    );
                  })}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute z-20 bg-slate-900 text-white dark:bg-slate-950/95 border border-slate-800 p-2.5 rounded-xl text-xs flex flex-col gap-1 shadow-xl pointer-events-none transition-all duration-100"
            style={{
              left: `${getCoords(hoveredIdx, 0).x * 1.5 + 20}px`,
              top: `${paddingY}px`,
              transform: "translateX(-50%)"
            }}
          >
            <div className="font-semibold text-slate-400 border-b border-slate-800 pb-1 mb-1">
              {data[hoveredIdx].label}
            </div>
            {data[hoveredIdx].values.map((v, s) => (
              <div key={s} className="flex justify-between items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[s] }} />
                  {seriesLabels[s]}:
                </span>
                <span className="font-bold text-white">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. PIE CHART / DONUT
// ==========================================
interface PieChartProps {
  data: { name: string; value: number; color: string }[];
}

export function PieChart({ data }: PieChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);

  // Compute angles and strokes
  const segments = useMemo(() => {
    let accumulatedAngle = 0;
    return data.map((item) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const strokeLength = percentage;
      const strokeOffset = 100 - accumulatedAngle;
      accumulatedAngle += percentage;
      return {
        ...item,
        percentage,
        strokeLength,
        strokeOffset
      };
    });
  }, [data, total]);

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
      {/* Donut SVG */}
      <div className="relative w-[150px] h-[150px]">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <circle cx="18" cy="18" r="15.915" fill="none" className="text-slate-100 dark:text-slate-800" stroke="currentColor" strokeWidth="3" />
          {segments.map((seg, idx) => (
            <motion.circle
              key={idx}
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredIdx === idx ? "4" : "3"}
              strokeDasharray={`${seg.strokeLength} ${100 - seg.strokeLength}`}
              strokeDashoffset={seg.strokeOffset}
              strokeLinecap="round"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              initial={{ strokeDasharray: `0 100` }}
              animate={{ strokeDasharray: `${seg.strokeLength} ${100 - seg.strokeLength}` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold tracking-tight text-foreground">{total}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 w-full md:w-auto">
        {segments.map((seg, idx) => (
          <div
            key={seg.name}
            className={`flex items-center justify-between gap-6 px-3 py-1.5 rounded-xl border border-transparent transition-all duration-200 cursor-pointer ${
              hoveredIdx === idx ? "bg-slate-100 dark:bg-slate-800/60 border-border-color" : ""
            }`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-slate-600 dark:text-slate-300 font-medium">{seg.name}</span>
            </div>
            <span className="text-xs md:text-sm font-bold text-foreground">
              {seg.value} ({Math.round(seg.percentage)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. BAR CHART
// ==========================================
interface BarChartProps {
  data: { name: string; value: number }[];
  color?: string;
}

export function BarChart({ data, color = "#4f46e5" }: BarChartProps) {
  const maxValue = useMemo(() => {
    const max = Math.max(...data.map(d => d.value));
    return max > 0 ? max : 10;
  }, [data]);

  return (
    <div className="w-full flex flex-col gap-3 pt-2">
      {data.map((item, idx) => {
        const percentage = Math.round((item.value / maxValue) * 100);
        return (
          <div key={item.name} className="flex items-center gap-3 w-full">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-24 truncate text-left">
              {item.name}
            </span>
            <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, delay: idx * 0.05, ease: "easeOut" }}
                className="h-full rounded-lg relative overflow-hidden"
                style={{ backgroundColor: color }}
              >
                {/* Visual Highlight Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
              </motion.div>
            </div>
            <span className="text-xs font-bold text-foreground w-8 text-right">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 4. HEATMAP CHART
// ==========================================
interface HeatmapProps {
  data: number[][]; // grid 7 days x 24 hours, or 7 x 12
  rowLabels?: string[];
  colLabels?: string[];
}

export function HeatmapChart({
  data,
  rowLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  colLabels = ["8a", "10a", "12p", "2p", "4p", "6p", "8p", "10p"]
}: HeatmapProps) {
  const [hoverValue, setHoverValue] = useState<{ val: number; r: string; c: string } | null>(null);

  // Background shading logic
  const getCellColor = (val: number) => {
    if (val === 0) return "bg-slate-100 dark:bg-slate-800/30";
    if (val < 3) return "bg-indigo-100 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300";
    if (val < 6) return "bg-indigo-300 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100";
    if (val < 9) return "bg-indigo-500 dark:bg-indigo-700 text-white";
    return "bg-indigo-700 dark:bg-indigo-600 text-white";
  };

  return (
    <div className="relative w-full flex flex-col gap-2">
      {/* Column labels */}
      <div className="flex w-full pl-8 pr-1 mb-1">
        {colLabels.map((lbl, idx) => (
          <div key={idx} className="flex-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-center uppercase tracking-wider">
            {lbl}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 w-full">
        {data.map((row, rIdx) => (
          <div key={rIdx} className="flex items-center gap-1 w-full">
            {/* Row Label */}
            <span className="w-8 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              {rowLabels[rIdx]}
            </span>

            {/* Cells */}
            {row.map((cell, cIdx) => (
              <div
                key={cIdx}
                className={`flex-1 aspect-square rounded-md cursor-pointer transition-all duration-150 border border-transparent hover:border-slate-400 dark:hover:border-slate-500 flex items-center justify-center text-[9px] font-bold ${getCellColor(
                  cell
                )}`}
                onMouseEnter={() =>
                  setHoverValue({
                    val: cell,
                    r: rowLabels[rIdx],
                    c: colLabels[cIdx]
                  })
                }
                onMouseLeave={() => setHoverValue(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Floating tooltip */}
      {hoverValue !== null && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 dark:bg-slate-950 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-800 shadow-xl z-20 pointer-events-none">
          <span className="font-semibold text-indigo-400">{hoverValue.r} at {hoverValue.c}</span>:{" "}
          <span className="font-bold">{hoverValue.val} allocations</span>
        </div>
      )}
    </div>
  );
}
