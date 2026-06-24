import { useCallback, useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import Loading from "../components/Loading"
import { PalmtreeIcon, PlusIcon, ThermometerIcon, UmbrellaIcon } from "lucide-react"
import LeaveHistory from "../components/leave/LeaveHistory"
import ApplyLeaveModal from "../components/leave/ApplyLeaveModal"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"
import { toastError, unwrapItems } from "../api/helpers"

const Leave = () => {
  const {user, token} = useAuth()
  const outletCtx = useOutletContext()
  const searchQuery = outletCtx?.searchQuery?.toLowerCase() || ""

  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const isAdmin = user?.role === "ADMIN";

  const fetchLeaves = useCallback(async ()=>{
   if (!token || !user) return;
   try {
    const res = await api.get('/leaves');
    setLeaves(unwrapItems(res))
   } catch (error) {
    toastError(error)
   }finally{
    setLoading(false)
   }
  },[token, user])

  useEffect(()=>{ fetchLeaves() },[fetchLeaves])

  if(loading) return <Loading />

  const approvedLeaves = leaves.filter((l)=>l.status === "APPROVED");
  const leaveStats = [
    {label: "Sick Leave", value: approvedLeaves.filter((l)=>l.leaveType === "SICK").length, icon: ThermometerIcon},
    {label: "Casual Leave", value: approvedLeaves.filter((l)=>l.leaveType === "CASUAL").length, icon: UmbrellaIcon},
    {label: "Annual Leave", value: approvedLeaves.filter((l)=>l.leaveType === "ANNUAL").length, icon: PalmtreeIcon},
  ]

  const filteredLeaves = leaves.filter((l) => {
    const empName = l.employee?.name?.toLowerCase() || "";
    const reason = l.reason?.toLowerCase() || "";
    const type = l.leaveType?.toLowerCase() || "";
    return empName.includes(searchQuery) || reason.includes(searchQuery) || type.includes(searchQuery);
  })

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">{isAdmin ? "Manage leave applications" : "Your leave history and requests"}</p>
        </div>
        {!isAdmin && (
          <button onClick={()=> setShowModal(true)} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
            <PlusIcon className="w-4 h-4" /> Apply for Leave
          </button>
        )}
      </div>
        {!isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
            {leaveStats.map((s)=>(
              <div key={s.label} className="card card-hover p-5 sm:p-6 flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
                <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-indigo-50 transition-colors duration-200">
                    <s.icon className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors duration-200" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{s.value} <span className="text-sm font-normal text-slate-400">taken</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
        <LeaveHistory leaves={filteredLeaves} isAdmin={isAdmin} onUpdate={fetchLeaves}/>
        <ApplyLeaveModal open={showModal} onClose={()=> setShowModal(false)} onSuccess={fetchLeaves}/>
    </div>
  )
}

export default Leave
