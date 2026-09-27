"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Navigation, MapPin, ExternalLink } from "lucide-react";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface TaskMapProps {
  taskCoords: Coordinates;
  address?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    _taskMapReady?: boolean;
    gm_authFailure?: () => void;
  }
}

/**
 * Shows the task location on a live Google Map.
 * When the user grants location permission, draws a driving-directions
 * route from their current position to the task pin — just like the
 * Google Maps directions screenshot.
 */
export function TaskMap({ taskCoords, address, className = "" }: TaskMapProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapObj      = useRef<any>(null);
  const routeRender = useRef<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError,   setRouteError]   = useState("");
  const [routeDrawn,   setRouteDrawn]   = useState(false);
  // Set when Google reports the API key is invalid, unauthorized for the
  // requested API, or billing isn't enabled on the project — Google calls
  // window.gm_authFailure() specifically for this, so we don't have to
  // guess from a generic script-load failure. Falls back to the OSM embed
  // below, same as when no key is configured at all.
  const [authFailed, setAuthFailed] = useState(false);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const dest = { lat: taskCoords.latitude, lng: taskCoords.longitude };

  function initMap() {
    if (!mapRef.current || !window.google) return;
    const g = window.google.maps;
    // Guard against billing-disabled / unauthorized Maps: the script loads
    // partially but g.Map is undefined or throws — fall back to the OSM embed
    // rather than crashing with "undefined is not a constructor".
    if (typeof g?.Map !== "function") {
      setAuthFailed(true);
      return;
    }
    try {
      const map = new g.Map(mapRef.current, {
        center: dest,
        zoom: 15,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      });
      mapObj.current = map;
      routeRender.current = new g.DirectionsRenderer({ map, suppressMarkers: false });

      // Task location pin (home/destination icon)
      new g.Marker({
        position: dest,
        map,
        title: address || "Task location",
        icon: {
          path: g.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#0d9488",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    } catch {
      setAuthFailed(true);
    }
  }

  function drawRoute(userLat: number, userLng: number) {
    if (!window.google || !mapObj.current) return;
    const g = window.google.maps;
    const directionsService = new g.DirectionsService();

    directionsService.route(
      {
        origin:      { lat: userLat, lng: userLng },
        destination: dest,
        travelMode:  g.TravelMode.DRIVING,
      },
      (result: any, status: string) => {
        setRouteLoading(false);
        if (status === "OK") {
          routeRender.current.setDirections(result);
          setRouteDrawn(true);
          setRouteError("");
        } else {
          setRouteError("Couldn't calculate route. Try opening in Google Maps.");
        }
      }
    );
  }

  function handleGetDirections() {
    setRouteLoading(true);
    setRouteError("");
    if (!navigator.geolocation) {
      setRouteLoading(false);
      setRouteError("Location access not available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => drawRoute(pos.coords.latitude, pos.coords.longitude),
      () => {
        setRouteLoading(false);
        setRouteError("Location permission denied. Open in Google Maps instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function openInGoogleMaps() {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`,
      "_blank"
    );
  }

  // If Maps script already loaded, init immediately
  useEffect(() => {
    if (window.google && mapRef.current && !mapObj.current) initMap();
  }, []);

  // Register Google's auth-failure hook before the script loads so we catch
  // billing/key-restriction errors (e.g. BillingNotEnabledMapError) and show
  // a working fallback instead of a blank map + console errors.
  useEffect(() => {
    window.gm_authFailure = () => setAuthFailed(true);
    return () => { delete window.gm_authFailure; };
  }, []);

  if (!mapsKey || authFailed) {
    // Fallback: static OpenStreetMap embed
    return (
      <div className={`rounded-2xl overflow-hidden border border-gray-200 ${className}`}>
        <iframe
          title="Task location"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${dest.lng - 0.01},${dest.lat - 0.01},${dest.lng + 0.01},${dest.lat + 0.01}&layer=mapnik&marker=${dest.lat},${dest.lng}`}
          className="w-full h-56 border-0"
        />
        <div className="p-3 flex items-center justify-between bg-white border-t border-gray-100">
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
            {address}
          </p>
          <button onClick={openInGoogleMaps}
            className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline">
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${mapsKey}&loading=async`}
        strategy="lazyOnload"
        onLoad={() => { window._taskMapReady = true; initMap(); }}
      />

      <div className={`rounded-2xl overflow-hidden border border-gray-200 bg-white ${className}`}>
        {/* Map canvas */}
        <div ref={mapRef} className="w-full h-64" />

        {/* Controls bar */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-gray-700 flex items-center gap-1.5 min-w-0 truncate">
            <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
            <span className="truncate">{address || "Task location"}</span>
          </p>

          <div className="flex items-center gap-2 ml-2 shrink-0">
            {/* Get directions button — shows route on map */}
            {!routeDrawn && (
              <button
                onClick={handleGetDirections}
                disabled={routeLoading}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                {routeLoading ? "Getting route…" : "Get Directions"}
              </button>
            )}

            {/* Open in Google Maps */}
            <button
              onClick={openInGoogleMaps}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Maps
            </button>
          </div>
        </div>

        {routeError && (
          <p className="px-4 pb-3 text-xs text-red-500">{routeError}</p>
        )}

        {routeDrawn && (
          <p className="px-4 pb-3 text-xs text-teal-600 flex items-center gap-1">
            <Navigation className="h-3.5 w-3.5" />
            Route from your location shown on map
          </p>
        )}
      </div>
    </>
  );
}
