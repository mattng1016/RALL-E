import { useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { MAP_CENTER, MAP_ZOOM, SPORT_COLORS } from '../lib/constants'
import { capitalize, formatDateTime, formatPrice } from '../lib/format'

function sessionBadge(startTime) {
  const start = new Date(startTime)
  const now = new Date()
  if (start.toDateString() === now.toDateString()) {
    return (start.getTime() - now.getTime()) / 3_600_000 < 3 ? 'SOON' : 'TODAY'
  }
  return 'UPCOMING'
}

function ActivityCard({ session }) {
  return (
    <article className="drawy-activity-card">
      <span className="drawy-activity-badge">{sessionBadge(session.start_time)}</span>
      <h2>{session.is_coach ? `${capitalize(session.sport)} lesson` : `${capitalize(session.sport)} pickup`}</h2>
      <p className="drawy-activity-location">
        {session.court.name} <span aria-hidden="true">·</span> {formatDateTime(session.start_time)}
      </p>

      <div className="drawy-activity-players">
        <span className="drawy-people-icon" aria-hidden="true">
          <svg viewBox="0 0 40 32" role="presentation">
            <circle cx="8" cy="8" r="4" />
            <circle cx="20" cy="6" r="5" />
            <circle cx="32" cy="8" r="4" />
            <path d="M1 27v-5a7 7 0 0 1 14 0v5H1Zm10 0v-7a9 9 0 0 1 18 0v7H11Zm14 0v-5a7 7 0 0 1 14 0v5H25Z" />
          </svg>
        </span>
        <div>
          <strong>{session.participant_count} {session.participant_count === 1 ? 'player' : 'players'}</strong>
          <span>{Math.max(0, session.capacity - session.participant_count)} spots open · {capitalize(session.level)}</span>
        </div>
      </div>

      <div className="drawy-activity-cost">
        <span>Cost per player</span>
        <strong>{formatPrice(session.price)}</strong>
      </div>

      <Link to={`/sessions/${session.id}`} className="drawy-activity-join">
        Join activity
      </Link>
    </article>
  )
}

export default function SessionMap({ sessions }) {
  const [selectedSessionId, setSelectedSessionId] = useState(null)

  return (
    <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} className="drawy-map h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {sessions.map((session) => (
        <CircleMarker
          key={session.id}
          center={[session.court.lat, session.court.lng]}
          radius={selectedSessionId === session.id ? 14 : 12}
          eventHandlers={{ click: () => setSelectedSessionId(session.id) }}
          pathOptions={{
            color: selectedSessionId === session.id ? '#FD6326' : '#1A265A',
            weight: selectedSessionId === session.id ? 3 : 2,
            fillColor: SPORT_COLORS[session.sport],
            fillOpacity: 1,
          }}
        >
          <Popup
            className="drawy-session-popup"
            minWidth={280}
            maxWidth={320}
            offset={[0, -10]}
            autoPan
            autoPanPadding={[28, 36]}
            keepInView
            eventHandlers={{
              remove: () => setSelectedSessionId((current) => (current === session.id ? null : current)),
            }}
          >
            <ActivityCard session={session} />
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
