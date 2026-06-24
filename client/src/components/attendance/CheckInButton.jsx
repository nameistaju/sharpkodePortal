import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Fingerprint, LogOut, ShieldAlert, Loader2, MapPin } from 'lucide-react'
import api from '../../api/axios'
import { toastError } from '../../api/helpers'
import toast from 'react-hot-toast'

const CheckInButton = ({ todayRecord, onAction, isInsideRadius, distance, coords, loadingCoords, officeRadius }) => {
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState('')

  // Live session timer logic when employee is punched in
  useEffect(() => {
    if (!todayRecord?.punchIn?.time || todayRecord?.punchOut?.time) {
      setElapsed('')
      return
    }

    const updateTimer = () => {
      const diffMs = new Date() - new Date(todayRecord.punchIn.time)
      const hours = Math.floor(diffMs / 3600000)
      const mins = Math.floor((diffMs % 3600000) / 60000)
      const secs = Math.floor((diffMs % 60000) / 1000)
      setElapsed(
        `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [todayRecord])

  const handleAttendance = async () => {
    if (!coords) {
      toast.error('GPS location is not available')
      return
    }
    setLoading(true)
    try {
      const payload = {
        latitude: coords.latitude,
        longitude: coords.longitude
      }
      await api.post(todayRecord?.punchIn?.time ? '/attendance/punch-out' : '/attendance/punch-in', payload)
      toast.success(todayRecord?.punchIn?.time ? 'Punched out successfully' : 'Punched in successfully')
      onAction()
    } catch (error) {
      toastError(error)
    } finally {
      setLoading(false)
    }
  }

  // Work Day Completed Screen
  if (todayRecord?.punchOut?.time) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/40 border border-white/20 backdrop-blur-md rounded-2xl shadow-xl animate-fade-in text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100 shadow-sm shadow-emerald-500/10">
          <Fingerprint className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Work Day Completed</h3>
        <p className="text-slate-500 text-sm mt-1">Excellent effort today. Session closed successfully.</p>
      </div>
    )
  }

  const isCheckedIn = !!todayRecord?.punchIn?.time
  const isButtonDisabled = loading || loadingCoords || !coords || (!isCheckedIn && !isInsideRadius)

  // Define states content
  let buttonColorClass = 'bg-linear-to-tr from-emerald-500 to-green-600 shadow-emerald-500/20'
  let ringColor = '#10B981'
  let Icon = Fingerprint
  let text = 'PUNCH IN'
  let subtext = 'Ready to Start'

  if (loading) {
    buttonColorClass = 'bg-linear-to-tr from-indigo-500 to-indigo-600 shadow-indigo-500/20'
    ringColor = '#5B4CFF'
    Icon = Loader2
    text = 'PROCESSING'
    subtext = 'Sending Request'
  } else if (loadingCoords) {
    buttonColorClass = 'bg-linear-to-tr from-slate-400 to-slate-500 shadow-slate-500/20'
    ringColor = '#94A3B8'
    Icon = Loader2
    text = 'SYNCING'
    subtext = 'Waiting for GPS'
  } else if (!coords) {
    buttonColorClass = 'bg-linear-to-tr from-rose-500 to-red-600 shadow-red-500/20'
    ringColor = '#EF4444'
    Icon = ShieldAlert
    text = 'GPS LOCK'
    subtext = 'Enable Location'
  } else if (isCheckedIn) {
    buttonColorClass = 'bg-linear-to-tr from-orange-500 to-red-500 shadow-orange-500/20'
    ringColor = '#F97316'
    Icon = LogOut
    text = 'PUNCH OUT'
    subtext = elapsed || 'Working'
  } else if (!isInsideRadius) {
    buttonColorClass = 'bg-linear-to-tr from-slate-400 to-slate-500 shadow-slate-400/20'
    ringColor = '#94A3B8'
    Icon = MapPin
    const remainingDistance = Math.max(0, Math.round(distance - officeRadius))
    text = 'OUTSIDE AREA'
    subtext = `${remainingDistance}m Away`
  }

  return (
    <div className="flex flex-col items-center justify-center py-6">
      {/* Neumorphic Outer ring */}
      <div className="relative flex items-center justify-center w-[160px] h-[160px] sm:w-[190px] sm:h-[190px] rounded-full bg-slate-50 border border-slate-200/50 shadow-inner">
        
        {/* SVG Rotating Progress Circle */}
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="46%"
            stroke="rgba(226, 232, 240, 0.4)"
            strokeWidth="3"
            fill="transparent"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="46%"
            stroke={ringColor}
            strokeWidth="4"
            strokeDasharray="120 40"
            strokeLinecap="round"
            fill="transparent"
            animate={isCheckedIn && isInsideRadius ? { rotate: 360 } : {}}
            transition={isCheckedIn && isInsideRadius ? { repeat: Infinity, duration: 6, ease: 'linear' } : {}}
          />
        </svg>

        {/* Biometric Interactive Center Button */}
        <motion.button
          onClick={handleAttendance}
          disabled={isButtonDisabled}
          whileHover={!isButtonDisabled ? { scale: 1.05 } : {}}
          whileTap={!isButtonDisabled ? { scale: 0.95 } : {}}
          className={`relative z-10 w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] rounded-full flex flex-col items-center justify-center text-white font-bold transition-all shadow-xl border-4 border-white/20 backdrop-blur-md cursor-pointer ${buttonColorClass}`}
        >
          {/* Inner breathing pulse effect */}
          {!isButtonDisabled && (
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className={`absolute inset-0 rounded-full -z-10 blur-md ${
                isCheckedIn ? 'bg-orange-500/30' : 'bg-emerald-500/30'
              }`}
            />
          )}

          {/* Action icon */}
          <div className="relative">
            {Icon === Loader2 ? (
              <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 animate-spin" />
            ) : (
              <Icon className="w-8 h-8 sm:w-9 sm:h-9" />
            )}
          </div>

          {/* Texts */}
          <span className="text-xs sm:text-sm tracking-widest font-extrabold uppercase mt-2">
            {text}
          </span>
          <span className={`text-[10px] sm:text-[11px] font-medium mt-0.5 ${isCheckedIn ? 'font-mono text-white/90' : 'text-white/80'}`}>
            {subtext}
          </span>
        </motion.button>
      </div>
    </div>
  )
}

export default CheckInButton
