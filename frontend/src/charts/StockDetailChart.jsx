import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'

const LINE_COLOR = '#22c55e'
const GRID_COLOR = 'rgba(148, 163, 184, 0.4)'
const TICK_COLOR = '#94a3b8'
/** Longer dashes so the grid reads as dashed columns/rows — not tiny dots. */
const GRID_DASH = [8, 6]

function formatChartDate(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  }).format(new Date(timestamp))
}

function dayKey(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/New_York',
  }).format(new Date(timestamp))
}

/**
 * One column per trading day: place the vertical grid line + label
 * at the middle sample of that day so the label sits under the column.
 */
function buildDayColumnIndexes(timestamps) {
  const indexesByDay = new Map()

  timestamps.forEach((timestamp, index) => {
    const key = dayKey(timestamp)
    if (!indexesByDay.has(key)) {
      indexesByDay.set(key, [])
    }
    indexesByDay.get(key).push(index)
  })

  const columnIndexes = []
  for (const indexes of indexesByDay.values()) {
    columnIndexes.push(indexes[Math.floor(indexes.length / 2)])
  }
  return columnIndexes
}

/**
 * Build evenly spaced row prices (Y ticks), targeting ~7 rows like the design.
 */
function buildRowScale(minValue, maxValue) {
  const range = Math.max(maxValue - minValue, 0.01)
  const rough = range / 5
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const normalized = rough / magnitude

  let step
  if (normalized <= 1) {
    step = magnitude
  } else if (normalized <= 2) {
    step = 2 * magnitude
  } else if (normalized <= 5) {
    step = 5 * magnitude
  } else {
    step = 10 * magnitude
  }

  const yMin = Math.floor((minValue - step * 0.35) / step) * step
  const yMax = Math.ceil((maxValue + step * 0.35) / step) * step

  const rows = []
  for (let value = yMin; value <= yMax + step * 0.0001; value += step) {
    rows.push(Number(value.toFixed(6)))
  }

  return { step, yMin, yMax, rows }
}

/**
 * Draw only day-columns and price-rows ourselves.
 * Chart.js default X grid draws a line on every 15m point, which looks like dots.
 */
function createDayPriceGridPlugin(columnIndexes, rowValues) {
  return {
    id: 'dayPriceGrid',
    beforeDatasetsDraw(chart) {
      const {
        ctx,
        chartArea: { top, bottom, left, right },
        scales: { x, y },
      } = chart

      if (!x || !y) {
        return
      }

      ctx.save()
      ctx.strokeStyle = GRID_COLOR
      ctx.lineWidth = 1
      ctx.setLineDash(GRID_DASH)
      ctx.lineCap = 'butt'

      // Columns — one vertical dashed line per day
      columnIndexes.forEach((index) => {
        const px = x.getPixelForValue(index)
        if (px < left || px > right) {
          return
        }
        ctx.beginPath()
        ctx.moveTo(px, top)
        ctx.lineTo(px, bottom)
        ctx.stroke()
      })

      // Rows — one horizontal dashed line per price tick
      rowValues.forEach((value) => {
        const py = y.getPixelForValue(value)
        if (py < top || py > bottom) {
          return
        }
        ctx.beginPath()
        ctx.moveTo(left, py)
        ctx.lineTo(right, py)
        ctx.stroke()
      })

      ctx.restore()
    },
  }
}

export default function StockDetailChart({ history }) {
  const chartModel = useMemo(() => {
    if (!history?.length) {
      return null
    }

    const points = history
    const labels = points.map((point) => formatChartDate(point.timestamp))
    const values = points.map((point) => point.close)
    const columnIndexes = buildDayColumnIndexes(
      points.map((point) => point.timestamp),
    )
    const columnIndexSet = new Set(columnIndexes)
    const { step, yMin, yMax, rows } = buildRowScale(
      Math.min(...values),
      Math.max(...values),
    )

    return {
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: LINE_COLOR,
            backgroundColor: (context) => {
              const { chart } = context
              const { ctx, chartArea } = chart
              if (!chartArea) {
                return 'rgba(34, 197, 94, 0.15)'
              }
              const gradient = ctx.createLinearGradient(
                0,
                chartArea.top,
                0,
                chartArea.bottom,
              )
              gradient.addColorStop(0, 'rgba(34, 197, 94, 0.42)')
              gradient.addColorStop(0.55, 'rgba(34, 197, 94, 0.12)')
              gradient.addColorStop(1, 'rgba(34, 197, 94, 0)')
              return gradient
            },
            fill: 'origin',
            tension: 0,
            spanGaps: false,
            pointRadius: 0,
            pointHoverRadius: 3,
            pointHoverBackgroundColor: LINE_COLOR,
            borderWidth: 2,
            borderDash: [],
            borderJoinStyle: 'round',
            borderCapStyle: 'round',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        layout: {
          padding: { top: 10, right: 12, bottom: 4, left: 4 },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: '#1e293b',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            displayColors: false,
            padding: 10,
            callbacks: {
              title: (items) => {
                const index = items[0]?.dataIndex
                if (index == null) {
                  return ''
                }
                return new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'America/New_York',
                }).format(new Date(points[index].timestamp))
              },
              label: (ctx) => `$${Number(ctx.parsed.y).toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            offset: false,
            grid: {
              display: false,
              drawBorder: false,
            },
            ticks: {
              color: TICK_COLOR,
              font: { size: 10, weight: '400' },
              maxRotation: 0,
              autoSkip: false,
              align: 'center',
              crossAlign: 'center',
              padding: 8,
              callback(_value, index) {
                if (!columnIndexSet.has(index)) {
                  return ''
                }
                return labels[index]
              },
            },
            border: { display: false },
          },
          y: {
            position: 'left',
            min: yMin,
            max: yMax,
            afterBuildTicks(axis) {
              axis.ticks = rows.map((value) => ({ value }))
            },
            grid: {
              display: false,
              drawBorder: false,
            },
            ticks: {
              color: TICK_COLOR,
              font: { size: 10, weight: '400' },
              stepSize: step,
              padding: 6,
              maxTicksLimit: 7,
              callback: (value) => Number(value).toFixed(2),
            },
            border: { display: false },
          },
        },
      },
      plugins: [createDayPriceGridPlugin(columnIndexes, rows)],
    }
  }, [history])

  if (!chartModel) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-[#94a3b8] sm:h-[380px]">
        No chart data available
      </div>
    )
  }

  return (
    <div className="h-[260px] w-full min-[400px]:h-[320px] sm:h-[380px] lg:h-[420px]">
      <Line
        data={chartModel.data}
        options={chartModel.options}
        plugins={chartModel.plugins}
      />
    </div>
  )
}
