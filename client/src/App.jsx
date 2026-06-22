import { Toaster } from "react-hot-toast"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import LoginLanding from "./pages/LoginLanding"
import Layout from "./pages/Layout"
import Dashboard from "./pages/Dashboard"
import Employees from "./pages/Employees"
import Attendance from "./pages/Attendance"
import Leave from "./pages/Leave"
import Settings from "./pages/Settings"
import LoginForm from "./components/LoginForm"
import Holidays from "./pages/Holidays"
import Announcements from "./pages/Announcements"
import Clients from "./pages/Clients"
import Activities from "./pages/Activities"
import Visits from "./pages/Visits"
import Corrections from "./pages/Corrections"
import ChangePassword from "./pages/ChangePassword"

const App = () => {
  const location = useLocation()
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3200, style: { borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 18px 45px rgba(15,23,42,0.10)" } }} />
      <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={ <LoginLanding/> }/>

      <Route path="/login/admin" element={ <LoginForm role="admin" title="Admin Portal" subtitle="Sign in to manage the organization"/> }/>

      <Route path="/login/employee" element={ <LoginForm role="employee" title="Employee Portal" subtitle="Sign in to access your account"/> }/>

        <Route path="/change-password" element={<ChangePassword />}/>

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />}/>
          <Route path="/employees" element={<Employees />}/>
          <Route path="/attendance" element={<Attendance />}/>
          <Route path="/corrections" element={<Corrections />}/>
          <Route path="/leave" element={<Leave />}/>
          <Route path="/holidays" element={<Holidays />}/>
          <Route path="/announcements" element={<Announcements />}/>
          <Route path="/clients" element={<Clients />}/>
          <Route path="/activities" element={<Activities />}/>
          <Route path="/visits" element={<Visits />}/>
          <Route path="/settings" element={<Settings />}/>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
      </Routes>
      </AnimatePresence>
    </>
  )
}

export default App
