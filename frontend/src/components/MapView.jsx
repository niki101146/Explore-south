import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

// Circle markers avoid the default-marker image problem with Vite.
export default function MapView({ destination }) {
  const lat = parseFloat(destination.latitude);
  const lng = parseFloat(destination.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const spots = destination.attractions.filter((a) => a.latitude && a.longitude);

  return (
    <div className="h-80 rounded-xl overflow-hidden">
      <MapContainer center={[lat, lng]} zoom={12} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={[lat, lng]} radius={10}
          pathOptions={{ color: "#3b2417", fillColor: "#3b2417", fillOpacity: 0.8 }}>
          <Popup>{destination.name}</Popup>
        </CircleMarker>
        {spots.map((a) => (
          <CircleMarker key={a.id} center={[parseFloat(a.latitude), parseFloat(a.longitude)]}
            radius={7} pathOptions={{ color: "#facc15", fillColor: "#facc15", fillOpacity: 0.9 }}>
            <Popup>{a.name}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
