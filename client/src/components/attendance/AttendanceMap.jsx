import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, ShieldCheck, ShieldAlert } from 'lucide-react'

// Custom DivIcons for styling without external image dependencies
const officeIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #3b82f6; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(59,130,246,0.4); display: flex; align-items: center; justify-content: center; transform: translate(1px, 1px);"><div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
})

const employeeIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #10b981; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(16,185,129,0.4); display: flex; align-items: center; justify-content: center; transform: translate(1px, 1px);"><div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
})

// Sub-component to dynamically update map bounds to fit both office and user
const MapController = ({ officeCoords, userCoords }) => {
  const map = useMap()

  useEffect(() => {
    if (officeCoords && userCoords) {
      const bounds = L.latLngBounds([
        [officeCoords.latitude, officeCoords.longitude],
        [userCoords.latitude, userCoords.longitude]
      ])
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 })
    } else if (officeCoords) {
      map.setView([officeCoords.latitude, officeCoords.longitude], 16)
    }
  }, [map, officeCoords, userCoords])

  return null
}

const AttendanceMap = ({ officeCoords, userCoords, isInside, distance, accuracy }) => {
  const officeCenter = [officeCoords.latitude, officeCoords.longitude]

  return (
    <div className="card overflow-hidden flex flex-col md:flex-row gap-5 p-5">
      {/* Geolocation Metrics Section */}
      <div className="md:w-1/3 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-md font-semibold text-slate-800 mb-2">Live GPS Verification</h3>
          <p className="text-xs text-slate-500">
            Attendance verification requires you to be within the allowed radius of the office coordinates.
          </p>
        </div>

        {/* Status Badge */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${
          isInside 
            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50/50 border-rose-100 text-rose-800'
        }`}>
          {isInside ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider">Verification Status</p>
            <p className="text-sm font-bold mt-0.5">
              {isInside ? '✓ Inside Office Radius' : '✕ Outside Office Radius'}
            </p>
          </div>
        </div>

        {/* Metrics details */}
        <div className="space-y-3 pt-2 text-sm text-slate-600">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-xs font-medium text-slate-400">Allowed Radius</span>
            <span className="font-semibold text-slate-700">{officeCoords.radiusMeters}m</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-xs font-medium text-slate-400">Current Distance</span>
            <span className={`font-semibold ${isInside ? 'text-emerald-600' : 'text-rose-600'}`}>
              {distance !== null ? `${Math.round(distance)}m` : 'Calculating...'}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span className="text-xs font-medium text-slate-400">GPS Accuracy</span>
            <span className="font-semibold text-slate-700">
              {accuracy !== null ? `±${Math.round(accuracy)}m` : 'Waiting...'}
            </span>
          </div>
          {distance !== null && !isInside && (
            <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-500 text-center font-medium">
              Move {Math.round(distance - officeCoords.radiusMeters)}m closer to check in.
            </div>
          )}
        </div>
      </div>

      {/* Map Container Section */}
      <div className="flex-1 min-h-[300px] md:min-h-[350px] relative rounded-xl overflow-hidden border border-slate-200 shadow-inner z-10">
        <MapContainer
          center={officeCenter}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Office Circle & Marker */}
          <Circle
            center={officeCenter}
            radius={officeCoords.radiusMeters}
            pathOptions={{
              color: isInside ? '#10b981' : '#3b82f6',
              fillColor: isInside ? '#10b981' : '#3b82f6',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: isInside ? 'none' : '4, 4'
            }}
          />
          <Marker position={officeCenter} icon={officeIcon}>
            <Popup>
              <div className="text-xs font-semibold text-slate-800">
                <MapPin className="inline w-3 h-3 text-blue-500 mr-1" />
                SharpKode Office
              </div>
            </Popup>
          </Marker>

          {/* Employee Marker */}
          {userCoords && (
            <Marker position={[userCoords.latitude, userCoords.longitude]} icon={employeeIcon}>
              <Popup>
                <div className="text-xs font-semibold text-slate-800">
                  <Navigation className="inline w-3 h-3 text-emerald-500 mr-1" />
                  Your Location
                </div>
              </Popup>
            </Marker>
          )}

          {/* Controller to handle focus bounds */}
          <MapController officeCoords={officeCoords} userCoords={userCoords} />
        </MapContainer>
      </div>
    </div>
  )
}

export default AttendanceMap
