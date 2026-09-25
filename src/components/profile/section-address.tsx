"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Navigation } from "lucide-react";
import { SectionCard, EditButton, SaveRow, FormField, FieldRow } from "./profile-ui";
import { getCurrentPosition } from "@/lib/location-utils";

const RADIUS_OPTIONS = [2, 5, 10, 20];

type Props = { data: any; onRefresh: () => void };

export function SectionAddress({ data, onRefresh }: Props) {
  const { address, serviceLocation } = data;
  const [editAddr, setEditAddr] = useState(false);
  const [editSvc,  setEditSvc]  = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [savingSvc,  setSavingSvc]  = useState(false);
  const [locating, setLocating] = useState(false);

  const [addr, setAddr] = useState({
    flat_house: address?.flat_house ?? "",
    street_area: address?.street_area ?? "",
    landmark: address?.landmark ?? "",
    city: address?.city ?? "",
    district: address?.district ?? "",
    state: address?.state ?? "Karnataka",
    country: address?.country ?? "India",
    pin_code: address?.pin_code ?? "",
  });

  const [svc, setSvc] = useState({
    area: serviceLocation?.area ?? "",
    city: serviceLocation?.city ?? "",
    pin_code: serviceLocation?.pin_code ?? "",
    service_radius: serviceLocation?.service_radius ?? 5,
    latitude: serviceLocation?.latitude ?? null as number | null,
    longitude: serviceLocation?.longitude ?? null as number | null,
  });

  function addrField(k: keyof typeof addr) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setAddr(a => ({ ...a, [k]: e.target.value }));
  }

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      // Reverse geocode with free Nominatim API
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const geo = await res.json();
      const a = geo.address ?? {};
      setAddr(prev => ({
        ...prev,
        street_area: a.road ?? a.suburb ?? prev.street_area,
        city: a.city ?? a.town ?? a.village ?? prev.city,
        district: a.county ?? prev.district,
        state: a.state ?? prev.state,
        pin_code: a.postcode ?? prev.pin_code,
      }));
      setSvc(prev => ({ ...prev, latitude: lat, longitude: lng, city: a.city ?? a.town ?? prev.city }));
      toast.success("Location detected — please confirm the details");
    } catch {
      toast.error("Couldn't get location. Please allow access and try again.");
    }
    setLocating(false);
  }

  async function saveAddr() {
    setSavingAddr(true);
    const res = await fetch("/api/profile/address", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addr),
    });
    setSavingAddr(false);
    if (!res.ok) { toast.error("Save failed"); return; }
    toast.success("Address saved");
    setEditAddr(false);
    onRefresh();
  }

  async function saveSvc() {
    setSavingSvc(true);
    const res = await fetch("/api/profile/service-location", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(svc),
    });
    setSavingSvc(false);
    if (!res.ok) { toast.error("Save failed"); return; }
    toast.success("Service location saved");
    setEditSvc(false);
    onRefresh();
  }

  return (
    <div className="space-y-4">
      {/* Home address */}
      <SectionCard
        title="Address"
        subtitle="Your home address — never shown publicly."
        action={!editAddr ? <EditButton onClick={() => setEditAddr(true)} /> : undefined}
      >
        {editAddr ? (
          <div className="space-y-4">
            <button
              onClick={useCurrentLocation}
              disabled={locating}
              className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50"
            >
              <Navigation className="h-4 w-4" />
              {locating ? "Detecting…" : "Use Current Location"}
            </button>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ["flat_house", "Flat / House No."], ["street_area", "Street / Area"],
                ["landmark", "Landmark"], ["city", "City *"],
                ["district", "District"], ["state", "State"],
                ["country", "Country"], ["pin_code", "PIN Code *"],
              ] as [keyof typeof addr, string][]).map(([key, label]) => (
                <FormField key={key} label={label}>
                  <input value={addr[key]} onChange={addrField(key)}
                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
                </FormField>
              ))}
            </div>
            <SaveRow saving={savingAddr} onSave={saveAddr} onCancel={() => setEditAddr(false)} />
          </div>
        ) : address ? (
          <div className="divide-y divide-gray-50">
            <FieldRow label="Flat / House" value={address.flat_house} />
            <FieldRow label="Street / Area" value={address.street_area} />
            <FieldRow label="Landmark"     value={address.landmark} />
            <FieldRow label="City"         value={address.city} />
            <FieldRow label="District"     value={address.district} />
            <FieldRow label="State"        value={address.state} />
            <FieldRow label="PIN Code"     value={address.pin_code} />
          </div>
        ) : (
          <p className="text-sm text-gray-500">No address added yet.</p>
        )}
      </SectionCard>

      {/* Service location */}
      <SectionCard
        title="Service Location"
        subtitle="Where you're available to take tasks. Customers see an approximate area only."
        action={!editSvc ? <EditButton onClick={() => setEditSvc(true)} /> : undefined}
      >
        {editSvc ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Area / Locality">
                <input value={svc.area} onChange={e => setSvc(s => ({ ...s, area: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
              </FormField>
              <FormField label="City">
                <input value={svc.city} onChange={e => setSvc(s => ({ ...s, city: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
              </FormField>
              <FormField label="PIN Code">
                <input value={svc.pin_code} onChange={e => setSvc(s => ({ ...s, pin_code: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
              </FormField>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Service radius</label>
              <div className="flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map(r => (
                  <button key={r} onClick={() => setSvc(s => ({ ...s, service_radius: r }))}
                    className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                      svc.service_radius === r
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>
                    {r} km
                  </button>
                ))}
              </div>
            </div>
            <SaveRow saving={savingSvc} onSave={saveSvc} onCancel={() => setEditSvc(false)} />
          </div>
        ) : serviceLocation ? (
          <div className="divide-y divide-gray-50">
            <FieldRow label="Area"    value={serviceLocation.area} />
            <FieldRow label="City"    value={serviceLocation.city} />
            <FieldRow label="PIN"     value={serviceLocation.pin_code} />
            <FieldRow label="Radius"  value={`${serviceLocation.service_radius} km`} />
          </div>
        ) : (
          <p className="text-sm text-gray-500">No service location set yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
