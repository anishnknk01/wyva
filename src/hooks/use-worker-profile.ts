"use client";

import { useEffect, useState, useCallback } from "react";

export type WorkerProfileData = {
  profile: any;
  address: any;
  serviceLocation: any;
  workerSkills: any[];
  experience: any;
  availability: any[];
  preferences: any;
  payout: any;
  emergency: any;
  documents: any[];
  identityVerifications: any[];
  completionScore: number;
  email: string;
};

export function useWorkerProfile() {
  const [data, setData] = useState<WorkerProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (!res.ok) { setLoading(false); return; }
    setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, refresh: load };
}
