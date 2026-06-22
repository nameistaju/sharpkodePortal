import { useCallback, useEffect, useState } from "react"
import { DEPARTMENTS } from "../assets/assets"
import { Plus, Search, X } from "lucide-react"
import EmployeeCard from "../components/EmployeeCard"
import EmployeeForm from "../components/EmployeeForm"
import api from "../api/axios"
import { getErrorMessage, unwrapItems } from "../api/helpers"
import toast from "react-hot-toast"
import EmptyState from "../components/EmptyState"

const Employees = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("")
  const [editEmployee, setEditEmployee] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchEmployees = useCallback(async ()=> {
    try {
      const params = new URLSearchParams();
      if(selectedDept) params.set("department", selectedDept);
      if(search) params.set("search", search);
      const res = await api.get(`/employees?${params.toString()}`)
      setEmployees(unwrapItems(res))
    } catch (error) {
      toast.error(getErrorMessage(error));
    }finally{
      setLoading(false)
    }
  }, [selectedDept, search])

  useEffect(()=>{ fetchEmployees(); },[fetchEmployees])

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="page-title">Employees</h1>
            <p className="page-subtitle">Manage SharpKode team members</p>
          </div>
          <button onClick={()=> setShowCreateModal(true)} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
            <Plus size={16}/> Add Employee
          </button>
      </div>
       <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4"/>
            <input placeholder="Search employees..." className="w-full pl-10!" onChange={(e)=>setSearch(e.target.value)} value={search}/>
          </div>
          <select value={selectedDept} onChange={(e)=>setSelectedDept(e.target.value)} className="max-w-40">
            <option value="">All Departments</option>
            {DEPARTMENTS.map((deptName)=><option key={deptName} value={deptName}>{deptName}</option>)}
          </select>
       </div>

       {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({length: 4}).map((_, index)=><div key={index} className="skeleton h-64" />)}
        </div>
       ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {employees.length === 0 ? (
            <div className="col-span-full card"><EmptyState title="No employees found" description="Try another search or add the first team member." action={<button onClick={()=> setShowCreateModal(true)} className="btn-primary">Add Employee</button>} /></div>
          ) : (
            employees.map((emp)=> <EmployeeCard key={emp._id} employee={emp} onDelete={fetchEmployees} onEdit={setEditEmployee}/>)
          )}
        </div>
       )}

       {(showCreateModal || editEmployee) && (
        <div className="fixed bg-black/40 backdrop-blur-sm inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={()=> { setShowCreateModal(false); setEditEmployee(null); }}>
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl my-8 animate-fade-in" onClick={(e)=> e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{editEmployee ? "Edit Employee" : "Add New Employee"}</h2>
                <p className="text-sm text-slate-500 mt-0.5">Backend-aligned employee profile</p>
              </div>
              <button onClick={()=> { setShowCreateModal(false); setEditEmployee(null); }} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-6">
              <EmployeeForm initialData={editEmployee} onSuccess={()=>{ setShowCreateModal(false); setEditEmployee(null); fetchEmployees(); }} onCancel={()=> { setShowCreateModal(false); setEditEmployee(null); }}/>
            </div>
          </div>
        </div>
       )}
    </div>
  )
}

export default Employees
