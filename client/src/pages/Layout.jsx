import { Navigate, Outlet, useLocation, Link } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { useAuth } from "../context/AuthContext"
import Loading from "../components/Loading"
import api from "../api/axios"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { 
  LayoutGrid, Calendar, Users, FileText, ClipboardList, Settings, 
  Search, Bell, Smartphone, X, Download, ShieldCheck, Clock, MapPin, Compass
} from "lucide-react"

const MotionDiv = motion.div

const Layout = () => {
  const { user, loading, token } = useAuth()
  const location = useLocation()

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Notification center state
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])

  // Global search input state
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch real notifications based on role
  useEffect(() => {
    if (!token || !user) return;

    const fetchNotifications = async () => {
      try {
        if (user.role === "ADMIN") {
          const [leavesRes, correctionsRes] = await Promise.all([
            api.get('/leaves?status=PENDING'),
            api.get('/attendance-corrections?status=PENDING')
          ]);
          const leaves = leavesRes.data.data.items || [];
          const corrections = correctionsRes.data.data.items || [];

          const list = [];
          leaves.forEach((l, idx) => {
            list.push({
              id: `leave-${l._id}-${idx}`,
              title: "Pending Leave Request",
              desc: `${l.employee?.name || 'Employee'} requested leave starting ${new Date(l.startDate).toLocaleDateString()}`,
              time: "Action required"
            });
          });
          corrections.forEach((c, idx) => {
            list.push({
              id: `correction-${c._id}-${idx}`,
              title: "Pending Punch Correction",
              desc: `${c.employee?.name || 'Employee'} requested correction for ${new Date(c.date).toLocaleDateString()}`,
              time: "Action required"
            });
          });

          if (list.length === 0) {
            list.push({
              id: 'empty',
              title: "All Caught Up!",
              desc: "No pending leave or correction approvals.",
              time: "Now"
            });
          }
          setNotifications(list);
        } else {
          // Employee
          const [leavesRes, correctionsRes] = await Promise.all([
            api.get('/leaves?limit=5'),
            api.get('/attendance-corrections?limit=5')
          ]);
          const leaves = leavesRes.data.data.items || [];
          const corrections = correctionsRes.data.data.items || [];

          const list = [];
          leaves.forEach((l, idx) => {
            list.push({
              id: `leave-${l._id}-${idx}`,
              title: `Leave: ${l.status}`,
              desc: `Your leave request for ${new Date(l.startDate).toLocaleDateString()} is ${l.status.toLowerCase()}.`,
              time: new Date(l.updatedAt || l.createdAt).toLocaleDateString()
            });
          });
          corrections.forEach((c, idx) => {
            list.push({
              id: `correction-${c._id}-${idx}`,
              title: `Correction: ${c.status}`,
              desc: `Your correction request for ${new Date(c.date).toLocaleDateString()} is ${c.status.toLowerCase()}.`,
              time: new Date(c.updatedAt || c.createdAt).toLocaleDateString()
            });
          });

          if (list.length === 0) {
            list.push({
              id: 'empty',
              title: "Welcome to SharpKode",
              desc: "No recent leave or attendance alerts.",
              time: "Now"
            });
          }
          setNotifications(list);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [token, user]);

  useEffect(() => {
    // Detect mobile viewports
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024
    setIsMobile(mobileCheck)

    // Handle visits tracking for PWA triggers
    const hasActiveSession = sessionStorage.getItem("pwaSessionActive")
    if (!hasActiveSession) {
      sessionStorage.setItem("pwaSessionActive", "true")
      const currentVisits = parseInt(localStorage.getItem("pwaVisits") || "0", 10)
      localStorage.setItem("pwaVisits", String(currentVisits + 1))
    }

    // Time-based PWA trigger (30 seconds)
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem("pwaDismissed") === "true"
      if (!dismissed) {
        setShowInstallPrompt(true)
      }
    }, 30000)

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowFloatingButton(true)

      const dismissed = localStorage.getItem("pwaDismissed") === "true"
      const visits = parseInt(localStorage.getItem("pwaVisits") || "0", 10)
      
      // Prompt if visits >= 2 and not previously dismissed
      if (visits >= 2 && !dismissed) {
        setShowInstallPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [])

  const handleInstallApp = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowFloatingButton(false)
    }
    setShowInstallPrompt(false)
  }

  const handleDismissPrompt = () => {
    localStorage.setItem("pwaDismissed", "true")
    setShowInstallPrompt(false)
  }

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" />
  
  if ((user.mustChangePassword || user.forcePasswordChange) && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />
  }

  // Mobile Bottom Navigation Tabs definition
  const role = user?.role
  const mobileNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    ...(role === "ADMIN" 
      ? [{ name: "Employees", href: "/employees", icon: Users }] 
      : [{ name: "Attendance", href: "/attendance", icon: Calendar }]
    ),
    { name: "Leave", href: "/leave", icon: FileText },
    { name: "Activities", href: "/activities", icon: ClipboardList },
    { name: "Settings", href: "/settings", icon: Settings }
  ]

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar (hidden on mobile Bottom Nav layout) */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Universal Top Premium Navbar */}
        <header className="h-16 border-b border-slate-200/60 bg-white/70 backdrop-blur-md flex items-center justify-between px-6 z-20 sticky top-0 shrink-0">
          {/* Brand/Search Left Side */}
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Search employees, clients, leaves..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-normal"
              />
            </div>
          </div>

          {/* Top Actions Right Side */}
          <div className="flex items-center gap-3">
            {/* Install Button Header Toggle */}
            {showFloatingButton && (
              <button 
                onClick={handleInstallApp}
                className="hidden md:flex items-center gap-1.5 btn-secondary text-xs py-1.5 px-3 border-indigo-100 hover:bg-indigo-50/50 text-indigo-600 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200/50 relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              {/* Notifications Dropdown Panel */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-40"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                        <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
                        <button className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600">Mark all read</button>
                      </div>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {notifications.map((n) => (
                          <div key={n.id} className="text-xs p-2 hover:bg-slate-50 rounded-xl transition-colors text-left">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-semibold text-slate-800">{n.title}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{n.time}</span>
                            </div>
                            <p className="text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            {/* User Profile Summary */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200/60">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-none">{role === "ADMIN" ? "Admin" : "Employee"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto relative pb-20 lg:pb-0">
          <MotionDiv
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto"
          >
            <Outlet context={{ searchQuery }} />
          </MotionDiv>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Visible only on smaller viewports) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t border-slate-200/60 flex items-center justify-around px-2 z-35 shadow-xl">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href)
          return (
            <Link 
              key={item.name} 
              to={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <item.icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* PWA Floating Install Button (Mobile Only) */}
      {showFloatingButton && isMobile && (
        <button 
          onClick={handleInstallApp}
          className="fixed bottom-20 right-4 z-40 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center ring-4 ring-indigo-100"
        >
          <Download className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Slide-Up Install App Prompt Overlay */}
      <AnimatePresence>
        {showInstallPrompt && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-45" onClick={handleDismissPrompt} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 rounded-t-3xl p-6 z-50 shadow-2xl flex flex-col space-y-5"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Smartphone className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Install SharpKode Workforce</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Add to your home screen for native access.</p>
                  </div>
                </div>
                <button onClick={handleDismissPrompt} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>

              {/* Benefits */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                  <span>Faster Login & Dashboard Loads</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                  <span>Better GPS & Geolocation Access</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                  <span>App-like Fullscreen Standalone View</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleDismissPrompt} className="btn-secondary py-3 text-sm font-semibold text-slate-500 border-slate-200 rounded-xl">
                  Not Now
                </button>
                <button onClick={handleInstallApp} className="btn-primary py-3 text-sm font-semibold rounded-xl">
                  Install App
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Layout
