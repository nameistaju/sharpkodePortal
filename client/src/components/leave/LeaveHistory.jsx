import { Check, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import {formatDate, employeeName} from '../../api/helpers'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../api/helpers'

const LeaveHistory = ({leaves, isAdmin, onUpdate}) => {
    const [processing, setProcessing] = useState(null)

    const review = async (id, action) => {
        setProcessing(id)
        try {
            await api.post(`/leaves/${id}/${action}`, {})
            toast.success(`Leave ${action}d`)
            onUpdate();
        } catch (error) {
            toast.error(getErrorMessage(error))
        }finally{
            setProcessing(null)
        }
    }
  return (
     <div className='card overflow-hidden'>
            <div className="overflow-x-auto">
                <table className="table-modern">
                    <thead>
                        <tr>
                            {isAdmin && <th>Employee</th>}
                            <th>Type</th>
                            <th>Dates</th>
                            <th>Reason</th>
                            <th>Status</th>
                            {isAdmin && <th className='text-center'>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.length === 0 ? (
                            <tr><td colSpan={isAdmin ? 6 : 4} className="text-center py-12 text-slate-400">No leave applications found</td></tr>
                        ) : leaves.map((leave)=>(
                            <tr key={leave._id}>
                                {isAdmin && <td className='text-slate-900'>{employeeName(leave.employee)}</td>}
                                <td><span className='badge bg-slate-100 text-slate-600'>{leave.leaveType}</span></td>
                                <td className='text-xs text-slate-500'>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</td>
                                <td className='max-w-xs truncate text-slate-500' title={leave.reason}>{leave.reason}</td>
                                <td><span className={`badge ${leave.status === "APPROVED" ? "badge-success" : leave.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}>{leave.status}</span></td>
                                {isAdmin && (
                                    <td>
                                        {leave.status === "PENDING" && (
                                            <div className='flex justify-center gap-2'>
                                                <button disabled={!!processing} onClick={()=> review(leave._id, "approve")} className='p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors'>
                                                    {processing === leave._id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                                                </button>
                                                <button onClick={()=> review(leave._id, "reject")} disabled={!!processing} className='p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors'>
                                                    {processing === leave._id ? <Loader2 className="w-4 h-4 animate-spin"/> : <X className="w-4 h-4"/>}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
  )
}

export default LeaveHistory
