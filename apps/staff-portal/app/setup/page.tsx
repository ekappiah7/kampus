"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { Button, Field, inputClass } from "@/components/ui";

/**
 * First-run wizard. Creates the school and its head-administrator account, then
 * signs that person straight in — from a blank database to a working portal in
 * one screen, which is exactly what a live walkthrough needs.
 */
export default function SetupPage() {
  const router = useRouter();
  const { adopt } = useSession();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [school, setSchool] = useState({
    name: "",
    shortName: "",
    subdomain: "",
    primaryColor: "#FFC629",
    phone: "",
    email: "",
    whatsappPhone: "",
    address: "",
    officeHours: "Mon–Fri, 7:30am – 4:30pm",
    accreditation: "",
    gesRegNo: "",
  });
  const [admin, setAdmin] = useState({
    name: "",
    email: "",
    title: "Head Teacher & Administrator",
    phone: "",
    password: "",
    confirm: "",
  });

  useEffect(() => {
    api.setup
      .status()
      .then((s) => {
        if (s.initialised) router.replace("/login");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  /** Suggest a URL-safe subdomain from the school name, but let it be overridden. */
  function onNameChange(name: string) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40);
    setSchool((s) => ({ ...s, name, subdomain: s.subdomain || slug }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (admin.password !== admin.confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { confirm: _drop, ...adminPayload } = admin;
      const result = await api.setup.run({ school, admin: adminPayload });
      adopt(result.token, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup could not be completed.");
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-brand-link" />
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-brand text-2xl">🏫</div>
        <h1 className="font-display text-[24px] font-bold">Set up your school</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Step {step} of 2 — {step === 1 ? "school details" : "your administrator account"}
        </p>
      </div>

      <form onSubmit={submit} className="rounded-[18px] bg-white p-7 shadow-card">
        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <Field label="School name">
              <input className={inputClass} required value={school.name} onChange={(e) => onNameChange(e.target.value)} placeholder="e.g. Aspire Royal Academy" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Short name" hint="Shown in the portal sidebar">
                <input className={inputClass} value={school.shortName} onChange={(e) => setSchool({ ...school, shortName: e.target.value })} placeholder="Aspire Royal Staff" />
              </Field>
              <Field label="Web address" hint="Used for your school's site">
                <input className={inputClass} required value={school.subdomain} onChange={(e) => setSchool({ ...school, subdomain: e.target.value.toLowerCase() })} placeholder="aspire-royal" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <input className={inputClass} value={school.phone} onChange={(e) => setSchool({ ...school, phone: e.target.value })} placeholder="+233 24 000 0000" />
              </Field>
              <Field label="WhatsApp number" hint="Powers the website chat button">
                <input className={inputClass} value={school.whatsappPhone} onChange={(e) => setSchool({ ...school, whatsappPhone: e.target.value })} placeholder="233240000000" />
              </Field>
            </div>
            <Field label="Email">
              <input className={inputClass} type="email" value={school.email} onChange={(e) => setSchool({ ...school, email: e.target.value })} placeholder="info@school.edu.gh" />
            </Field>
            <Field label="Address">
              <input className={inputClass} value={school.address} onChange={(e) => setSchool({ ...school, address: e.target.value })} placeholder="12 Ridge Avenue, Kumasi" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="GES registration no." hint="Optional, shown as a trust badge">
                <input className={inputClass} value={school.gesRegNo} onChange={(e) => setSchool({ ...school, gesRegNo: e.target.value })} placeholder="GES/AS/0472" />
              </Field>
              <Field label="Brand colour">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-[46px] w-14 cursor-pointer rounded-[10px] border-[1.5px] border-border-alt"
                    value={school.primaryColor}
                    onChange={(e) => setSchool({ ...school, primaryColor: e.target.value })}
                  />
                  <input className={inputClass} value={school.primaryColor} onChange={(e) => setSchool({ ...school, primaryColor: e.target.value })} />
                </div>
              </Field>
            </div>

            <Button
              type="button"
              className="mt-2 w-full !py-3.5"
              disabled={!school.name || !school.subdomain}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="Your full name">
              <input className={inputClass} required value={admin.name} onChange={(e) => setAdmin({ ...admin, name: e.target.value })} placeholder="e.g. Mr. Collins Amofa Owusu" />
            </Field>
            <Field label="Your role">
              <input className={inputClass} value={admin.title} onChange={(e) => setAdmin({ ...admin, title: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" hint="You'll sign in with this">
                <input className={inputClass} type="email" required value={admin.email} onChange={(e) => setAdmin({ ...admin, email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className={inputClass} value={admin.phone} onChange={(e) => setAdmin({ ...admin, phone: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Password" hint="At least 8 characters">
                <input className={inputClass} type="password" required minLength={8} value={admin.password} onChange={(e) => setAdmin({ ...admin, password: e.target.value })} />
              </Field>
              <Field label="Confirm password">
                <input className={inputClass} type="password" required value={admin.confirm} onChange={(e) => setAdmin({ ...admin, confirm: e.target.value })} />
              </Field>
            </div>

            {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

            <div className="mt-2 flex gap-3">
              <Button type="button" variant="ghost" className="flex-1 !py-3.5" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" className="flex-[2] !py-3.5" disabled={busy}>
                {busy ? "Creating…" : "Create school & sign in"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </main>
  );
}
