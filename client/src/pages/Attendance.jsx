import { useCallback, useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import Loading from "../components/Loading"
import CheckInButton from "../components/attendance/CheckInButton"
import AttendanceStats from "../components/attendance/AttendanceStats"
import AttendanceHistory from "../components/attendance/AttendanceHistory"
import api from "../api/axios"
import { toastError, unwrap, unwrapItems } from "../api/helpers"
import { useAuth } from "../context/AuthContext"

const Attendance = () => {
  const { user, token } = useAuth()
  const [history, setHistory] = useState([])
  const [todayRecord, setTodayRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async ()=>{
    if (!token || !user) return;
    try {
      const [historyRes, statusRes] = await Promise.all([
        api.get("/attendance/history"),
        api.get("/attendance/status")
      ]);
      setHistory(unwrapItems(historyRes));
      const statusData = unwrap(statusRes);
      setTodayRecord(statusData?.status?.attendance || null);
    } catch (error) {
      toastError(error);
    } finally {
      setLoading(false);
    }
  },[token, user])

  useEffect(()=>{
    fetchData();
  },[fetchData]);

  if (user?.role === "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) return <Loading />



  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">GPS Attendance</h1>
        <p className="page-subtitle">Punch in and out from the approved office location</p>
      </div>
      <div className="mb-8"><CheckInButton todayRecord={todayRecord} onAction={fetchData}/></div>
      <AttendanceStats history={history}/>
      <AttendanceHistory history={history}/>
    </div>
  )
}

export default Attendance
