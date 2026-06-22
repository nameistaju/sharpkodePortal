import { useCallback, useEffect, useState } from "react"
import api from "../api/axios"
import toast from "react-hot-toast"
import { getErrorMessage, formatDate, unwrapItems } from "../api/helpers"
import { useAuth } from "../context/AuthContext"
import EmptyState from "../components/EmptyState"

const Announcements = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"
  const [items, setItems] = useState([])

  const load = useCallback(async () => {
    try { setItems(unwrapItems(await api.get("/announcements?activeOnly=true"))) }
    catch (error) { toast.error(getErrorMessage(error)) }
  }, [])

  useEffect(()=>{ load() }, [load])

  const submit = async (event) => {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries())
    payload.isPinned = payload.isPinned === "on"
    try {
      await api.post("/announcements", payload)
      toast.success("Announcement published")
      event.currentTarget.reset()
      load()
    } catch (error) { toast.error(getErrorMessage(error)) }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Announcements</h1>
        <p className="page-subtitle">Pinned and active company updates</p>
      </div>
      {isAdmin && (
        <form onSubmit={submit} className="card p-5 sm:p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="title" required placeholder="Title" />
            <input type="date" name="visibleFrom" />
          </div>
          <textarea name="message" required rows={3} placeholder="Announcement message" />
          <label className="flex items-center gap-2 text-sm text-slate-600"><input className="w-auto" type="checkbox" name="isPinned" /> Pin announcement</label>
          <button className="btn-primary">Publish</button>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item)=>(
          <article key={item._id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-slate-900">{item.title}</h2>
              {item.isPinned && <span className="badge badge-warning">Pinned</span>}
            </div>
            <p className="text-sm text-slate-500 mt-1">{formatDate(item.visibleFrom)}</p>
            <p className="text-sm text-slate-700 mt-4 whitespace-pre-wrap">{item.message}</p>
          </article>
        ))}
        {items.length === 0 && <div className="md:col-span-2 card"><EmptyState title="No active announcements" description="Published announcements will show up here for the team." /></div>}
      </div>
    </div>
  )
}

export default Announcements
