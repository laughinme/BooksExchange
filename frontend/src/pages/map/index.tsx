import "leaflet/dist/leaflet.css";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import { useProfileQuery } from "@/entities/profile/model/hooks";
import { useExchangeLocationsQuery, useNearestExchangeLocation } from "@/entities/reference/model/hooks";
import { Spinner } from "@/shared/ui/spinner";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
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
  const { data: nearest } = useNearestExchangeLocation();

  const defaultCenter: [number, number] = [55.7558, 37.6173];
  const cityId = profile?.city?.id;
  const cityLocation = cityId
    ? locations.find((loc) => loc.city.id === cityId)
    : undefined;
  const mapCenter: [number, number] = cityLocation
    ? [cityLocation.latitude, cityLocation.longitude]
    : defaultCenter;
  const zoom = cityLocation ? 12 : 10;
  const mapKey = cityLocation ? `city-${cityLocation.id}` : "default";

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
      {nearest && (
        <div className="absolute left-4 top-4 z-[1000] rounded-lg bg-card/90 p-3 shadow">
          <p className="text-sm font-semibold">Ближайшая точка</p>
          <p className="text-sm text-muted-foreground">{nearest.title}</p>
          <p className="text-xs text-muted-foreground">{nearest.address}</p>
          <a
            href={`https://yandex.ru/maps/?rtext=~${nearest.latitude},${nearest.longitude}`}
            className="text-xs text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            Проложить маршрут
          </a>
        </div>
      )}
      <MapContainer
        key={mapKey}
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
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
