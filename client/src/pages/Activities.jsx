import { useCallback, useEffect, useState } from "react"
import api from "../api/axios"
import toast from "react-hot-toast"
import { employeeName, formatDateTime, toastError, unwrapItems } from "../api/helpers"
import EmptyState from "../components/EmptyState"
import { useAuth } from "../context/AuthContext"

const ACTIVITY_TYPES = ["POSTER_CREATED", "VIDEO_UPLOADED", "CAMPAIGN_STARTED", "CLIENT_APPROVED", "OTHER"]

const Activities = () => {
  const { user, token } = useAuth()
  const [items, setItems] = useState([])
  const [clients, setClients] = useState([])

  const load = useCallback(async () => {
    if (!token || !user) return;
    try {
      const [activityResponse, clientResponse] = await Promise.all([api.get("/client-activities/feed"), api.get("/clients")])
      setItems(unwrapItems(activityResponse))
      setClients(unwrapItems(clientResponse))
    } catch (error) { toastError(error) }
  }, [token, user])

  useEffect(()=>{ load() }, [load])

  const submit = async (event) => {
    event.preventDefault()
    try {
      await api.post("/client-activities", Object.fromEntries(new FormData(event.currentTarget).entries()))
      toast.success("Activity logged")
      event.currentTarget.reset()
      load()
    } catch (error) { toastError(error) }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1 className="page-title">Client Activities</h1><p className="page-subtitle">Marketing and delivery updates by client</p></div>
      <form onSubmit={submit} className="card p-5 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <select name="client" required><option value="">Select client</option>{clients.map((client)=><option key={client._id} value={client._id}>{client.clientName}</option>)}</select>
        <select name="activityType">{ACTIVITY_TYPES.map((type)=><option key={type}>{type}</option>)}</select>
        <input name="description" required placeholder="Description" />
        <button className="btn-primary">Log Activity</button>
      </form>
      <div className="card overflow-hidden">
        <table className="table-modern">
          <thead><tr><th>Client</th><th>Type</th><th>Description</th><th>Employee</th><th>Date</th></tr></thead>
          <tbody>
            {items.map((item)=><tr key={item._id}><td>{item.client?.clientName}</td><td><span className="badge bg-slate-100 text-slate-600">{item.activityType}</span></td><td>{item.description}</td><td>{employeeName(item.employee)}</td><td>{formatDateTime(item.createdAt)}</td></tr>)}
            {items.length === 0 && <tr><td colSpan={5}><EmptyState title="No activity logged" description="Log a client activity to build the project timeline." /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Activities
