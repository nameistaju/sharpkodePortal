import { useCallback, useEffect, useState } from "react"
import Loading from "../components/Loading"
import CheckInButton from "../components/attendance/CheckInButton"
import AttendanceStats from "../components/attendance/AttendanceStats"
import AttendanceHistory from "../components/attendance/AttendanceHistory"
import api from "../api/axios"
import {toast} from 'react-hot-toast'
import { getErrorMessage, unwrapItems } from "../api/helpers"

const Attendance = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async ()=>{
    try {
      const res = await api.get("/attendance/history");
      setHistory(unwrapItems(res))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }finally{
      setLoading(false)
    }
  },[])

  useEffect(()=>{ fetchData() },[fetchData]);

  if (loading) return <Loading />

  const todayRecord = history.find((r)=> new Date(r.date).toDateString() === new Date().toDateString())

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
