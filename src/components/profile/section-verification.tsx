"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { SectionCard, VerificationBadge } from "./profile-ui";

type Props = { data: any; onRefresh: () => void };

type KycType = "aadhaar" | "pan";
type KycStep = "idle" | "form" | "otp";

export function SectionVerification({ data, onRefresh }: Props) {
  const { identityVerifications } = data;

  const aadhaarVerif = identityVerifications?.find((v: any) => v.verification_type === "aadhaar");
  const panVerif     = identityVerifications?.find((v: any) => v.verification_type === "pan");

  const [activeType, setActiveType] = useState<KycType | null>(null);
  const [step, setStep] = useState<KycStep>("idle");
  const [submitting, setSubmitting] = useState(false);

  // Aadhaar form state
  const [vid, setVid] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");

  // PAN form state
  const [panNumber, setPanNumber] = useState("");
  const [panName, setPanName]   = useState("");
  const [panDob, setPanDob]     = useState("");

  function startVerification(type: KycType) {
    setActiveType(type);
    setStep("form");
    setVid(""); setOtp(""); setSessionId(""); setPanNumber(""); setPanName(""); setPanDob("");
  }

  async function initiateAadhaar() {
    if (!vid.trim()) { toast.error("Virtual ID (VID) is required"); return; }
    setSubmitting(true);
    const res = await fetch("/api/profile/verify-kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "aadhaar", step: "initiate", vid }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) { toast.error(json.error ?? "Failed"); return; }
    if (json.requiresOtp !== false) {
      setSessionId(json.session_id);
      setStep("otp");
      toast.info("OTP sent to your Aadhaar-linked mobile");
    } else {
      toast.success(json.message ?? "Submitted for review");
      setStep("idle"); setActiveType(null);
      onRefresh();
    }
  }

  async function submitAadhaarOtp() {
    if (!otp.trim()) { toast.error("OTP is required"); return; }
    setSubmitting(true);
    const res = await fetch("/api/profile/verify-kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "aadhaar", step: "submit_otp", session_id: sessionId, otp }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) { toast.error(json.error ?? "Verification failed"); return; }
    toast.success("Aadhaar verified!");
    setStep("idle"); setActiveType(null);
    onRefresh();
  }

  async function verifyPan() {
    if (!panNumber.trim() || !panName.trim()) { toast.error("PAN number and name are required"); return; }
    if (panNumber.length !== 10) { toast.error("PAN must be 10 characters"); return; }
    setSubmitting(true);
    const res = await fetch("/api/profile/verify-kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pan", step: "verify_pan", pan_number: panNumber.toUpperCase(), full_name: panName, dob: panDob }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) { toast.error(json.error ?? "Verification failed"); return; }
    toast.success(json.message ?? "PAN submitted for verification");
    setStep("idle"); setActiveType(null);
    onRefresh();
  }

  return (
    <SectionCard
      title="Identity Verification"
      subtitle="Verify your identity to apply for and accept tasks."
    >
      {/* Notice */}
      <div className="mb-5 flex gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>We use an authorized KYC provider. Your Aadhaar or PAN details are processed securely.
          Only masked identifiers are stored. OTPs are never stored or logged.</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Aadhaar card */}
        <VerifCard
          title="Aadhaar Verification"
          description="Verify using your Aadhaar Virtual ID (VID). Your full Aadhaar number is never stored."
          verification={aadhaarVerif}
          onStart={() => startVerification("aadhaar")}
        />

        {/* PAN card */}
        <VerifCard
          title="PAN Verification"
          description="Verify your PAN card to confirm your identity and tax status."
          verification={panVerif}
          onStart={() => startVerification("pan")}
        />
      </div>

      {/* Aadhaar form */}
      {activeType === "aadhaar" && step === "form" && (
        <div className="mt-5 rounded-lg border border-gray-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Aadhaar Verification</h3>
          <p className="mb-3 text-xs text-gray-500">
            Enter your 16-digit Virtual ID (VID) generated from the UIDAI portal.
            Do not enter your actual Aadhaar number here.
          </p>
          <label className="block text-xs font-medium text-gray-700 mb-1">Virtual ID (VID)</label>
          <input
            type="text" maxLength={16} value={vid} onChange={e => setVid(e.target.value)}
            placeholder="XXXX XXXX XXXX XXXX"
            className="mb-3 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button onClick={initiateAadhaar} disabled={submitting}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
              {submitting ? "Sending OTP…" : "Send OTP"}
            </button>
            <button onClick={() => { setStep("idle"); setActiveType(null); }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Aadhaar OTP */}
      {activeType === "aadhaar" && step === "otp" && (
        <div className="mt-5 rounded-lg border border-gray-200 p-4">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Enter OTP</h3>
          <p className="mb-3 text-xs text-gray-500">
            An OTP was sent to your Aadhaar-linked mobile number.
          </p>
          <input
            type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)}
            placeholder="6-digit OTP"
            className="mb-3 h-10 w-40 rounded-lg border border-gray-200 px-3 text-center text-sm tracking-widest focus:border-teal-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button onClick={submitAadhaarOtp} disabled={submitting}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
              {submitting ? "Verifying…" : "Verify OTP"}
            </button>
            <button onClick={() => setStep("form")}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Back
            </button>
          </div>
        </div>
      )}

      {/* PAN form */}
      {activeType === "pan" && step === "form" && (
        <div className="mt-5 rounded-lg border border-gray-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">PAN Verification</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">PAN Number *</label>
              <input
                type="text" maxLength={10} value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm uppercase tracking-widest focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full name (as on PAN) *</label>
              <input value={panName} onChange={e => setPanName(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date of birth</label>
              <input type="date" value={panDob} onChange={e => setPanDob(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={verifyPan} disabled={submitting}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
              {submitting ? "Verifying…" : "Verify PAN"}
            </button>
            <button onClick={() => { setStep("idle"); setActiveType(null); }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function VerifCard({ title, description, verification, onStart }: {
  title: string; description: string; verification?: any; onStart: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
        <VerificationBadge status={verification?.status ?? "unverified"} />
      </div>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      {verification?.masked_identifier && (
        <p className="text-xs font-mono text-gray-600 mb-2">{verification.masked_identifier}</p>
      )}
      {(!verification || verification.status === "failed") && (
        <button onClick={onStart}
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700">
          {verification?.status === "failed" ? "Retry Verification" : "Start Verification"}
        </button>
      )}
      {verification?.status === "pending" && (
        <p className="text-xs text-yellow-600">Under review — usually within 24 hours.</p>
      )}
    </div>
  );
}
