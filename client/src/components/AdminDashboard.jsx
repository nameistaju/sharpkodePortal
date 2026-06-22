import { Building2Icon, CalendarIcon, FileTextIcon, UsersIcon } from 'lucide-react'
import { motion } from 'framer-motion'

const MotionDiv = motion.div

const AdminDashboard = ({ data }) => {
    const stats = [
        { icon: UsersIcon, value: data.totalEmployees, label: "Total Employees" },
        { icon: CalendarIcon, value: data.presentToday, label: "Present Today" },
        { icon: FileTextIcon, value: data.onLeave, label: "On Leave" },
        { icon: Building2Icon, value: data.activeClients, label: "Active Clients" },
    ]

  return (
       <div className="animate-fade-in">
        <div className="page-header">
            <h1 className='page-title'>Dashboard</h1>
            <p className="page-subtitle">Welcome back, Admin - here is your Workforce overview</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8'>
            {stats.map((s, index)=>(
                <MotionDiv
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.035, duration: 0.18 }}
                    className='card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between'
                >
                    <div>
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70"/>
                        <p className='text-sm font-medium text-slate-500'>{s.label}</p>
                        <p className='text-3xl font-semibold text-slate-950 mt-1 tracking-tight'>{s.value ?? 0}</p>
                    </div>
                    <s.icon className='size-10 p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-200'/>
                </MotionDiv>
            ))}
        </div>
    </div>
  )
}

export default AdminDashboard
