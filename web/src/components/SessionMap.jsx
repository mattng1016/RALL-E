import { useEffect, useRef, useState } from 'react'
import { divIcon } from 'leaflet'
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { MAP_CENTER, MAP_ZOOM, SPORT_COLORS } from '../lib/constants'
import { capitalize, formatDateTime, formatPrice, formatDistance } from '../lib/format'

function sessionBadge(startTime) {
  const start = new Date(startTime)
  const now = new Date()
  if (start.toDateString() === now.toDateString()) {
    return (start.getTime() - now.getTime()) / 3_600_000 < 3 ? 'SOON' : 'TODAY'
  }
  return 'UPCOMING'
}

function ActivityCard({ session, userLocation, onMouseEnter, onMouseLeave }) {
  const distance = formatDistance(userLocation, session.court)
  return (
    <article className="drawy-activity-card" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <span className="drawy-activity-badge">{sessionBadge(session.start_time)}</span>
      <h2>{session.is_coach ? `${capitalize(session.sport)} lesson` : `${capitalize(session.sport)} pickup`}</h2>
      <p className="drawy-activity-location">
        {session.court.name} <span aria-hidden="true">·</span> {formatDateTime(session.start_time)}
        {distance && <> <span aria-hidden="true">·</span> {distance}</>}
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

function groupByCourt(sessions) {
  const groups = new Map()
  for (const session of sessions) {
    const key = session.court.id
    const group = groups.get(key) ?? { sessions: [], center: [session.court.lat, session.court.lng] }
    group.sessions.push(session)
    groups.set(key, group)
  }
  for (const group of groups.values()) {
    group.sessions.sort((a, b) => a.start_time.localeCompare(b.start_time))
  }
  return [...groups.values()]
}

function SessionMarkers({ sessions, selectedSessionId, focusRequest, listOpen, userLocation, onSelect, onDeselect }) {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())
  const [hoveredSessionId, setHoveredSessionId] = useState(null)
  const markerRefs = useRef({})
  const hoverTimer = useRef(null)
  const closeTimer = useRef(null)
  const selectionMode = useRef(null)
  const lastFocusToken = useRef(0)

  useEffect(() => {
    if (!userLocation) return
    const zoom = Math.max(map.getZoom(), 14)
    const size = map.getSize()
    const rect = map.getContainer().getBoundingClientRect()
    const panel = listOpen ? document.getElementById('session-list-panel') : null
    const visibleLeft = Math.max(rect.left, panel?.getBoundingClientRect().right ?? rect.left)
    const targetX = (visibleLeft + rect.right) / 2 - rect.left
    const targetY = size.y / 2
    const locationPoint = map.project([userLocation.lat, userLocation.lng], zoom)
    const centerPoint = {
      x: locationPoint.x + size.x / 2 - targetX,
      y: locationPoint.y + size.y / 2 - targetY,
    }
    map.flyTo(map.unproject([centerPoint.x, centerPoint.y], zoom), zoom, { duration: 0.45 })
  }, [listOpen, map, userLocation])

  useEffect(() => {
    const updateZoom = () => setZoom(map.getZoom())
    map.on('zoomend', updateZoom)
    return () => map.off('zoomend', updateZoom)
  }, [map])

  useEffect(() => () => {
    window.clearTimeout(hoverTimer.current)
    window.clearTimeout(closeTimer.current)
  }, [])

  useEffect(() => {
    if (!focusRequest || focusRequest.token === lastFocusToken.current) return
    lastFocusToken.current = focusRequest.token

    const session = sessions.find((item) => item.id === focusRequest.sessionId)
    if (!session) return

    selectionMode.current = 'click'
    const location = [session.court.lat, session.court.lng]
    const targetZoom = Math.max(map.getZoom(), 16)
    const size = map.getSize()
    const mapRect = map.getContainer().getBoundingClientRect()
    const panel = listOpen ? document.getElementById('session-list-panel') : null
    const panelRight = panel?.getBoundingClientRect().right ?? mapRect.left
    const visibleLeft = Math.max(mapRect.left, panelRight)
    const targetX = (visibleLeft + mapRect.right) / 2 - mapRect.left
    const targetY = mapRect.height / 2
    const pinPoint = map.project(location, targetZoom)
    const centerPoint = {
      x: pinPoint.x + size.x / 2 - targetX,
      y: pinPoint.y + size.y / 2 - targetY,
    }
    const targetCenter = map.unproject([centerPoint.x, centerPoint.y], targetZoom)
    const currentCenter = map.project(map.getCenter(), targetZoom)
    const alreadyPositioned = map.getZoom() === targetZoom && currentCenter.distanceTo(centerPoint) < 1
    const centerPopupInVisibleMap = (attempt = 0) => {
      const marker = markerRefs.current[session.id]
      const popupElement = marker?.getPopup()?.getElement()
      if (!popupElement || !popupElement.isConnected) {
        if (attempt < 8) requestAnimationFrame(() => centerPopupInVisibleMap(attempt + 1))
        return
      }

      const currentPopup = popupElement.getBoundingClientRect()
      const currentMap = map.getContainer().getBoundingClientRect()
      const sidebar = listOpen ? document.getElementById('session-list-panel') : null
      const currentVisibleLeft = Math.max(currentMap.left, sidebar?.getBoundingClientRect().right ?? currentMap.left)
      const desiredX = (currentVisibleLeft + currentMap.right) / 2
      const desiredY = (currentMap.top + currentMap.bottom) / 2
      const offsetX = (currentPopup.left + currentPopup.right) / 2 - desiredX
      const offsetY = (currentPopup.top + currentPopup.bottom) / 2 - desiredY

      if (Math.abs(offsetX) > 1 || Math.abs(offsetY) > 1) {
        map.panBy([offsetX, offsetY], { animate: false })
      }
    }
    const openAndCenterPopup = () => {
      markerRefs.current[session.id]?.openPopup()
      requestAnimationFrame(() => requestAnimationFrame(() => centerPopupInVisibleMap()))
    }

    if (alreadyPositioned) {
      openAndCenterPopup()
    } else {
      map.once('moveend', () => {
        requestAnimationFrame(() => requestAnimationFrame(openAndCenterPopup))
      })
      map.flyTo(targetCenter, targetZoom, { duration: 0.45 })
    }
  }, [focusRequest, listOpen, map, sessions])

  const clearTimers = () => {
    window.clearTimeout(hoverTimer.current)
    window.clearTimeout(closeTimer.current)
  }

  const keepPopupOpen = () => window.clearTimeout(closeTimer.current)

  const closeAfterHover = (sessionId) => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => {
      if (selectionMode.current !== 'hover') return
      selectionMode.current = null
      markerRefs.current[sessionId]?.closePopup()
      onDeselect(sessionId)
    }, 250)
  }

  const groups = zoom >= 16 ? groupByCourt(sessions) : groupSessions(sessions, map, zoom)

  return groups.map((group) => {
    if (group.sessions.length > 1) {
      const icon = divIcon({
        className: 'drawy-cluster-marker',
        html: `<span>${group.sessions.length}</span>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      })
      const oneCourt = new Set(group.sessions.map((session) => session.court.id)).size === 1
      const markerRef = (marker) => {
        for (const session of group.sessions) {
          if (marker) markerRefs.current[session.id] = marker
          else delete markerRefs.current[session.id]
        }
      }

      return (
        <Marker
          key={`cluster-${group.sessions.map((session) => session.id).join('-')}`}
          position={oneCourt ? [group.sessions[0].court.lat, group.sessions[0].court.lng] : group.center}
          icon={icon}
          ref={markerRef}
          eventHandlers={oneCourt ? undefined : { click: () => map.flyTo(group.center, Math.min(map.getZoom() + 2, 16)) }}
        >
          {oneCourt && (
            <Popup className="drawy-session-popup" minWidth={280} maxWidth={320} autoPan={false}>
              <div className="drawy-court-sessions">
                <p className="drawy-court-sessions-title">
                  {group.sessions.length} sessions at {group.sessions[0].court.name}
                </p>
                {group.sessions.map((session) => (
                  <ActivityCard
                    key={session.id}
                    session={session}
                    userLocation={userLocation}
                    onMouseEnter={keepPopupOpen}
                    onMouseLeave={() => {
                      if (selectionMode.current === 'hover') closeAfterHover(session.id)
                    }}
                  />
                ))}
              </div>
            </Popup>
          )}
        </Marker>
      )
    }

    const session = group.sessions[0]
    const isSelected = selectedSessionId === session.id
    const isHovered = hoveredSessionId === session.id
    return (
      <CircleMarker
        key={session.id}
        center={[session.court.lat, session.court.lng]}
        ref={(marker) => {
          if (marker) markerRefs.current[session.id] = marker
          else delete markerRefs.current[session.id]
        }}
        radius={isSelected || isHovered ? 15 : 12}
        eventHandlers={{
          click: () => {
            clearTimers()
            selectionMode.current = 'click'
            onSelect(session.id)
          },
          mouseover: () => {
            clearTimers()
            selectionMode.current = 'hover'
            setHoveredSessionId(session.id)
            hoverTimer.current = window.setTimeout(() => {
              onSelect(session.id)
              markerRefs.current[session.id]?.openPopup()
            }, 550)
          },
          mouseout: () => {
            window.clearTimeout(hoverTimer.current)
            setHoveredSessionId(null)
            if (selectionMode.current === 'hover') closeAfterHover(session.id)
          },
        }}
        pathOptions={{
          color: isSelected || isHovered ? '#FD6326' : '#1A265A',
          weight: isSelected || isHovered ? 3 : 2,
          fillColor: SPORT_COLORS[session.sport],
          fillOpacity: 1,
        }}
      >
        <Popup
          className="drawy-session-popup"
          minWidth={280}
          maxWidth={320}
          offset={[0, -10]}
          autoPan={false}
          autoPanPadding={[28, 36]}
          eventHandlers={{
            remove: () => onDeselect(session.id),
          }}
        >
          <ActivityCard
            session={session}
            userLocation={userLocation}
            onMouseEnter={keepPopupOpen}
            onMouseLeave={() => {
              if (selectionMode.current === 'hover') closeAfterHover(session.id)
            }}
          />
        </Popup>
      </CircleMarker>
    )
  })
}

export default function SessionMap({ sessions, selectedSessionId, focusRequest, listOpen, userLocation, onSelect, onDeselect }) {
  return (
    <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} className="drawy-map h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SessionMarkers
        sessions={sessions}
        userLocation={userLocation}
        selectedSessionId={selectedSessionId}
        focusRequest={focusRequest}
        listOpen={listOpen}
        onSelect={onSelect}
        onDeselect={onDeselect}
      />
      {userLocation && (
        <>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={userLocation.accuracy}
            pathOptions={{ color: '#50A5B1', fillColor: '#50A5B1', fillOpacity: 0.12, weight: 1 }}
          />
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={8}
            pathOptions={{ color: '#FEF6ED', weight: 3, fillColor: '#1A265A', fillOpacity: 1 }}
          />
        </>
      )}
    </MapContainer>
  )
}
