import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Calendar, Clock, Flame, Award, FileText, 
  MapPin, Compass, ShieldAlert, Sparkles, Activity, 
  PlusCircle, History, ClipboardCheck, Megaphone
} from 'lucide-react';
import CheckInButton from './attendance/CheckInButton';

const MotionDiv = motion.div;

const OFFICE_LOCATION = {
  latitude: 17.7283443,
  longitude: 83.3144685,
  radiusMeters: 200
};

const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
};

const EmployeeDashboard = ({ data, user, refetch }) => {
  // Geolocation States
  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [loadingCoords, setLoadingCoords] = useState(true);
  const [gpsError, setGpsError] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isInside, setIsInside] = useState(false);

  // Live session clock for ticking shift hours
  const [sessionHours, setSessionHours] = useState('0.00h');
  const todayRecord = data.attendanceStatus?.attendance;
  const isPunchedIn = !!todayRecord?.punchIn?.time;
  const isPunchedOut = !!todayRecord?.punchOut?.time;

  // Live ticking clock for display
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Live session hours tracker
  useEffect(() => {
    if (!isPunchedIn) {
      setSessionHours('0.00h');
      return;
    }
    if (isPunchedOut) {
      setSessionHours(`${(todayRecord.workingHours || 0).toFixed(2)}h`);
      return;
    }

    const updateLiveHours = () => {
      const diffMs = new Date() - new Date(todayRecord.punchIn.time);
      const hours = diffMs / 3600000;
      setSessionHours(`${hours.toFixed(2)}h`);
    };

    updateLiveHours();
    const timer = setInterval(updateLiveHours, 60000);
    return () => clearInterval(timer);
  }, [isPunchedIn, isPunchedOut, todayRecord]);

  // GPS Live Tracking Effect
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS unavailable");
      setLoadingCoords(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude });
        setAccuracy(accuracy);
        setLoadingCoords(false);
        setGpsError(null);

        const dist = calculateHaversineDistance(
          latitude,
          longitude,
          OFFICE_LOCATION.latitude,
          OFFICE_LOCATION.longitude
        );
        setDistance(dist);
        setIsInside(dist <= OFFICE_LOCATION.radiusMeters);
      },
      (error) => {
        setLoadingCoords(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError("GPS permission denied");
        } else {
          setGpsError("GPS unavailable");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedDate = liveTime.toLocaleDateString([], { 
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' 
  });
  const formattedTime = liveTime.toLocaleTimeString([], { 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  });

  // KPI Stats list
  const kpiStats = [
    {
      label: "Today's Hours",
      value: sessionHours,
      desc: isPunchedIn && !isPunchedOut ? 'Session Active' : 'Completed',
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100/50'
    },
    {
      label: 'Monthly Rate',
      value: `${data.attendancePercentage || 0}%`,
      desc: `${data.presentThisMonth || 0} Present Days`,
      icon: Award,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100/50'
    },
    {
      label: 'Current Streak',
      value: `${data.streak || 0} Days`,
      desc: 'Active Streak',
      icon: Flame,
      color: 'text-orange-600',
      bg: 'bg-orange-50 border-orange-100/50'
    }
  ];

  // Quick Action Cards
  const actionCards = [
    {
      title: 'Apply Leave',
      desc: 'Submit a new leave application request',
      icon: PlusCircle,
      href: '/leave',
      color: 'from-amber-500/10 to-orange-500/5 border-amber-100 text-amber-700 hover:border-amber-300'
    },
    {
      title: 'View History',
      desc: 'Check your detailed attendance and GPS logs',
      icon: History,
      href: '/attendance',
      color: 'from-blue-500/10 to-indigo-500/5 border-blue-100 text-blue-700 hover:border-blue-300'
    },
    {
      title: 'Request Correction',
      desc: 'Adjust past clock-in or clock-out times',
      icon: ClipboardCheck,
      href: '/corrections',
      color: 'from-purple-500/10 to-violet-500/5 border-purple-100 text-purple-700 hover:border-purple-300'
    },
    {
      title: 'Announcements',
      desc: 'Read organization updates and announcements',
      icon: Megaphone,
      href: '/announcements',
      color: 'from-pink-500/10 to-rose-500/5 border-pink-100 text-pink-700 hover:border-pink-300'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'PUNCH_IN': return Clock;
      case 'PUNCH_OUT': return History;
      case 'LEAVE': return FileText;
      case 'CORRECTION': return ClipboardCheck;
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Welcome Card Header */}
      <MotionDiv 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-linear-to-tr from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/15"
      >
        <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace Console</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold mt-1 tracking-tight">
              {getGreeting()}, {user?.name.split(' ')[0] || 'Team Member'} 👋
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 font-medium">
              {user?.department || 'Member'} • Ready to record today's sessions
            </p>
          </div>
          <div className="text-left sm:text-right shrink-0 bg-white/5 border border-white/10 rounded-2xl p-3 sm:px-4 backdrop-blur-xs font-mono">
            <p className="text-xs text-slate-400 font-semibold">{formattedDate}</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">{formattedTime}</p>
          </div>
        </div>
      </MotionDiv>

      {/* Geolocation Warning Banner */}
      {gpsError && (
        <MotionDiv 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 text-rose-800 text-sm font-semibold flex items-center gap-3 shadow-xs"
        >
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
          <span>⚠ Geolocation Required: {gpsError}. Please authorize and enable device GPS to activate punch button.</span>
        </MotionDiv>
      )}

      {/* 2. Biometric Centerpiece and Live GPS Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Large circular button in center of a card */}
        <MotionDiv 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="md:col-span-2 relative overflow-hidden bg-white/40 border border-white/20 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/50 flex flex-col items-center justify-center min-h-[340px]"
        >
          {/* Subtle breathing background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-4000" />

          <div className="flex flex-col items-center justify-center w-full">
            <CheckInButton 
              todayRecord={todayRecord} 
              onAction={refetch}
              isInsideRadius={isInside}
              distance={distance}
              coords={coords}
              loadingCoords={loadingCoords}
              officeRadius={OFFICE_LOCATION.radiusMeters}
            />

            {/* GPS Metadata readout underneath button */}
            <div className="w-full grid grid-cols-3 gap-2 pt-4 border-t border-slate-200/50 text-center text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distance</span>
                <span className={`block font-bold text-sm mt-0.5 ${isInside ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {distance !== null ? `${Math.round(distance)}m` : 'Syncing...'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</span>
                <span className="block font-bold text-sm text-slate-700 mt-0.5">
                  {accuracy !== null ? `±${Math.round(accuracy)}m` : 'Syncing...'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Geofence</span>
                <span className={`block font-bold text-sm mt-0.5 ${isInside ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {loadingCoords ? 'Syncing...' : isInside ? 'Inside' : 'Outside'}
                </span>
              </div>
            </div>
          </div>
        </MotionDiv>

        {/* Live GPS Area Card */}
        <MotionDiv 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
          className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location Status</h2>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex gap-3 items-center">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><MapPin className="w-4.5 h-4.5" /></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Office</p>
                  <p className="text-xs font-mono text-slate-600 font-semibold mt-0.5">
                    Lat: {OFFICE_LOCATION.latitude.toFixed(5)}, Lng: {OFFICE_LOCATION.longitude.toFixed(5)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Compass className="w-4.5 h-4.5" /></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Device Lat/Lng</p>
                  <p className="text-xs font-mono text-slate-600 font-semibold mt-0.5">
                    {coords 
                      ? `Lat: ${coords.latitude.toFixed(5)}, Lng: ${coords.longitude.toFixed(5)}`
                      : 'Awaiting lock...'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-2">
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              * Verification requires your device to be within the <strong>{OFFICE_LOCATION.radiusMeters}m</strong> geofence.
            </p>
            <Link to="/attendance" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              Open interactive Map
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </MotionDiv>
      </div>

      {/* 3. KPI stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiStats.map((kpi, idx) => (
          <MotionDiv 
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 + 0.1 }}
            className={`card p-5 flex items-center justify-between border ${kpi.bg} shadow-xs relative overflow-hidden`}
          >
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{kpi.value}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{kpi.desc}</p>
            </div>
            <kpi.icon className={`w-10 h-10 p-2.5 rounded-xl bg-white border border-slate-200/50 shadow-xs ${kpi.color}`} />
          </MotionDiv>
        ))}
      </div>

      {/* 4. Quick Actions grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Quick Workspace Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actionCards.map((card, idx) => (
            <MotionDiv
              key={card.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 + 0.15 }}
              whileHover={{ y: -3 }}
              className="group"
            >
              <Link 
                to={card.href}
                className={`block h-full bg-gradient-to-tr border rounded-2xl p-5 shadow-xs transition-all ${card.color}`}
              >
                <card.icon className="w-8 h-8 mb-3.5 shrink-0 group-hover:scale-105 transition-transform" />
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-slate-900">{card.title}</h3>
                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed font-medium">{card.desc}</p>
              </Link>
            </MotionDiv>
          ))}
        </div>
      </div>

      {/* 5. Personal Timeline Feed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Timeline */}
        <MotionDiv 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="md:col-span-2 card p-6 shadow-sm border border-slate-200/60 bg-white"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <h2 className="font-bold text-slate-800 text-sm">Recent Activity History</h2>
            <Link to="/activities" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All</Link>
          </div>

          <div className="relative border-l border-slate-100 pl-4 ml-2.5 space-y-5">
            {data.recentActivities && data.recentActivities.length > 0 ? (
              data.recentActivities.map((act) => {
                const Icon = getActivityIcon(act.type);
                const colorClass = getActivityColor(act.status);
                const formattedTimeStr = new Date(act.timestamp).toLocaleDateString([], {
                  month: 'short', day: 'numeric'
                }) + ' at ' + new Date(act.timestamp).toLocaleTimeString([], {
                  hour: '2-digit', minute: '2-digit'
                });

                return (
                  <div key={act.id} className="relative group">
                    {/* Circle Node */}
                    <div className={`absolute -left-7.5 top-0.5 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="text-left pl-1">
                      <div className="flex justify-between items-center gap-4">
                        <span className="font-bold text-slate-800 text-xs">{act.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">{formattedTimeStr}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{act.desc}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-xs py-4 text-left">No recent activities found.</p>
            )}
          </div>
        </MotionDiv>

        {/* Assigned Accounts / Clients */}
        <MotionDiv 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-6 shadow-sm border border-slate-200/60 bg-white flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="font-bold text-slate-800 text-sm">Assigned Clients</h2>
              <Link to="/clients" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">All Accounts</Link>
            </div>

            <div className="space-y-2.5">
              {data.assignedClients && data.assignedClients.length > 0 ? (
                data.assignedClients.map((client) => (
                  <div 
                    key={client._id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-100/50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{client.clientName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {client.services && client.services.length > 0 ? client.services.slice(0, 2).join(', ') : 'General Account'}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      client.status === 'ACTIVE' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {client.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs py-4 text-left">No assigned clients found.</p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 text-center">
            <Link to="/visits" className="btn-secondary w-full py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border-slate-200 hover:bg-slate-50">
              Log client Visit Record
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
