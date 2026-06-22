import { Navigate, Outlet, useLocation } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { useAuth } from "../context/AuthContext"
import Loading from "../components/Loading"
import { motion } from "framer-motion"

const MotionDiv = motion.div

const Layout = () => {
  const {user, loading} = useAuth()
  const location = useLocation()

  if(loading) return <Loading />
  if(!user) return <Navigate to="/login" />
  if((user.mustChangePassword || user.forcePasswordChange) && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />
  }
 
  return (
    <div className="flex h-screen surface-gradient">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="p-4 pt-16 sm:p-6 sm:pt-6 lg:p-8 max-w-[1440px] mx-auto"
            >
                <Outlet />
            </MotionDiv>
        </main>
    </div>
  )
}

export default Layout
