import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { MAP_CENTER, MAP_ZOOM, SPORT_COLORS, SPORT_EMOJI } from '../lib/constants'
import { formatDateTime } from '../lib/format'

export default function SessionMap({ sessions }) {
  return (
    <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {sessions.map((session) => (
        <CircleMarker
          key={session.id}
          center={[session.court.lat, session.court.lng]}
          radius={11}
          pathOptions={{ color: 'white', weight: 2, fillColor: SPORT_COLORS[session.sport], fillOpacity: 0.9 }}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold">
                {SPORT_EMOJI[session.sport]} {session.court.name}
              </p>
              <p>{formatDateTime(session.start_time)}</p>
              <p>
                {session.capacity - session.participant_count} spots left · {session.level}
              </p>
              <Link to={`/sessions/${session.id}`} className="font-medium text-blue-600">
                View session →
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
