import React from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface EarningsChartProps {
  data: ChartData[];
  t: (key: string) => string;
}

export const EarningsChart: React.FC<EarningsChartProps> = ({ data, t }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-500">{t('no earnings data')}</div>;
  }

  const maxValue = Math.max(0, ...data.map(d => d.value));
  const chartHeight = 350;
  const yAxisWidth = 50;
  const xAxisHeight = 40;
  const graphHeight = chartHeight - xAxisHeight;

  const numYAxisTicks = 5;
  const yAxisTicks = Array.from({ length: numYAxisTicks + 1 }, (_, i) => {
    const value = (maxValue / numYAxisTicks) * i;
    return {
      value,
      y: graphHeight - (value / maxValue) * graphHeight,
    };
  });

  const totalWidth = data.length * 60 + yAxisWidth; // Estimate width

  return (
    <div className="w-full h-full overflow-x-auto">
      <svg width={totalWidth} height={chartHeight} className="min-w-full">
        {/* Y-axis ticks and labels */}
        {yAxisTicks.map(tick => (
          <g key={tick.value}>
            <line
              x1={yAxisWidth}
              x2={totalWidth}
              y1={tick.y}
              y2={tick.y}
              className="stroke-current text-slate-200"
              strokeDasharray="2,2"
            />
            <text
              x={yAxisWidth - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="text-xs fill-current text-slate-500"
            >
              ${Math.round(tick.value)}
            </text>
          </g>
        ))}

        {/* Bars and X-axis labels */}
        {data.map((d, i) => {
          const barWidth = 30;
          const barSpacing = 30;
          const barHeight = maxValue > 0 ? (d.value / maxValue) * graphHeight : 0;
          const x = yAxisWidth + i * (barWidth + barSpacing) + barSpacing / 2;
          const y = graphHeight - barHeight;

          return (
            <g key={d.label}>
              <title>{d.label}: ${d.value.toFixed(2)}</title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                className="fill-current text-purple-500"
                rx="2"
              />
              <text
                x={x + barWidth / 2}
                y={graphHeight + 15}
                textAnchor="middle"
                className="text-xs fill-current text-slate-500"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
