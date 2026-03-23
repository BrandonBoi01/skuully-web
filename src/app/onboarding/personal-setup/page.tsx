"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";

import { getMe } from "@/lib/auth";
import {
  completePersonalAccount,
  savePersonalIdentity,
  sendPhoneCode,
  skipPhoneStep,
  verifyPhoneCode,
} from "@/lib/onboarding";
import {
  readOnboardingState,
  type AccountIntent,
} from "@/lib/onboarding-flow";
import { getPhoneCountries } from "@/lib/geo";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

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

type PersonalStep = "identity" | "security" | "review";

type PhoneCountry = {
  code: string;
  name: string;
  flagEmoji?: string | null;
  phoneCode?: string | null;
  phoneMinLength?: number | null;
  phoneMaxLength?: number | null;
};

function formatIntentLabel(intent: AccountIntent | null) {
  if (!intent) return "Personal account";

  const labels: Record<AccountIntent, string> = {
    founder: "Founder / Builder",
    staff: "Staff / Educator",
    parent: "Parent / Guardian",
    student: "Student",
    professional: "Professional",
    explorer: "Explorer",
    unsure: "Not sure yet",
  };

  return labels[intent];
}

function suggestedHeadline(intent: AccountIntent | null) {
  const suggestions: Record<AccountIntent, string> = {
    founder: "Building the future of learning",
    staff: "Supporting learning and school operations",
    parent: "Following academic progress with clarity",
    student: "Learning, growing, and staying organized",
    professional: "Building skills and professional growth",
    explorer: "Exploring what Skuully can do",
    unsure: "Starting simple and figuring things out",
  };

  return intent ? suggestions[intent] : "Tell people a little about your journey";
}

function suggestedSkuullyId(fullName?: string | null) {
  if (!fullName) return "";
  const base = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .join("");

  return base.slice(0, 20);
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

function isValidSkuullyId(value: string) {
  return /^[a-z0-9._-]{3,24}$/.test(value);
}

function StepCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-strong spotlight-card rounded-[28px] border border-[var(--border)] p-5 sm:p-6">
      <div className="choice-card-glow" />

      <div className="relative flex items-start gap-4">
        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-[rgb(var(--skuully-cyan))] shadow-[var(--elev-shadow-xs)]">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-sm leading-7 text-[var(--text-soft)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="relative mt-6">{children}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-[var(--text-soft)]">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-medium text-[var(--text-strong)]">
        {value}
      </span>
    </div>
  );
}

function SelectableCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-[22px] border p-4 text-left transition",
        selected
          ? "border-[rgba(var(--skuully-cyan),0.34)] bg-[rgba(var(--skuully-cyan),0.10)] shadow-[0_0_0_1px_rgba(59,180,229,0.10)]"
          : "border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--text-strong)]">
            {title}
          </div>
          <div className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
            {description}
          </div>
        </div>

        {selected ? (
          <div className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--skuully-cyan),0.18)] text-[rgb(var(--skuully-cyan))]">
            <Check className="h-3.5 w-3.5" />
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default function PersonalSetupPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [accountIntent, setAccountIntent] = useState<AccountIntent | null>(null);
  const [step, setStep] = useState<PersonalStep>("identity");

  const [fullName, setFullName] = useState("");
  const [skuullyId, setSkuullyId] = useState("");
  const [headline, setHeadline] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [addPhoneLater, setAddPhoneLater] = useState(true);
  const [phoneCountries, setPhoneCountries] = useState<PhoneCountry[]>([]);
  const [phoneCountryCode, setPhoneCountryCode] = useState("KE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const currentPhoneCountry =
    phoneCountries.find((item) => item.code === phoneCountryCode) ?? null;

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

        const saved = readOnboardingState();
        const intent = saved.accountIntent ?? null;

        if (!saved.route || saved.route !== "personal_account" || !intent) {
          router.replace("/onboarding");
          return;
        }

        const mappedPhoneCountries = (phoneCountriesResponse.items ?? []).map((item) => ({
          code: item.code,
          name: item.name,
          flagEmoji: item.flagEmoji,
          phoneCode: item.phoneCode,
          phoneMinLength: item.phoneMinLength,
          phoneMaxLength: item.phoneMaxLength,
        }));

        setMe(meResponse);
        setAccountIntent(intent);
        setFullName(meResponse.fullName ?? "");
        setSkuullyId(meResponse.skuullyId ?? suggestedSkuullyId(meResponse.fullName));
        setHeadline(suggestedHeadline(intent));
        setPhoneCountries(mappedPhoneCountries);

        const defaultPhoneCountry =
          mappedPhoneCountries.find((item) => item.code === "KE") ??
          mappedPhoneCountries[0] ??
          null;

        if (defaultPhoneCountry) {
          setPhoneCountryCode(defaultPhoneCountry.code);
        }

        if (meResponse.phoneVerified) {
          setPhoneVerified(true);
        }

        setIsLoading(false);
      } catch {
        router.replace("/login");
      }
    }

    void load();
  }, [router]);

  const totalSteps = 3;
  const currentStep =
    step === "identity" ? 1 : step === "security" ? 2 : 3;

  const identityReady =
    fullName.trim().length >= 2 &&
    skuullyId.trim().length >= 3 &&
    isValidSkuullyId(skuullyId.trim());

  const normalizedNationalPhone = normalizeNationalPhone(
    currentPhoneCountry,
    phoneNumber
  );

  const normalizedPhone =
    currentPhoneCountry?.phoneCode && normalizedNationalPhone
      ? `${currentPhoneCountry.phoneCode}${normalizedNationalPhone}`
      : "";

  const securityReady =
    addPhoneLater ||
    (phoneVerified && !validatePhone(currentPhoneCountry, phoneNumber));

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

  async function goNext() {
    setError(null);

    try {
      if (step === "identity" && identityReady && accountIntent) {
        await savePersonalIdentity({
          skuullyId: skuullyId.trim().toLowerCase(),
          fullName: fullName.trim(),
          accountIntent,
          headline: headline.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
        });

        setStep("security");
        return;
      }

      if (step === "security") {
        if (addPhoneLater) {
          await skipPhoneStep();
          setStep("review");
          return;
        }

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

        setStep("review");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this step.");
    }
  }

  function goBack() {
    setError(null);

    if (step === "identity") {
      router.push("/onboarding");
      return;
    }

    if (step === "security") {
      setStep("identity");
      return;
    }

    setStep("security");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsBusy(true);

    try {
      await completePersonalAccount();
      router.push("/dashboard/control-center");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn’t finish your personal setup yet."
      );
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)] px-4 text-[var(--text-main)]">
        <div className="glass rounded-[28px] border border-[var(--border)] px-6 py-5 text-sm text-[var(--text-soft)]">
          Preparing your personal setup...
        </div>
      </div>
    );
  }

  return (
    <OnboardingShell
      step={currentStep}
      totalSteps={totalSteps}
      title="Set up your personal identity"
      subtitle="A clean personal profile helps Skuully shape the right experience around you."
      backHref="/onboarding"
      align="top"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-[var(--text-soft)] transition hover:text-[var(--text-main)]"
          >
            Back
          </button>

          {step !== "review" ? (
            <button
              type="button"
              onClick={goNext}
              disabled={
                (step === "identity" && !identityReady) ||
                (step === "security" && !securityReady)
              }
              className="skuully-cta inline-flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-semibold tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              form="personal-setup-form"
              disabled={isBusy}
              className="skuully-cta inline-flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-semibold tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{isBusy ? "Finishing setup..." : "Complete setup"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      }
    >
      <form
        id="personal-setup-form"
        className="space-y-6"
        onSubmit={handleCreate}
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {step === "identity" ? (
            <StepCard
              icon={<UserCircle2 className="h-5 w-5" />}
              title="Create your personal identity"
              description="Start with your name, your Skuully ID, and a few details that help shape your experience."
            >
              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Full name
                  </label>
                  <input
                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[rgba(59,180,229,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Skuully ID
                  </label>
                  <input
                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[rgba(59,180,229,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
                    value={skuullyId}
                    onChange={(event) =>
                      setSkuullyId(event.target.value.toLowerCase())
                    }
                    placeholder="brandonboi"
                    required
                  />
                  <p className="mt-2 text-xs text-[var(--text-soft)]">
                    Use 3–24 lowercase letters, numbers, dots, underscores, or hyphens.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Headline
                  </label>
                  <input
                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[rgba(59,180,229,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    placeholder="Tell people a little about your journey"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Date of birth
                  </label>
                  <input
                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(59,180,229,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
                    type="date"
                    value={dateOfBirth}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                  />
                </div>
              </div>
            </StepCard>
          ) : null}

          {step === "security" ? (
            <StepCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Add a verification number"
              description="Protect your account with a phone number for future verification and stronger account security."
            >
              <div className="space-y-4">
                <SelectableCard
                  title="Add later"
                  description="Skip phone verification for now and continue setup."
                  selected={addPhoneLater}
                  onClick={() => {
                    setAddPhoneLater(true);
                    setPhoneError(null);
                  }}
                />

                <SelectableCard
                  title="Add phone now"
                  description="Verify your phone number before continuing."
                  selected={!addPhoneLater}
                  onClick={() => setAddPhoneLater(false)}
                />

                {!addPhoneLater ? (
                  <div className="space-y-4 rounded-[22px] border border-[var(--border)] bg-[var(--surface-1)] p-4">
                    <div className="grid gap-4 sm:grid-cols-[190px_1fr]">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                          Country
                        </label>
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
                          className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(59,180,229,0.36)] focus:ring-4 focus:ring-[var(--ring)]"
                        >
                          {phoneCountries.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.flagEmoji ?? "🌍"} {item.name} ({item.phoneCode})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                          Phone number
                        </label>
                        <div className="flex overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]">
                          <div className="flex items-center gap-2 border-r border-[var(--border)] px-4 text-sm text-[var(--text-soft)]">
                            <span>{currentPhoneCountry?.flagEmoji ?? "🌍"}</span>
                            <span>{currentPhoneCountry?.phoneCode ?? ""}</span>
                          </div>

                          <input
                            className="h-12 w-full bg-transparent px-4 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-faint)]"
                            value={phoneNumber}
                            onChange={(event) =>
                              handlePhoneChange(event.target.value)
                            }
                            placeholder="Enter phone number"
                            inputMode="numeric"
                            type="tel"
                          />
                        </div>
                      </div>
                    </div>

                    {phoneError ? (
                      <div className="rounded-2xl border border-[rgba(198,38,74,0.24)] bg-[rgba(198,38,74,0.10)] px-4 py-3 text-sm text-[var(--text-main)] dark:text-rose-100">
                        {phoneError}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-soft)]">
                        Final number: {normalizedPhone || "—"}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSendPhoneCode}
                        disabled={phoneBusy}
                        className="rounded-2xl border border-[rgba(var(--skuully-cyan),0.28)] bg-[rgba(var(--skuully-cyan),0.10)] px-4 py-2.5 text-sm font-medium text-[var(--text-strong)] transition hover:bg-[rgba(var(--skuully-cyan),0.14)] disabled:opacity-50"
                      >
                        {phoneBusy ? "Sending..." : "Send code"}
                      </button>

                      {phoneVerified ? (
                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-100">
                          Phone verified
                        </div>
                      ) : null}
                    </div>

                    {phoneCodeSent ? (
                      <div className="space-y-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                            Verification code
                          </label>
                          <input
                            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[rgba(59,180,229,0.36)] focus:ring-4 focus:ring-[var(--ring)]"
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
                          className="rounded-2xl border border-[rgba(var(--skuully-cyan),0.28)] bg-[rgba(var(--skuully-cyan),0.10)] px-4 py-2.5 text-sm font-medium text-[var(--text-strong)] transition hover:bg-[rgba(var(--skuully-cyan),0.14)] disabled:opacity-50"
                        >
                          {phoneBusy ? "Verifying..." : "Verify code"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </StepCard>
          ) : null}

          {step === "review" ? (
            <StepCard
              icon={<Check className="h-5 w-5" />}
              title="Review your profile"
              description="Confirm your setup before Skuully completes your personal account."
            >
              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-1)] p-4">
                <SummaryRow label="Full name" value={fullName.trim() || "—"} />
                <SummaryRow
                  label="Skuully ID"
                  value={skuullyId.trim().toLowerCase() || "—"}
                />
                <SummaryRow
                  label="Intent"
                  value={formatIntentLabel(accountIntent)}
                />
                <SummaryRow
                  label="Headline"
                  value={headline.trim() || "Not set"}
                />
                <SummaryRow
                  label="Date of birth"
                  value={dateOfBirth || "Not set"}
                />
                <SummaryRow
                  label="Verification phone"
                  value={
                    addPhoneLater ? "Will add later" : normalizedPhone || "—"
                  }
                />
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-7 text-[var(--text-soft)]">
                Skuully will create your personal identity and prepare a starting experience around your role and goals.
              </div>
            </StepCard>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-[rgba(198,38,74,0.24)] bg-[rgba(198,38,74,0.10)] px-4 py-3 text-sm text-[var(--text-main)] dark:text-rose-100">
              {error}
            </div>
          ) : null}
        </div>
      </form>
    </OnboardingShell>
  );
}