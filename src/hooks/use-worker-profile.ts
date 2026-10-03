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
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          if (active) setLoading(false);
          return;
        }
        const json = await res.json();
        if (active) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, refresh: load };
}
