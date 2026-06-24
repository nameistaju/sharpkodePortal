import { useEffect, useState } from 'react'
import { Clock, Calendar, ShieldCheck, Activity, Award } from 'lucide-react'

const AttendanceStats = ({ history }) => {
  const [sessionHours, setSessionHours] = useState('0.00h')
  
  // Find today's record
  const todayRecord = history.find(
    (r) => new Date(r.date).toDateString() === new Date().toDateString()
  )

  const isPunchedIn = !!todayRecord?.punchIn?.time
  const isPunchedOut = !!todayRecord?.punchOut?.time

  // Calculate live session hours ticking
  useEffect(() => {
    if (!isPunchedIn) {
      setSessionHours('0.00h')
      return
    }
    if (isPunchedOut) {
      setSessionHours(`${(todayRecord.workingHours || 0).toFixed(2)}h`)
      return
    }

    const updateLiveHours = () => {
      const diffMs = new Date() - new Date(todayRecord.punchIn.time)
      const hours = diffMs / 3600000
      setSessionHours(`${hours.toFixed(2)}h`)
    }

    updateLiveHours()
    const timer = setInterval(updateLiveHours, 60000) // Update every minute
    return () => clearInterval(timer)
  }, [isPunchedIn, isPunchedOut, todayRecord])

  // Overall metrics calculations
  const totalPresent = history.filter((h) => h.punchIn?.time).length
  
  // This month's metrics
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthHistory = history.filter((h) => {
    const d = new Date(h.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
  const daysThisMonth = thisMonthHistory.filter((h) => h.punchIn?.time).length

  const stats = [
    {
      label: "Today's Hours",
      value: sessionHours,
      desc: isPunchedIn && !isPunchedOut ? 'Ticking session' : 'Completed shift',
      icon: Clock,
      gradient: 'from-indigo-500/8 via-indigo-600/3 to-transparent border-indigo-100/50',
      iconBg: 'bg-indigo-50 text-indigo-600',
      textColor: 'text-indigo-600'
    },
    {
      label: 'Current Session',
      value: isPunchedOut ? 'COMPLETED' : isPunchedIn ? 'ACTIVE' : 'INACTIVE',
      desc: isPunchedIn && !isPunchedOut ? 'Currently clocked in' : 'Shift is offline',
      icon: Activity,
      gradient: isPunchedIn && !isPunchedOut 
        ? 'from-emerald-500/8 via-emerald-600/3 to-transparent border-emerald-100/50'
        : 'from-slate-500/5 via-slate-600/2 to-transparent border-slate-200/50',
      iconBg: isPunchedIn && !isPunchedOut ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500',
      textColor: isPunchedIn && !isPunchedOut ? 'text-emerald-600 font-bold' : 'text-slate-500 font-bold'
    },
    {
      label: 'Days Present',
      value: `${totalPresent} days`,
      desc: 'All-time present records',
      icon: Calendar,
      gradient: 'from-rose-500/8 via-rose-600/3 to-transparent border-rose-100/50',
      iconBg: 'bg-rose-50 text-rose-600',
      textColor: 'text-rose-600'
    },
    {
      label: 'Monthly Attendance',
      value: `${daysThisMonth} days`,
      desc: `${new Date().toLocaleString('default', { month: 'long' })} records`,
      icon: Award,
      gradient: 'from-cyan-500/8 via-cyan-600/3 to-transparent border-cyan-100/50',
      iconBg: 'bg-cyan-50 text-cyan-600',
      textColor: 'text-cyan-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`relative overflow-hidden bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4 ${s.gradient}`}
        >
          {/* Glowing dot in top right */}
          <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-slate-300" />
          
          <div className={`p-3 rounded-xl shrink-0 ${s.iconBg}`}>
            <s.icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl sm:text-2xl font-black mt-1 tracking-tight truncate ${s.textColor}`}>
              {s.value}
            </p>
            <p className="text-slate-400 text-[11px] font-medium mt-1 truncate">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AttendanceStats
