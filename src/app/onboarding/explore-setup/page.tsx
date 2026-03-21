"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, AtSign, Globe2, LockKeyhole, UserRound, Check } from "lucide-react";

import { getMe } from "@/lib/auth";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { clearOnboardingState } from "@/lib/onboarding-flow";
import {
  completeExploreSkuully,
  saveExploreIdentity,
  saveExploreProfile,
  sendPhoneCode,
  skipPhoneStep,
  verifyPhoneCode,
} from "@/lib/onboarding";
import { getPhoneCountries } from "@/lib/geo";

type SetupStep = "skuully_id" | "profile" | "security";

type MeResponse = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  skuullyId?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  context?: {
    schoolId?: string | null;
    programId?: string | null;
    role?: string | null;
    membershipId?: string | null;
  };
};

type PhoneCountry = {
  code: string;
  name: string;
  flagEmoji?: string | null;
  phoneCode?: string | null;
  phoneMinLength?: number | null;
  phoneMaxLength?: number | null;
};

function normalizeSkuullyId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.\.+/g, ".")
    .replace(/__+/g, "_")
    .slice(0, 24);
}

function makeSuggestedSkuullyId(fullName?: string, email?: string) {
  const baseFromName = (fullName ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s._]/g, "")
    .replace(/\s+/g, ".")
    .replace(/\.\.+/g, ".")
    .replace(/^\.|\.$/g, "");

  const baseFromEmail = (email ?? "")
    .split("@")[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9._]/g, "");

  return normalizeSkuullyId(baseFromName || baseFromEmail || "skuullyuser");
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeNationalPhone(country: PhoneCountry | null, value: string) {
  let digits = normalizeDigits(value);

  if (!digits || !country?.phoneCode) return digits;

  const dialDigits = country.phoneCode.replace("+", "");

  if (digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits;
}

function validatePhone(country: PhoneCountry | null, value: string) {
  if (!country?.phoneCode) return "Select a phone country first.";

  const cleaned = normalizeNationalPhone(country, value);
  const min = country.phoneMinLength ?? 6;
  const max = country.phoneMaxLength ?? 15;

  if (!cleaned.length) return "Enter your phone number.";
  if (cleaned.length < min) return "Phone number is too short for this country.";
  if (cleaned.length > max) return "Phone number is too long for this country.";

  return null;
}

export default function ExploreSetupPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<SetupStep>("skuully_id");
  const [me, setMe] = useState<MeResponse | null>(null);

  const [skuullyId, setSkuullyId] = useState("");
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [phoneCountries, setPhoneCountries] = useState<PhoneCountry[]>([]);
  const [phoneCountryCode, setPhoneCountryCode] = useState("KE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [addPhoneLater, setAddPhoneLater] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [meResponse, phoneCountriesResponse] = await Promise.all([
          getMe(),
          getPhoneCountries(),
        ]);

        if (!meResponse) {
          router.replace("/login");
          return;
        }

        if (!meResponse.emailVerified) {
          router.replace("/verify-email");
          return;
        }

        if (meResponse.context?.schoolId) {
          router.replace("/dashboard/control-center");
          return;
        }

        setMe(meResponse);
        setFullName(meResponse.fullName ?? "");
        setSkuullyId(
          normalizeSkuullyId(
            meResponse.skuullyId ||
              makeSuggestedSkuullyId(meResponse.fullName, meResponse.email)
          )
        );

        const mappedPhoneCountries = phoneCountriesResponse.items.map((item) => ({
          code: item.code,
          name: item.name,
          flagEmoji: item.flagEmoji,
          phoneCode: item.phoneCode,
          phoneMinLength: item.phoneMinLength,
          phoneMaxLength: item.phoneMaxLength,
        }));

        setPhoneCountries(mappedPhoneCountries);

        const kenya =
          mappedPhoneCountries.find((item) => item.code === "KE") ??
          mappedPhoneCountries[0] ??
          null;

        if (kenya) {
          setPhoneCountryCode(kenya.code);
        }

        if (meResponse.phoneVerified) {
          setPhoneVerified(true);
          setAddPhoneLater(false);
        }

        setIsLoading(false);
      } catch {
        router.replace("/login");
      }
    }

    void load();
  }, [router]);

  const normalizedId = useMemo(() => normalizeSkuullyId(skuullyId), [skuullyId]);

  const currentPhoneCountry =
    phoneCountries.find((item) => item.code === phoneCountryCode) ?? null;

  const normalizedNationalPhone = normalizeNationalPhone(
    currentPhoneCountry,
    phoneNumber
  );

  const normalizedPhone =
    currentPhoneCountry?.phoneCode && normalizedNationalPhone
      ? `${currentPhoneCountry.phoneCode}${normalizedNationalPhone}`
      : "";

  const canContinueId = normalizedId.length >= 3;
  const canContinueProfile = fullName.trim().length >= 2;
  const canFinishSecurity =
    addPhoneLater || (phoneVerified && !validatePhone(currentPhoneCountry, phoneNumber));

  async function handleContinueFromId(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      if (!canContinueId) {
        setError("Choose a Skuully ID with at least 3 characters.");
        return;
      }

      await saveExploreIdentity({
        skuullyId: normalizedId,
      });

      setStep("profile");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn’t save your Skuully ID."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleContinueFromProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      if (!canContinueProfile) {
        setError("Enter your full name.");
        return;
      }

      await saveExploreProfile({
        fullName: fullName.trim(),
        headline: headline.trim() || undefined,
      });

      setStep("security");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn’t save your profile."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handlePhoneChange(value: string) {
    const cleaned = normalizeNationalPhone(currentPhoneCountry, value);
    setPhoneNumber(cleaned);
    setPhoneError(validatePhone(currentPhoneCountry, cleaned));
    setPhoneVerified(false);
  }

  async function handleSendPhoneCode() {
    const validationError = validatePhone(currentPhoneCountry, phoneNumber);
    setPhoneError(validationError);

    if (validationError || !currentPhoneCountry?.phoneCode) return;

    setPhoneBusy(true);
    setError(null);

    try {
      await sendPhoneCode({
        countryCode: currentPhoneCountry.code,
        dialCode: currentPhoneCountry.phoneCode,
        nationalNumber: normalizedNationalPhone,
        e164: normalizedPhone,
      });

      setPhoneCodeSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send verification code."
      );
    } finally {
      setPhoneBusy(false);
    }
  }

  async function handleVerifyPhoneCode() {
    if (!phoneCode.trim()) {
      setError("Enter the verification code sent to your phone.");
      return;
    }

    setPhoneBusy(true);
    setError(null);

    try {
      const result = await verifyPhoneCode({
        e164: normalizedPhone,
        code: phoneCode.trim(),
      });

      if (result.verified || result.phoneVerified) {
        setPhoneVerified(true);
        setPhoneError(null);
      } else {
        setPhoneVerified(false);
        setError("Invalid verification code.");
      }
    } catch (err) {
      setPhoneVerified(false);
      setError(
        err instanceof Error ? err.message : "Failed to verify phone code."
      );
    } finally {
      setPhoneBusy(false);
    }
  }

  async function handleFinish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      if (!addPhoneLater) {
        const validationError = validatePhone(currentPhoneCountry, phoneNumber);
        setPhoneError(validationError);

        if (validationError) {
          setError(validationError);
          return;
        }

        if (!phoneVerified) {
          setError("Verify your phone number before continuing.");
          return;
        }
      } else {
        await skipPhoneStep();
      }

      await completeExploreSkuully();
      clearOnboardingState();
      router.push("/explore");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn’t finish your setup."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleBack() {
    setError(null);

    if (step === "security") {
      setStep("profile");
      return;
    }

    if (step === "profile") {
      setStep("skuully_id");
      return;
    }

    router.push("/onboarding");
  }

  function handleSkip() {
    clearOnboardingState();
    router.push("/explore");
  }

  if (isLoading) {
    return (
      <div className="skuully-cinematic-bg flex min-h-screen items-center justify-center text-white">
        <div className="skuully-glass-card rounded-[28px] px-6 py-5 text-sm text-white/65">
          Preparing your explore setup...
        </div>
      </div>
    );
  }

  if (step === "skuully_id") {
    return (
      <OnboardingShell
        step={1}
        totalSteps={3}
        title="Choose your Skuully ID"
        subtitle="This is how people, schools, and communities find you on Skuully."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-white/55 transition hover:text-white"
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-white/45 transition hover:text-white/70"
              >
                Skip for now
              </button>

              <button
                type="submit"
                form="skuully-id-form"
                disabled={!canContinueId || isSaving}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      >
        <form id="skuully-id-form" onSubmit={handleContinueFromId} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="skuully-glass-card rounded-[24px] p-5">
              <label className="mb-3 block text-sm text-white/70">Skuully ID</label>

              <div className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <AtSign className="h-5 w-5 text-white/45" />
                <input
                  value={skuullyId}
                  onChange={(event) => setSkuullyId(event.target.value)}
                  placeholder="brandonboi"
                  className="skuully-focus-ring w-full border-0 bg-transparent text-base text-white outline-none placeholder:text-white/25"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <p className="mt-3 text-sm text-white/50">
                Your public Skuully identity will look like{" "}
                <span className="text-white">@{normalizedId || "yourname"}</span>
              </p>
            </div>

            <div className="skuully-glass-card rounded-[24px] p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Globe2 className="h-4 w-4 text-white/72" />
              </div>

              <h3 className="mt-4 text-lg font-medium text-white">Your identity starts here</h3>

              <p className="mt-2 text-sm leading-7 text-white/52">
                Keep it simple, memorable, and easy to find.
              </p>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </form>
      </OnboardingShell>
    );
  }

  if (step === "profile") {
    return (
      <OnboardingShell
        step={2}
        totalSteps={3}
        title="Complete your profile"
        subtitle="Add the basics so your Skuully presence feels real from day one."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-white/55 transition hover:text-white"
            >
              Back
            </button>

            <button
              type="submit"
              form="profile-form"
              disabled={!canContinueProfile || isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <form id="profile-form" onSubmit={handleContinueFromProfile} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <div className="skuully-glass-card rounded-[24px] p-5">
                <label className="mb-3 block text-sm text-white/70">Full name</label>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Brandon Boi"
                  className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-base text-white outline-none placeholder:text-white/25"
                  autoComplete="name"
                />
              </div>

              <div className="skuully-glass-card rounded-[24px] p-5">
                <label className="mb-3 block text-sm text-white/70">Headline</label>
                <input
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  placeholder="Learner, educator, builder, or explorer"
                  className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-base text-white outline-none placeholder:text-white/25"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="skuully-glass-card rounded-[24px] p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <UserRound className="h-4 w-4 text-white/72" />
              </div>

              <h3 className="mt-4 text-lg font-medium text-white">Your profile preview</h3>

              <div className="mt-4 space-y-3 text-sm text-white/55">
                <p>
                  <span className="text-white">Name:</span>{" "}
                  {fullName.trim() || me?.fullName || "Not set"}
                </p>
                <p>
                  <span className="text-white">Skuully ID:</span> @{normalizedId}
                </p>
                <p>
                  <span className="text-white">Headline:</span>{" "}
                  {headline.trim() || "Not set yet"}
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </form>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={3}
      totalSteps={3}
      title="Add a verification number"
      subtitle="Before entering Skuully, protect your account with a phone number for recovery and future verification."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-white/55 transition hover:text-white"
          >
            Back
          </button>

          <button
            type="submit"
            form="security-form"
            disabled={!canFinishSecurity || isSaving}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Finishing..." : "Enter Skuully"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <form id="security-form" onSubmit={handleFinish} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="skuully-glass-card rounded-[24px] p-5">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <LockKeyhole className="h-4 w-4 text-[#b7c8ff]" />
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-medium text-white">Phone verification</h3>
                <p className="mt-1 text-sm leading-7 text-white/55">
                  This helps with recovery, login security, and future 2FA.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setAddPhoneLater(true);
                  setPhoneError(null);
                }}
                className={`rounded-[20px] border px-4 py-4 text-left transition ${
                  addPhoneLater
                    ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">Add later</div>
                    <div className="mt-1 text-sm text-white/52">
                      Skip phone verification for now
                    </div>
                  </div>

                  {addPhoneLater ? <Check className="h-4 w-4 text-[#9bb4ff]" /> : null}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAddPhoneLater(false)}
                className={`rounded-[20px] border px-4 py-4 text-left transition ${
                  !addPhoneLater
                    ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">Add phone now</div>
                    <div className="mt-1 text-sm text-white/52">
                      Verify before continuing
                    </div>
                  </div>

                  {!addPhoneLater ? <Check className="h-4 w-4 text-[#9bb4ff]" /> : null}
                </div>
              </button>

              {!addPhoneLater ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[190px_1fr]">
                    <div>
                      <label className="mb-2 block text-sm text-white/70">Country</label>
                      <select
                        value={phoneCountryCode}
                        onChange={(event) => {
                          setPhoneCountryCode(event.target.value);
                          setPhoneError(null);
                          setPhoneNumber("");
                          setPhoneCode("");
                          setPhoneCodeSent(false);
                          setPhoneVerified(false);
                        }}
                        className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-[#0b1022] px-4 py-4 text-white outline-none"
                      >
                        {phoneCountries.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.flagEmoji ?? "🌍"} {item.name} ({item.phoneCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-white/70">Phone number</label>
                      <div className="flex overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03]">
                        <div className="flex items-center gap-2 border-r border-white/10 px-4 text-sm text-white/70">
                          <span>{currentPhoneCountry?.flagEmoji ?? "🌍"}</span>
                          <span>{currentPhoneCountry?.phoneCode ?? ""}</span>
                        </div>

                        <input
                          className="skuully-focus-ring w-full bg-transparent px-4 py-4 text-white outline-none placeholder:text-white/25"
                          value={phoneNumber}
                          onChange={(event) => handlePhoneChange(event.target.value)}
                          placeholder="Enter phone number"
                          inputMode="numeric"
                          type="tel"
                        />
                      </div>
                    </div>
                  </div>

                  {phoneError ? (
                    <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                      {phoneError}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                      Final number: {normalizedPhone || "—"}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSendPhoneCode}
                      disabled={phoneBusy}
                      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                    >
                      {phoneBusy ? "Sending..." : "Send code"}
                    </button>

                    {phoneVerified ? (
                      <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                        Phone verified
                      </div>
                    ) : null}
                  </div>

                  {phoneCodeSent ? (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-2 block text-sm text-white/70">
                          Verification code
                        </label>
                        <input
                          className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-white outline-none placeholder:text-white/25"
                          value={phoneCode}
                          onChange={(event) => setPhoneCode(event.target.value)}
                          placeholder="Enter SMS code"
                          inputMode="numeric"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyPhoneCode}
                        disabled={phoneBusy}
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                      >
                        {phoneBusy ? "Verifying..." : "Verify code"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="skuully-glass-card rounded-[24px] p-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <UserRound className="h-4 w-4 text-white/72" />
            </div>

            <h3 className="mt-4 text-lg font-medium text-white">Profile summary</h3>

            <div className="mt-4 space-y-3 text-sm text-white/55">
              <p>
                <span className="text-white">Name:</span> {fullName.trim() || "Not set"}
              </p>
              <p>
                <span className="text-white">Skuully ID:</span> @{normalizedId}
              </p>
              <p>
                <span className="text-white">Headline:</span>{" "}
                {headline.trim() || "Not set yet"}
              </p>
              <p>
                <span className="text-white">Phone:</span>{" "}
                {addPhoneLater ? "Will add later" : normalizedPhone || "Pending"}
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </form>
    </OnboardingShell>
  );
}