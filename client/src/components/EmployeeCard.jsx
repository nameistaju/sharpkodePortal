import { PencilIcon, RotateCcwIcon, UserXIcon } from 'lucide-react'
import api from '../api/axios';
import toast from 'react-hot-toast';
import { employeeName, getErrorMessage } from '../api/helpers';

const EmployeeCard = ({employee, onDelete, onEdit}) => {
    const inactive = employee.status === "INACTIVE";

    const handleStatus = async ()=>{
        try {
            await api.post(`/employees/${employee._id}/${inactive ? "activate" : "deactivate"}`)
            toast.success(inactive ? "Employee activated" : "Employee deactivated")
            onDelete()
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    }

  return (
    <div className='group relative card card-hover overflow-hidden'>
        <div className='relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-slate-100 to-slate-50'>
            <div className='w-full h-full flex items-center justify-center'>
                <div className='w-20 h-20 rounded-full bg-linear-to-br from-indigo-100 to-slate-100 flex items-center justify-center'>
                    <span className='text-2xl font-medium text-indigo-400'>{employeeName(employee).charAt(0)}</span>
                </div>
            </div>
        </div>

        <div className='absolute top-3 left-3 flex gap-2'>
            <span className='bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-slate-600 rounded-lg shadow-sm'>{employee.department}</span>
            {inactive && <span className='bg-red-500/70 font-medium text-white px-2.5 py-1 text-xs rounded'>INACTIVE</span>}
        </div>

        <div className='absolute inset-0 bg-linear-to-t from-indigo-700/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6 gap-3'>
            <button onClick={()=> onEdit(employee)} className='p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-indigo-600 rounded-xl shadow-lg transition-all hover:scale-105'>
                <PencilIcon className="w-4 h-4"/>
            </button>
            <button onClick={handleStatus} className='p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-rose-600 rounded-xl shadow-lg transition-all hover:scale-105'>
                {inactive ? <RotateCcwIcon className="w-4 h-4"/> : <UserXIcon className="w-4 h-4"/>}
            </button>
        </div>

        <div className='p-5'>
            <h3 className='text-slate-900'>{employeeName(employee)}</h3>
            <p className='text-xs text-slate-500'>{employee.email}</p>
            <p className='text-xs text-slate-400 mt-1'>{employee.role}</p>
        </div>
    </div>
  )
}

export default EmployeeCard
