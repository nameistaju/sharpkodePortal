import { ArrowRightIcon, BriefcaseBusinessIcon, CalendarIcon, FileTextIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MotionDiv = motion.div

const EmployeeDashboard = ({data, user}) => {
    const annual = (data.leaveBalance || []).find((item)=> item.type === "ANNUAL");
    const assignedClients = data.assignedClients || [];
    const attendanceLabel = data.attendanceStatus?.onLeave
        ? "Leave"
        : data.attendanceStatus?.punchedIn
            ? (data.attendanceStatus?.punchedOut ? "Done" : "In")
            : "Out";

    const cards = [
        { icon: CalendarIcon, value: attendanceLabel, title: "Today", subtitle: "Attendance status" },
        { icon: FileTextIcon, value: annual ? Math.max(annual.allocated - annual.used, 0) : 0, title: "Annual Leave", subtitle: "Days remaining" },
        { icon: BriefcaseBusinessIcon, value: assignedClients.length, title: "Clients", subtitle: "Assigned accounts" },
    ]

  return (
    <div className="animate-fade-in">
        <div className="page-header">
            <h1 className='page-title'>Welcome, {user?.name || "Team Member"}!</h1>
            <p className="page-subtitle">{user?.department || "SharpKode Workforce"}</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8'>
            {cards.map((card, index)=>(
                <MotionDiv
                    key={card.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.035, duration: 0.18 }}
                    className='card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between'
                >
                    <div>
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70"/>
                        <p className='text-sm font-medium text-slate-500'>{card.title}</p>
                        <p className='text-3xl font-semibold text-slate-950 mt-1 tracking-tight'>{card.value}</p>
                        <p className='text-xs text-slate-400 mt-1'>{card.subtitle}</p>
                    </div>
                    <card.icon className='size-10 p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-200'/>
                </MotionDiv>
            ))}
        </div>

        <div className='card p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between'>
            <p className='text-sm text-slate-500'>Quick actions for the workday</p>
            <div className='flex flex-col sm:flex-row gap-3'>
            <Link to="/attendance" className='btn-primary text-center inline-flex items-center justify-center gap-2'>
                Mark Attendance <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link to="/leave" className='btn-secondary text-center'>Apply for Leave</Link>
            </div>
        </div>
    </div>
  )
}

export default EmployeeDashboard
