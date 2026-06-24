import { useEffect, useState } from "react"
import Loading from "../components/Loading"
import EmployeeDashboard from "../components/EmployeeDashboard"
import AdminDashboard from "../components/AdminDashboard"
import api from "../api/axios"
import { toastError, unwrap } from "../api/helpers"
import { useAuth } from "../context/AuthContext"

const Dashboard = () => {
  const { user, token } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    if (!token || !user) return;
    const endpoint = user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/employee";
    api.get(endpoint)
      .then((res)=> setData(unwrap(res).dashboard))
      .catch((err)=> toastError(err))
      .finally(()=> setLoading(false))
  },[token, user])

  if(loading) return <Loading />
  if(!data) return <p className="text-center text-slate-500 py-12">Failed to load dashboard</p>

  return user?.role === "ADMIN"
    ? <AdminDashboard data={data} refetch={fetchDashboard}/>
    : <EmployeeDashboard data={data} user={user} refetch={fetchDashboard}/>
}

export default Dashboard
