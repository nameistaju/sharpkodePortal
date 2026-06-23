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

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title">GPS Attendance</h1>
        <p className="page-subtitle">Punch in and out from the approved office location</p>
      </div>

      {gpsError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <span>⚠ Geolocation Alert: {gpsError}. Please verify your device GPS is enabled and site permissions are allowed.</span>
        </div>
      )}

      {!gpsError && (
        <AttendanceMap 
          officeCoords={OFFICE_LOCATION} 
          userCoords={coords} 
          isInside={isInside} 
          distance={distance} 
          accuracy={accuracy} 
        />
      )}

      <CheckInButton 
        todayRecord={todayRecord} 
        onAction={fetchData}
        isInsideRadius={isInside}
        distance={distance}
        coords={coords}
        loadingCoords={loadingCoords}
        officeRadius={OFFICE_LOCATION.radiusMeters}
      />

      <div className="grid grid-cols-1 gap-6">
        <AttendanceStats history={history}/>
        <AttendanceHistory history={history}/>
      </div>
    </div>
  )
}

export default Attendance
