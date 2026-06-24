import { useCallback, useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import api from "../api/axios"
import toast from "react-hot-toast"
import { employeeName, toastError, unwrapItems } from "../api/helpers"
import { useAuth } from "../context/AuthContext"
import EmptyState from "../components/EmptyState"

const Clients = () => {
  const { user, token } = useAuth()
  const outletCtx = useOutletContext()
  const searchQuery = outletCtx?.searchQuery?.toLowerCase() || ""

  const isAdmin = user?.role === "ADMIN"
  const [items, setItems] = useState([])

  const load = useCallback(async () => {
    if (!token || !user) return;
    try { setItems(unwrapItems(await api.get("/clients"))) }
    catch (error) { toastError(error) }
  }, [token, user])

  useEffect(()=>{ load() }, [load])

  const submit = async (event) => {
    event.preventDefault()
    const form = Object.fromEntries(new FormData(event.currentTarget).entries())
    const payload = {
      clientName: form.clientName,
      status: form.status,
      services: form.services ? form.services.split(",").map((item)=> item.trim()).filter(Boolean) : [],
      driveLink: form.driveLink || undefined,
      notes: form.notes || undefined
    }
    try {
      await api.post("/clients", payload)
      toast.success("Client added")
      event.currentTarget.reset()
      load()
    } catch (error) { toastError(error) }
  }

  const filteredItems = items.filter(client => 
    client.clientName?.toLowerCase().includes(searchQuery) ||
    client.services?.some(s => s.toLowerCase().includes(searchQuery)) ||
    (client.notes && client.notes.toLowerCase().includes(searchQuery))
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1 className="page-title">Client Directory</h1><p className="page-subtitle">Accounts assigned to SharpKode teams</p></div>
      {isAdmin && (
        <form onSubmit={submit} className="card p-5 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <input name="clientName" required placeholder="Client name" />
          <select name="status" defaultValue="ACTIVE"><option>ACTIVE</option><option>INACTIVE</option><option>COMPLETED</option></select>
          <input name="services" placeholder="Services, comma separated" />
          <input name="driveLink" placeholder="Drive link" />
          <input name="notes" placeholder="Notes" />
          <button className="btn-primary">Add Client</button>
        </form>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredItems.map((client)=>(
          <div key={client._id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">{client.clientName}</h2>
                <p className="text-sm text-slate-500 mt-1">{client.services?.join(", ") || "No services listed"}</p>
              </div>
              <span className="badge bg-slate-100 text-slate-600">{client.status}</span>
            </div>
            <p className="text-sm text-slate-600 mt-4">{client.notes || "-"}</p>
            <p className="text-xs text-slate-400 mt-4">Assigned: {client.assignedEmployees?.map(employeeName).join(", ") || "None"}</p>
          </div>
        ))}
        {filteredItems.length === 0 && <div className="lg:col-span-2 card"><EmptyState title="No clients found" description="No clients match your current search query." /></div>}
      </div>
    </div>
  )
}

export default Clients
