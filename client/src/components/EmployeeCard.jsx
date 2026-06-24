import { useState } from 'react';
import { 
  Pencil, RotateCcw, UserX, Mail, Phone, Calendar, 
  ShieldAlert, ShieldCheck, Clock, MoreVertical, Shield
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { employeeName, getErrorMessage } from '../api/helpers';

const EmployeeCard = ({ employee, onDelete, onEdit }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const inactive = employee.status === 'INACTIVE';

  const handleStatus = async () => {
    try {
      await api.post(`/employees/${employee._id}/${inactive ? 'activate' : 'deactivate'}`);
      toast.success(inactive ? 'Employee activated' : 'Employee deactivated');
      setShowDropdown(false);
      onDelete();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const joinDateFormatted = new Date(employee.joinDate).toLocaleDateString([], {
    year: 'numeric', month: 'short', day: 'numeric'
  });
  
  const lastActiveFormatted = new Date(employee.updatedAt).toLocaleDateString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className={`relative overflow-hidden bg-white border rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full ${
      inactive ? 'border-red-100 bg-red-50/5' : 'border-slate-200/60'
    }`}>
      {/* Top Header Row with Status and Dropdown Actions */}
      <div className="flex items-start justify-between mb-4">
        {/* Status Badge */}
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
          inactive 
            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        }`}>
          {employee.status}
        </span>

        {/* Dropdown Action Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200/40 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-20 text-xs font-semibold">
                <button 
                  onClick={() => { onEdit(employee); setShowDropdown(false); }}
                  className="w-full text-left px-3 py-1.8 hover:bg-slate-50 rounded-lg flex items-center gap-2 text-slate-700 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-indigo-500" />
                  Edit Profile
                </button>
                <button 
                  onClick={handleStatus}
                  className={`w-full text-left px-3 py-1.8 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer ${
                    inactive ? 'text-emerald-600 hover:text-emerald-700' : 'text-rose-600 hover:text-rose-700'
                  }`}
                >
                  {inactive ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Activate
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      Deactivate
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Employee details */}
      <div className="flex flex-col items-center text-center">
        {/* Photo Avatar */}
        <div className="relative mb-3.5">
          {employee.profilePhoto?.url ? (
            <img 
              src={employee.profilePhoto.url} 
              alt={employee.name} 
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-inner"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl border border-indigo-100 shadow-2xs">
              {employee.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Subtle Shield badge for Admin role */}
          {employee.role === 'ADMIN' && (
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-lg border-2 border-white shadow-2xs">
              <Shield className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        <h3 className="font-extrabold text-slate-900 text-sm leading-tight tracking-tight">{employee.name}</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">{employee.department}</p>
        
        <div className="w-full border-t border-slate-100 mt-4 pt-3.5 space-y-2 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{employee.phone || 'No phone'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Joined {joinDateFormatted}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 pt-1.5 border-t border-slate-50">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Updated {lastActiveFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;
