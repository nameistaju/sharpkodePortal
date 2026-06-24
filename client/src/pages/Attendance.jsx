import { useCallback, useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import Loading from "../components/Loading"
import CheckInButton from "../components/attendance/CheckInButton"
import AttendanceMap from "../components/attendance/AttendanceMap"
import AttendanceStats from "../components/attendance/AttendanceStats"
import AttendanceHistory from "../components/attendance/AttendanceHistory"
import api from "../api/axios"
import { toastError, unwrap, unwrapItems } from "../api/helpers"
import { useAuth } from "../context/AuthContext"
import { Clock, Calendar, Navigation, ShieldCheck, ShieldAlert, MapPin, Compass } from "lucide-react"

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

const Attendance = () => {
  const { user, token } = useAuth()
  const [history, setHistory] = useState([])
  const [todayRecord, setTodayRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  // Geolocation States
  const [coords, setCoords] = useState(null)
  const [accuracy, setAccuracy] = useState(null)
  const [loadingCoords, setLoadingCoords] = useState(true)
  const [gpsError, setGpsError] = useState(null)
  const [distance, setDistance] = useState(null)
  const [isInside, setIsInside] = useState(false)

  // Live clock state
  const [liveTime, setLiveTime] = useState(new Date())

  // Ticking live clock
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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

  // GPS Live Tracking Effect
  useEffect(() => {
    if (user?.role === "ADMIN") return;

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

        console.log("[GPS_VERIFICATION_AUDIT]:", {
          office: OFFICE_LOCATION,
          user: { latitude, longitude },
          calculatedDistanceMeters: dist,
          allowedRadiusMeters: OFFICE_LOCATION.radiusMeters,
          accuracyMeters: accuracy,
          timestamp: new Date().toISOString()
        });
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
  }, [user]);

  if (user?.role === "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) return <Loading />

  // Format date and time
  const formattedTime = liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = liveTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title text-indigo-950">Employee Attendance Center</h1>
        <p className="page-subtitle text-slate-500">Premium smart-office biometric punch terminal</p>
      </div>

      {/* Main Glass Centerpiece Card */}
      <div className="relative overflow-hidden bg-white/40 border border-white/20 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/50">
        
        {/* Subtle breathing background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse duration-4000" />
        
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Apple-style Clock Row */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium tracking-wide">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 font-bold tracking-tight text-3xl sm:text-5xl text-slate-900 font-mono">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Biometric Interactive Button */}
          <CheckInButton 
            todayRecord={todayRecord} 
            onAction={fetchData}
            isInsideRadius={isInside}
            distance={distance}
            coords={coords}
            loadingCoords={loadingCoords}
            officeRadius={OFFICE_LOCATION.radiusMeters}
          />

          {/* Location status footer info inside the main card */}
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200/50 text-center">
            <div className="p-3 bg-white/50 border border-white/40 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Distance</span>
              <span className={`font-bold sm:text-lg mt-0.5 ${isInside ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}`}>
                {distance !== null ? `${Math.round(distance)}m` : 'Calculating...'}
              </span>
            </div>
            <div className="p-3 bg-white/50 border border-white/40 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">GPS Accuracy</span>
              <span className="font-bold sm:text-lg mt-0.5 text-slate-700 font-semibold">
                {accuracy !== null ? `±${Math.round(accuracy)}m` : 'Waiting...'}
              </span>
            </div>
            <div className="p-3 bg-white/50 border border-white/40 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Location Status</span>
              <span className={`font-bold sm:text-lg mt-0.5 ${isInside ? 'text-emerald-600 font-semibold' : 'text-slate-500 font-semibold'}`}>
                {loadingCoords ? 'Syncing...' : isInside ? 'Authorized Area' : 'Restricted Area'}
              </span>
            </div>
            <div className="p-3 bg-white/50 border border-white/40 rounded-2xl flex flex-col justify-center col-span-2 md:col-span-1">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Punch Status</span>
              <span className={`font-bold sm:text-lg mt-0.5 ${todayRecord?.punchIn?.time ? 'text-orange-500 font-semibold' : 'text-emerald-500 font-semibold'}`}>
                {todayRecord?.punchOut?.time ? 'Shift Completed' : todayRecord?.punchIn?.time ? 'Active Session' : 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Geolocation Alerts banner */}
      {gpsError && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 text-rose-800 text-sm font-semibold flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <span>⚠ Geolocation Alert: {gpsError}. Geolocation is required by workforce policy. Please enable device GPS.</span>
        </div>
      )}

      {/* Live Map & Coordinates Readout */}
      {!gpsError && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Compass className="w-5 h-5 text-indigo-500" />
            <h2 className="text-md font-semibold text-slate-800 uppercase tracking-wider">Live Office Map</h2>
          </div>

          <AttendanceMap 
            officeCoords={OFFICE_LOCATION} 
            userCoords={coords} 
            isInside={isInside} 
            distance={distance} 
            accuracy={accuracy} 
          />

          {/* Coordinate Readout Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-4 flex gap-4 items-center bg-white/50">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><MapPin className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Office Coordinates</p>
                <p className="text-sm font-mono text-slate-700 font-medium mt-0.5">
                  Lat: {OFFICE_LOCATION.latitude.toFixed(6)}, Lng: {OFFICE_LOCATION.longitude.toFixed(6)}
                </p>
              </div>
            </div>
            <div className="card p-4 flex gap-4 items-center bg-white/50">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Navigation className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Employee Coordinates</p>
                <p className="text-sm font-mono text-slate-700 font-medium mt-0.5">
                  {coords 
                    ? `Lat: ${coords.latitude.toFixed(6)}, Lng: ${coords.longitude.toFixed(6)}`
                    : 'Awaiting satellite lock...'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Attendance Stats */}
      <div className="pt-2">
        <AttendanceStats history={history}/>
      </div>

      {/* Attendance History */}
      <div>
        <AttendanceHistory history={history}/>
      </div>
    </div>
  )
}

export default Attendance
