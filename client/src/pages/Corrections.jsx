import { useCallback, useEffect, useState } from "react"
import api from "../api/axios"
import toast from "react-hot-toast"
import { employeeName, formatDate, toastError, unwrapItems } from "../api/helpers"
import { useAuth } from "../context/AuthContext"
import EmptyState from "../components/EmptyState"

const TYPES = ["PUNCH_IN", "PUNCH_OUT", "BOTH"]

const Corrections = () => {
  const { user, token } = useAuth()
  const isAdmin = user?.role === "ADMIN"
  const [items, setItems] = useState([])

  const load = useCallback(async () => {
    if (!token || !user) return;
    try { setItems(unwrapItems(await api.get("/attendance-corrections"))) }
    catch (error) { toastError(error) }
  }, [token, user])

  useEffect(()=>{ load() }, [load])

  const submit = async (event) => {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries())
    if(!payload.requestedPunchIn) delete payload.requestedPunchIn
    if(!payload.requestedPunchOut) delete payload.requestedPunchOut
    try {
      await api.post("/attendance-corrections", payload)
      toast.success("Correction request submitted")
      event.currentTarget.reset()
      load()
    } catch (error) { toastError(error) }
  }

  const review = async (id, action) => {
    try { await api.post(`/attendance-corrections/${id}/${action}`, {}); toast.success(`Request ${action}d`); load() }
    catch (error) { toastError(error) }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1 className="page-title">Attendance Corrections</h1><p className="page-subtitle">Request and review punch adjustments</p></div>
      {!isAdmin && (
        <form onSubmit={submit} className="card p-5 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <input type="date" name="date" required />
          <select name="correctionType">{TYPES.map((type)=><option key={type}>{type}</option>)}</select>
          <input type="datetime-local" name="requestedPunchIn" />
          <input type="datetime-local" name="requestedPunchOut" />
          <input name="reason" required placeholder="Reason" />
          <button className="btn-primary md:col-span-5">Submit Correction</button>
        </form>
      )}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead><tr><th>Employee</th><th>Date</th><th>Type</th><th>Status</th><th>Reason</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>
              {items.map((item)=>(
                <tr key={item._id}>
                  <td>{employeeName(item.employee)}</td>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.correctionType}</td>
                  <td><span className={`badge ${item.status === "APPROVED" ? "badge-success" : item.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}>{item.status}</span></td>
                  <td>{item.reason}</td>
                  {isAdmin && <td>{item.status === "PENDING" ? <div className="flex gap-2"><button className="btn-secondary" onClick={()=>review(item._id, "approve")}>Approve</button><button className="btn-secondary" onClick={()=>review(item._id, "reject")}>Reject</button></div> : "-"}</td>}
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={isAdmin ? 6 : 5}><EmptyState title="No correction requests" description="Punch correction requests will appear here for review." /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Corrections
