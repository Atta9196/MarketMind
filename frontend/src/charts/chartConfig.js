import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
)

ChartJS.defaults.color = '#94a3b8'
ChartJS.defaults.borderColor = '#334155'
ChartJS.defaults.font.family = "'Inter', system-ui, sans-serif"

export default ChartJS
