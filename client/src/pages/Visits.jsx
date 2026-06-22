import { useCallback, useEffect, useState } from "react"
import api from "../api/axios"
import toast from "react-hot-toast"
import { employeeName, formatDate, getErrorMessage, unwrapItems } from "../api/helpers"
import { useAuth } from "../context/AuthContext"
import EmptyState from "../components/EmptyState"

const OUTCOMES = ["POSITIVE", "NEUTRAL", "NEGATIVE", "FOLLOW_UP_REQUIRED", "CLOSED"]

const Visits = () => {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [clients, setClients] = useState([])
  const canCreateVisit = user?.department === "MARKETING"

  const load = useCallback(async () => {
    try {
      const [visitResponse, clientResponse] = await Promise.all([api.get("/client-visits"), api.get("/clients")])
      setItems(unwrapItems(visitResponse))
      setClients(unwrapItems(clientResponse))
    } catch (error) { toast.error(getErrorMessage(error)) }
  }, [])

  useEffect(()=>{ load() }, [load])

  const submit = async (event) => {
    event.preventDefault()
    try {
      await api.post("/client-visits", Object.fromEntries(new FormData(event.currentTarget).entries()))
      toast.success("Visit recorded")
      event.currentTarget.reset()
      load()
    } catch (error) { toast.error(getErrorMessage(error)) }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1 className="page-title">Client Visits</h1><p className="page-subtitle">Field meeting history and outcomes</p></div>
      {canCreateVisit && (
        <form onSubmit={submit} className="card p-5 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <select name="client" required><option value="">Select client</option>{clients.map((client)=><option key={client._id} value={client._id}>{client.clientName}</option>)}</select>
          <input type="date" name="visitDate" required />
          <select name="outcome">{OUTCOMES.map((outcome)=><option key={outcome}>{outcome}</option>)}</select>
          <input name="meetingNotes" required placeholder="Meeting notes" />
          <button className="btn-primary">Add Visit</button>
        </form>
      )}
      <div className="card overflow-hidden">
        <table className="table-modern">
          <thead><tr><th>Client</th><th>Employee</th><th>Date</th><th>Outcome</th><th>Notes</th></tr></thead>
          <tbody>
            {items.map((item)=><tr key={item._id}><td>{item.client?.clientName}</td><td>{employeeName(item.employee)}</td><td>{formatDate(item.visitDate)}</td><td><span className="badge bg-slate-100 text-slate-600">{item.outcome}</span></td><td>{item.meetingNotes}</td></tr>)}
            {items.length === 0 && <tr><td colSpan={5}><EmptyState title="No visits recorded" description="Marketing visits and outcomes will appear here." /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Visits
