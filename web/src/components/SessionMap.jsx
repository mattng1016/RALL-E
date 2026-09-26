import { useEffect, useState } from 'react'
import { divIcon } from 'leaflet'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
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

function groupSessions(sessions, map, zoom) {
  const clusterRadius = 56
  const projected = sessions.map((session) => ({
    session,
    point: map.project([session.court.lat, session.court.lng], zoom),
  }))
  const remaining = new Set(projected.map((_, index) => index))
  const groups = []

  while (remaining.size) {
    const first = remaining.values().next().value
    remaining.delete(first)
    const queue = [first]
    const members = [first]

    while (queue.length) {
      const current = queue.pop()
      for (const candidate of [...remaining]) {
        const distance = projected[current].point.distanceTo(projected[candidate].point)
        if (distance <= clusterRadius) {
          remaining.delete(candidate)
          queue.push(candidate)
          members.push(candidate)
        }
      }
    }

    const items = members.map((index) => projected[index])
    const centerPoint = items.reduce(
      (center, item) => ({ x: center.x + item.point.x, y: center.y + item.point.y }),
      { x: 0, y: 0 },
    )
    centerPoint.x /= items.length
    centerPoint.y /= items.length
    groups.push({
      sessions: items.map((item) => item.session),
      center: map.unproject([centerPoint.x, centerPoint.y], zoom),
    })
  }

  return groups
}

function SessionMarkers({ sessions, selectedSessionId, onSelect, onDeselect }) {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

  useEffect(() => {
    const updateZoom = () => setZoom(map.getZoom())
    map.on('zoomend', updateZoom)
    return () => map.off('zoomend', updateZoom)
  }, [map])

  const groups = zoom >= 16 ? sessions.map((session) => ({ sessions: [session], center: [session.court.lat, session.court.lng] })) : groupSessions(sessions, map, zoom)

  return groups.map((group) => {
    if (group.sessions.length > 1) {
      const icon = divIcon({
        className: 'drawy-cluster-marker',
        html: `<span>${group.sessions.length}</span>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      })

      return (
        <Marker
          key={`cluster-${group.sessions.map((session) => session.id).join('-')}`}
          position={group.center}
          icon={icon}
          eventHandlers={{ click: () => map.flyTo(group.center, Math.min(map.getZoom() + 2, 16)) }}
        />
      )
    }

    const session = group.sessions[0]
    const isSelected = selectedSessionId === session.id
    return (
      <CircleMarker
        key={session.id}
        center={[session.court.lat, session.court.lng]}
        radius={isSelected ? 14 : 12}
        eventHandlers={{ click: () => onSelect(session.id) }}
        pathOptions={{
          color: isSelected ? '#FD6326' : '#1A265A',
          weight: isSelected ? 3 : 2,
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
          eventHandlers={{ remove: () => onDeselect(session.id) }}
        >
          <ActivityCard session={session} />
        </Popup>
      </CircleMarker>
    )
  })
}

export default function SessionMap({ sessions }) {
  const [selectedSessionId, setSelectedSessionId] = useState(null)

  return (
    <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} className="drawy-map h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SessionMarkers
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        onSelect={setSelectedSessionId}
        onDeselect={(sessionId) => setSelectedSessionId((current) => (current === sessionId ? null : current))}
      />
    </MapContainer>
  )
}
