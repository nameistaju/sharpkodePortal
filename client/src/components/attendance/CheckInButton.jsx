import { Loader2Icon, LogInIcon, LogOutIcon } from 'lucide-react'
import { useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../api/helpers'

const getPosition = () => new Promise((resolve, reject)=>{
    if(!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
});

const CheckInButton = ({todayRecord, onAction}) => {
    const [loading, setLoading] = useState(false)

    const handleAttendance = async () => {
        setLoading(true)
        try {
            const position = await getPosition();
            const payload = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            await api.post(todayRecord?.punchIn?.time ? "/attendance/punch-out" : "/attendance/punch-in", payload)
            toast.success(todayRecord?.punchIn?.time ? "Punched out" : "Punched in")
            onAction()
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false)
        }
    }

    if(todayRecord?.punchOut?.time){
        return (
            <div className='flex flex-col items-center justify-center p-8 bg-slate-50 rounded-lg border border-slate-200'>
                <h3 className='text-lg font-bold text-slate-900'>Work Day Completed</h3>
                <p className='text-slate-500 text-sm mt-1'>Great job. See you tomorrow.</p>
            </div>
        )
    }

    const isCheckedIn = !!todayRecord?.punchIn?.time;
  return (
    <div className='card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
            <h2 className='text-lg font-medium text-slate-900'>{isCheckedIn ? "You are checked in" : "Ready to start?"}</h2>
            <p className='text-sm text-slate-500'>GPS location is required by attendance policy.</p>
        </div>
        <button onClick={handleAttendance} disabled={loading} className={`btn-primary flex items-center justify-center gap-2 w-full sm:w-auto ${isCheckedIn ? "from-slate-700 to-slate-900" : ""}`}>
            {loading ? <Loader2Icon className="size-4 animate-spin"/> : isCheckedIn ? <LogOutIcon className="size-4"/> : <LogInIcon className="size-4"/>}
            {loading ? "Processing..." : isCheckedIn ? "Punch Out" : "Punch In"}
        </button>
    </div>
  )
}

export default CheckInButton
