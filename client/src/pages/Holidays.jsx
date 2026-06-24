import { useCallback, useEffect, useState } from "react"
import api from "../api/axios"
import toast from "react-hot-toast"
import { formatDate, toastError, unwrapItems } from "../api/helpers"
import { useAuth } from "../context/AuthContext"
import EmptyState from "../components/EmptyState"

const Holidays = () => {
  const { user, token } = useAuth()
  const isAdmin = user?.role === "ADMIN"
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!token || !user) return;
    try {
      setItems(unwrapItems(await api.get("/holidays")))
    } catch (error) {
      toastError(error)
    } finally {
      setLoading(false)
    }
  }, [token, user])

  useEffect(()=>{ load() }, [load])

  const submit = async (event) => {
    event.preventDefault()
    try {
      await api.post("/holidays", Object.fromEntries(new FormData(event.currentTarget).entries()))
      toast.success("Holiday added")
      event.currentTarget.reset()
      load()
    } catch (error) {
      toastError(error)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Holiday Calendar</h1>
        <p className="page-subtitle">Company holidays and optional days</p>
      </div>
      {isAdmin && (
        <form onSubmit={submit} className="card p-5 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div><label className="text-sm text-slate-600">Name</label><input name="name" required /></div>
          <div><label className="text-sm text-slate-600">Date</label><input type="date" name="date" required /></div>
          <div><label className="text-sm text-slate-600">Description</label><input name="description" /></div>
          <button className="btn-primary">Add Holiday</button>
        </form>
      )}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead><tr><th>Name</th><th>Date</th><th>Description</th><th>Type</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={4}><div className="skeleton h-5 w-full" /></td></tr> : items.map((item)=>(
                <tr key={item._id}>
                  <td className="font-medium text-slate-900">{item.name}</td>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.description || "-"}</td>
                  <td><span className="badge bg-slate-100 text-slate-600">{item.isOptional ? "Optional" : "Company"}</span></td>
                </tr>
              ))}
              {!loading && items.length === 0 && <tr><td colSpan={4}><EmptyState title="No holidays scheduled" description="Add holidays so everyone has a clear calendar." /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Holidays
