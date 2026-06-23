import { Loader2Icon, LogInIcon, LogOutIcon } from 'lucide-react'
import { useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../api/helpers'

const CheckInButton = ({ todayRecord, onAction, isInsideRadius, distance, coords, loadingCoords, officeRadius }) => {
    const [loading, setLoading] = useState(false)

    const handleAttendance = async () => {
        if (!coords) {
            toast.error("GPS location is not available");
            return;
        }
        setLoading(true)
        try {
            const payload = {
                latitude: coords.latitude,
                longitude: coords.longitude
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

    if (todayRecord?.punchOut?.time) {
        return (
            <div className='flex flex-col items-center justify-center p-8 bg-slate-50 rounded-lg border border-slate-200'>
                <h3 className='text-lg font-bold text-slate-900'>Work Day Completed</h3>
                <p className='text-slate-500 text-sm mt-1'>Great job. See you tomorrow.</p>
            </div>
        )
    }

    const isCheckedIn = !!todayRecord?.punchIn?.time;
    
    // Determine button disabled state and text
    let isButtonDisabled = loading || loadingCoords || !coords || !isInsideRadius;
    let buttonText = isCheckedIn ? "Punch Out" : "Punch In";

    if (loading) {
        buttonText = "Processing...";
    } else if (loadingCoords) {
        buttonText = "Waiting for GPS...";
    } else if (!coords) {
        buttonText = "GPS location required";
    } else if (!isInsideRadius && distance !== null) {
        const remainingDistance = Math.max(0, Math.round(distance - officeRadius));
        buttonText = `${isCheckedIn ? "Punch Out" : "Punch In"} (${remainingDistance}m remaining)`;
    }

    return (
        <div className='card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div>
                <h2 className='text-lg font-medium text-slate-900'>
                    {isCheckedIn ? "You are checked in" : "Ready to start?"}
                </h2>
                <p className='text-sm text-slate-500 font-normal mt-0.5'>
                    {!coords 
                      ? "GPS location is required by attendance policy." 
                      : isInsideRadius 
                        ? "You are inside the office radius. You can punch now." 
                        : `You are currently outside the office radius.`
                    }
                </p>
            </div>
            <button 
                onClick={handleAttendance} 
                disabled={isButtonDisabled} 
                className={`btn-primary flex items-center justify-center gap-2 w-full sm:w-auto transition-all ${
                    isCheckedIn ? "from-slate-700 to-slate-900" : ""
                } ${isButtonDisabled ? "opacity-60 cursor-not-allowed bg-slate-400 hover:from-slate-400 hover:to-slate-400" : ""}`}
            >
                {loading ? (
                    <Loader2Icon className="size-4 animate-spin"/>
                ) : isCheckedIn ? (
                    <LogOutIcon className="size-4"/>
                ) : (
                    <LogInIcon className="size-4"/>
                )}
                {buttonText}
            </button>
        </div>
    )
}

export default CheckInButton
