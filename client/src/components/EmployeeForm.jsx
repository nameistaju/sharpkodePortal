import { useState } from "react"
import { DEPARTMENTS } from "../assets/assets"
import { Loader2Icon } from "lucide-react"
import api from "../api/axios"
import toast from "react-hot-toast"
import { getErrorMessage } from "../api/helpers"

const EmployeeForm = ({initialData, onSuccess, onCancel}) => {
    const [loading, setLoading] = useState(false)
    const isEditMode = !!initialData;

    const handleSubmit = async (e)=>{
        e.preventDefault()
        setLoading(true)
        const data = Object.fromEntries(new FormData(e.currentTarget).entries());
        if(!data.joinDate) delete data.joinDate;
        if(!data.dob) delete data.dob;

        try {
            const id = initialData?._id;
            if(isEditMode){
                delete data.email;
                await api.patch(`/employees/${id}`, data)
            } else {
                await api.post("/employees", data)
            }
            toast.success(isEditMode ? "Employee updated" : "Employee created")
            onSuccess?.()
        } catch (error) {
            toast.error(getErrorMessage(error));
        }finally{
            setLoading(false);
        }
    }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl animate-fade-in">
        <div className="card p-5 sm:p-6">
            <h3 className="font-medium mb-6 pb-4 border-b border-slate-100">Employee Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
                <div className="sm:col-span-2">
                    <label className="block mb-2">Full Name</label>
                    <input name="name" required defaultValue={initialData?.name || ""} />
                </div>
                <div>
                    <label className="block mb-2">Phone Number</label>
                    <input name="phone" required defaultValue={initialData?.phone || ""} />
                </div>
                <div>
                    <label className="block mb-2">Work Email</label>
                    <input type="email" name="email" required disabled={isEditMode} defaultValue={initialData?.email || ""} />
                </div>
                <div>
                    <label className="block mb-2">Date of Birth</label>
                    <input type="date" name="dob" required={!isEditMode} defaultValue={initialData?.dob ? new Date(initialData.dob).toISOString().split("T")[0] : ""} />
                </div>
                <div>
                    <label className="block mb-2">Join Date</label>
                    <input type="date" name="joinDate" defaultValue={initialData?.joinDate ? new Date(initialData.joinDate).toISOString().split("T")[0] : ""} />
                </div>
                <div>
                    <label className="block mb-2">Department</label>
                    <select name="department" required defaultValue={initialData?.department || ""}>
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map((deptName)=><option key={deptName} value={deptName}>{deptName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block mb-2">System Role</label>
                    <select name="role" defaultValue={initialData?.role || "EMPLOYEE"}>
                        <option value="EMPLOYEE">Employee</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
                {isEditMode && (
                    <div>
                        <label className="block mb-2">Status</label>
                        <select name="status" defaultValue={initialData?.status || "ACTIVE"}>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                )}
            </div>
        </div>

         <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center">
                {loading && <Loader2Icon className="w-4 h-4 mr-2 animate-spin"/>}
                {isEditMode ? "Update Employee" : "Create Employee"}
            </button>
         </div>
    </form>
  )
}

export default EmployeeForm
