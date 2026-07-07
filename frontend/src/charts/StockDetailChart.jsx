import { Line } from 'react-chartjs-2'

function formatChartDate(timestamp) {
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  }).format(date)
}

function buildYAxisStep(min, max) {
  const range = max - min
  if (range <= 0) {
    return 2
  }

  const rough = range / 5
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const normalized = rough / magnitude

  if (normalized <= 1) {
    return magnitude
  }
  if (normalized <= 2) {
    return 2 * magnitude
  }
  if (normalized <= 5) {
    return 5 * magnitude
  }

  return 10 * magnitude
}

export default function StockDetailChart({ history }) {
  if (!history?.length) {
    return (
      <div className="flex h-[380px] items-center justify-center text-sm text-[#94a3b8]">
        No chart data available
      </div>
    )
  }

  const points = history.slice(-8)
  const labels = points.map((point) => formatChartDate(point.timestamp))
  const values = points.map((point) => point.close)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const step = buildYAxisStep(minValue, maxValue)
  const yMin = Math.floor(minValue / step) * step
  const yMax = Math.ceil(maxValue / step) * step

  const data = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: '#22c55e',
        backgroundColor: (context) => {
          const { chart } = context
          const { ctx, chartArea } = chart
          if (!chartArea) {
            return 'rgba(34, 197, 94, 0.1)'
          }
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          gradient.addColorStop(0, 'rgba(34, 197, 94, 0.35)')
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0)')
          return gradient
        },
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        borderColor: '#1e293b',
        borderWidth: 1,
        titleColor: '#f3f4f6',
        bodyColor: '#94a3b8',
        callbacks: {
          label: (ctx) => `$${Number(ctx.parsed.y).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(100, 116, 139, 0.2)',
          borderDash: [4, 4],
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          maxRotation: 0,
        },
        border: { display: false },
      },
      y: {
        min: yMin,
        max: yMax,
        grid: {
          color: 'rgba(100, 116, 139, 0.2)',
          borderDash: [4, 4],
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          stepSize: step,
          callback: (value) => Number(value).toFixed(2),
        },
        border: { display: false },
      },
    },
  }

  return (
    <div className="h-[380px] w-full">
      <Line data={data} options={options} />
    </div>
  )
}
