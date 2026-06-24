import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Calendar, FileText, Building2, Clock, AlertCircle, 
  Sparkles, ArrowRight, UserCheck, CheckCircle2, Search, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

const MotionDiv = motion.div;

const COLORS = ['#5B4CFF', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6'];

const AdminDashboard = ({ data, refetch }) => {
  const [liveTime, setLiveTime] = useState(new Date());
  const [attendanceSearch, setAttendanceSearch] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = liveTime.toLocaleDateString([], { 
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' 
  });
  const formattedTime = liveTime.toLocaleTimeString([], { 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  });

  // KPI calculations
  const kpis = [
    {
      label: 'Total Employees',
      value: data.totalEmployees ?? 0,
      desc: 'Active contracts',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100/50'
    },
    {
      label: 'Present Today',
      value: data.presentToday ?? 0,
      desc: 'Clocked-in shifts',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100/50'
    },
    {
      label: 'On Leave',
      value: data.onLeave ?? 0,
      desc: 'Approved leaves',
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100/50'
    },
    {
      label: 'Late Arrivals',
      value: data.lateArrivals ?? 0,
      desc: 'Punches after 9:30 AM',
      icon: Clock,
      color: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-100/50'
    },
    {
      label: 'Active Clients',
      value: data.activeClients ?? 0,
      desc: 'Managed accounts',
      icon: Building2,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 border-cyan-100/50'
    },
    {
      label: 'Pending Corrections',
      value: data.pendingCorrections ?? 0,
      desc: 'Awaiting review',
      icon: AlertCircle,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-100/50'
    }
  ];

  // Filter today's attendance table
  const filteredAttendance = (data.todayAttendance || []).filter(item => 
    item.employee.name.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
    item.employee.department.toLowerCase().includes(attendanceSearch.toLowerCase())
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'PUNCH_IN': return Clock;
      case 'PUNCH_OUT': return Clock;
      case 'LEAVE': return FileText;
      case 'CORRECTION': return AlertCircle;
      default: return Activity;
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'success':
      case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'info': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* 1. Header Banner */}
      <MotionDiv 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-linear-to-tr from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/15"
      >
        <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin Operations Center</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold mt-1 tracking-tight">
              Good Morning, Admin 👋
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 font-medium">
              Here is the live operational summary for the workforce.
            </p>
          </div>
          <div className="text-left sm:text-right shrink-0 bg-white/5 border border-white/10 rounded-2xl p-3 sm:px-4 backdrop-blur-xs font-mono">
            <p className="text-xs text-slate-400 font-semibold">{formattedDate}</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">{formattedTime}</p>
          </div>
        </div>
      </MotionDiv>

      {/* 2. KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => (
          <MotionDiv 
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className={`card p-4.5 flex flex-col justify-between border ${kpi.bg} shadow-xs hover:shadow-md transition-all duration-300`}
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{kpi.label}</span>
              <kpi.icon className={`w-8 h-8 p-1.8 rounded-lg bg-white border border-slate-200/50 shadow-2xs shrink-0 ${kpi.color}`} />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{kpi.desc}</p>
            </div>
          </MotionDiv>
        ))}
      </div>

      {/* 3. Recharts Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart */}
        <MotionDiv 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 card p-6 shadow-sm border border-slate-200/60 bg-white"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Attendance Trend (7 Days)</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Presence rates including active approved leaves</p>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase"><span className="w-2.5 h-2.5 rounded-xs bg-[#5B4CFF]" /> Present</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase"><span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]" /> Leave</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase"><span className="w-2.5 h-2.5 rounded-xs bg-[#F43F5E]" /> Absent</span>
            </div>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.attendanceTrend || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B4CFF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#5B4CFF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLeave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }} />
                <Area type="monotone" dataKey="Present" stroke="#5B4CFF" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" />
                <Area type="monotone" dataKey="Leave" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorLeave)" />
                <Area type="monotone" dataKey="Absent" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#colorAbsent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </MotionDiv>

        {/* Department Split Donut Chart */}
        <MotionDiv 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.14 }}
          className="card p-6 shadow-sm border border-slate-200/60 bg-white flex flex-col"
        >
          <div className="pb-4 border-b border-slate-100 mb-5">
            <h2 className="font-bold text-slate-800 text-sm">Department Split</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Active employee distribution</p>
          </div>
          <div className="h-56 relative flex items-center justify-center flex-1">
            {data.departmentSplit && data.departmentSplit.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.departmentSplit}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.departmentSplit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Members`, 'Count']} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-xs">No department data available</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5 justify-center pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
            {data.departmentSplit && data.departmentSplit.map((dept, idx) => (
              <span key={dept.name} className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                {dept.name}
              </span>
            ))}
          </div>
        </MotionDiv>
      </div>

      {/* 4. Attendance Table & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Attendance Table */}
        <MotionDiv 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="lg:col-span-2 card p-6 shadow-sm border border-slate-200/60 bg-white"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-3">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Today's Attendance Status</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time status of all active employee shifts</p>
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input 
                type="text"
                placeholder="Search by name or department..." 
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all font-normal"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                  <th className="p-3 pl-2">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Punch In</th>
                  <th className="p-3">Punch Out</th>
                  <th className="p-3">Shift Hours</th>
                  <th className="p-3 pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {filteredAttendance.length > 0 ? (
                  filteredAttendance.map((row) => (
                    <tr key={row.employee._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 pl-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                            {row.employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-slate-800 font-bold leading-tight">{row.employee.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-none">{row.employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{row.employee.department}</td>
                      <td className="p-3 text-slate-500 font-mono">
                        {row.punchIn ? new Date(row.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3 text-slate-500 font-mono">
                        {row.punchOut ? new Date(row.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3 text-slate-600 font-mono">{row.workingHours > 0 ? `${row.workingHours.toFixed(2)} hrs` : '-'}</td>
                      <td className="p-3 pr-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          row.status === 'PUNCHED_OUT' 
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : row.status === 'PUNCHED_IN'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {row.status === 'PUNCHED_OUT' ? 'Punched Out' : row.status === 'PUNCHED_IN' ? 'Punched In' : 'Absent'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-slate-400 py-6">No matching attendance records found today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </MotionDiv>

        {/* Recent Activity Feed */}
        <MotionDiv 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="card p-6 shadow-sm border border-slate-200/60 bg-white"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <h2 className="font-bold text-slate-800 text-sm">Recent Activity Feed</h2>
            <Link to="/activities" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View Logs</Link>
          </div>

          <div className="relative border-l border-slate-100 pl-4 ml-2.5 space-y-4">
            {data.recentActivities && data.recentActivities.length > 0 ? (
              data.recentActivities.map((act) => {
                const Icon = getActivityIcon(act.type);
                const colorClass = getActivityColor(act.status);
                const formattedTimeStr = new Date(act.timestamp).toLocaleDateString([], {
                  month: 'short', day: 'numeric'
                }) + ' ' + new Date(act.timestamp).toLocaleTimeString([], {
                  hour: '2-digit', minute: '2-digit'
                });

                return (
                  <div key={act.id} className="relative text-left">
                    <div className={`absolute -left-7.5 top-0.5 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="pl-1">
                      <div className="flex justify-between items-center gap-4">
                        <span className="font-bold text-slate-800 text-xs">{act.title}</span>
                        <span className="text-[9px] text-slate-400 font-mono font-medium">{formattedTimeStr}</span>
                      </div>
                      <p className="text-slate-500 text-[10px] mt-0.5 leading-relaxed">{act.desc}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-xs py-4 text-left">No recent workforce activities.</p>
            )}
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default AdminDashboard;
