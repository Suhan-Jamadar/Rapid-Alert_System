import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Alert, Priority } from '@/types/simulation';
import 'leaflet/dist/leaflet.css';

const priorityRadius: Record<Priority, number> = {
  CRITICAL: 14,
  HIGH: 11,
  MEDIUM: 8,
  LOW: 6,
};

const priorityColor: Record<Priority, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#06b6d4',
  LOW: '#6b7280',
};

function MapUpdater({ alerts }: { alerts: Alert[] }) {
  const map = useMap();
  const hasAlerts = alerts.length > 0;

  useEffect(() => {
    if (hasAlerts) {
      const bounds = alerts.map(a => [a.coordinates.lat, a.coordinates.lng] as [number, number]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
      }
    }
  }, [alerts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export default function AlertHeatMap({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater alerts={alerts} />
        {alerts.map(alert => (
          <CircleMarker
            key={alert.id}
            center={[alert.coordinates.lat, alert.coordinates.lng]}
            radius={priorityRadius[alert.priority]}
            pathOptions={{
              color: priorityColor[alert.priority],
              fillColor: priorityColor[alert.priority],
              fillOpacity: 0.5,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold">{alert.priority} — {alert.incidentType}</p>
                <p>{alert.location}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
