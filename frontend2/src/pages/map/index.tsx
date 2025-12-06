import "leaflet/dist/leaflet.css";

import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import { useProfileQuery } from "@/entities/profile/model/hooks";
import { useExchangeLocationsQuery } from "@/entities/reference/model/hooks";
import { Spinner } from "@/shared/ui/spinner";

delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export const MapPage = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfileQuery();
  const { data: locations = [], isPending, error } =
    useExchangeLocationsQuery(false);

  const [mapCenter, setMapCenter] = useState<[number, number]>([
    55.7558, 37.6173,
  ]);
  const [zoom, setZoom] = useState(10);

  useEffect(() => {
    if (!profile?.city) return;
    const found = locations.find(
      (loc) => loc.city.id === profile.city?.id,
    );
    if (found) {
      setMapCenter([found.latitude, found.longitude]);
      setZoom(12);
    }
  }, [locations, profile?.city]);

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        Не удалось загрузить точки обмена
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute right-4 top-4 z-[1000] rounded-full bg-card/90 p-2 shadow"
      >
        <X className="size-5" />
      </button>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{loc.title}</p>
                <p className="text-sm text-muted-foreground">{loc.address}</p>
                {loc.openingHours && (
                  <p className="text-xs">Часы работы: {loc.openingHours}</p>
                )}
                <a
                  href={`https://yandex.ru/maps/?rtext=~${loc.latitude},${loc.longitude}`}
                  className="text-sm text-primary underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Проложить маршрут
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
