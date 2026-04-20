import { API_URL, apiFetch } from "@/lib/api";

export type AuthProvider = "EMAIL" | "GOOGLE" | "APPLE";

export type LoginResponse = {
  requiresEmailVerification?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  user: {
    id: string;
    fullName: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
    skuullyId?: string | null;
  };
};

export type RegisterResponse = {
  message: string;
  requiresEmailVerification?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  user: {
    id: string;
    fullName: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    skuullyId?: string | null;
    phone?: string | null;
  };
};

export type MeResponse = {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  skuullyId: string;

  emailVerified: boolean;
  phoneVerified: boolean;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;

  preferredLoginMethod: string | null;
  providers: ("GOOGLE" | "APPLE")[];

  memberships: Array<{
    id: string;
    membershipType: string;
    status: string;
    isPrimary: boolean;
    createdAt: string;

    institution: {
      id: string;
      name: string;
      institutionType: string;
      institutionCategory: string | null;
      countryCode: string | null;
    };

    roles: Array<{
      id: string;
      key: string;
      name: string;
      scope: string;
    }>;
  }>;

  context: {
    institutionId: string | null;
    membershipId: string | null;
    membershipType: string | null;
  };
};

export type VerifyEmailResponse = {
  message: string;
  emailVerified?: boolean;
};

export type ResendVerificationResponse = {
  message: string;
  emailVerified?: boolean;
};

export type ForgotPasswordResponse = {
  message: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export type LogoutResponse = {
  message: string;
};

const VERIFICATION_TTL_MS = 10 * 60 * 1000;

const STORAGE_KEYS = {
  lastLoginMethod: "skuullyLastLoginMethod",
  lastLoginEmail: "skuullyLastLoginEmail",
  pendingVerificationEmail: "pendingVerificationEmail",
  verificationCodeSentAt: "verificationCodeSentAt",
  pendingResetEmail: "pendingResetEmail",
} as const;

function isBrowser() {
  return typeof window !== "undefined";
}

function safeGet(key: string) {
  if (!isBrowser()) return null;

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function safeRemove(key: string) {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "";
}

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function normalizeProvider(
  value?: string | null
): AuthProvider | null {
  if (value === "EMAIL" || value === "GOOGLE" || value === "APPLE") {
    return value;
  }

  return null;
}

export function getPendingVerificationEmail() {
  return safeGet(STORAGE_KEYS.pendingVerificationEmail);
}

export function setPendingVerificationEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  safeSet(STORAGE_KEYS.pendingVerificationEmail, normalized);
}

export function clearPendingVerificationEmail() {
  safeRemove(STORAGE_KEYS.pendingVerificationEmail);
}

export function markVerificationCodeSent() {
  safeSet(STORAGE_KEYS.verificationCodeSentAt, String(Date.now()));
}

export function getVerificationCodeSentAt() {
  const raw = safeGet(STORAGE_KEYS.verificationCodeSentAt);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function clearVerificationCodeSentAt() {
  safeRemove(STORAGE_KEYS.verificationCodeSentAt);
}

export function getVerificationTimeRemainingMs() {
  const sentAt = getVerificationCodeSentAt();
  if (!sentAt) return 0;

  return Math.max(0, sentAt + VERIFICATION_TTL_MS - Date.now());
}

export function getPendingResetEmail() {
  return safeGet(STORAGE_KEYS.pendingResetEmail);
}

export function setPendingResetEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  safeSet(STORAGE_KEYS.pendingResetEmail, normalized);
}

export function clearPendingResetEmail() {
  safeRemove(STORAGE_KEYS.pendingResetEmail);
}

export function setLastLoginMethod(method: AuthProvider, email?: string | null) {
  safeSet(STORAGE_KEYS.lastLoginMethod, method);

  const normalized = normalizeEmail(email);
  if (normalized) {
    safeSet(STORAGE_KEYS.lastLoginEmail, normalized);
  } else if (method !== "EMAIL") {
    safeRemove(STORAGE_KEYS.lastLoginEmail);
  }
}

export function getLastLoginMethod(): AuthProvider | null {
  return normalizeProvider(safeGet(STORAGE_KEYS.lastLoginMethod));
}

export function getLastLoginEmail() {
  return safeGet(STORAGE_KEYS.lastLoginEmail);
}

export function clearLastLoginHint() {
  safeRemove(STORAGE_KEYS.lastLoginMethod);
  safeRemove(STORAGE_KEYS.lastLoginEmail);
}

export function clearAuthFlowState() {
  clearPendingVerificationEmail();
  clearVerificationCodeSentAt();
  clearPendingResetEmail();
}

export async function loginWithIdentifier(identifier: string, password: string) {
  const response = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier: normalizeIdentifier(identifier),
      password,
    }),
  });

  setLastLoginMethod("EMAIL", response.user.email);
  return response;
}

export async function registerWithEmail(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  const response = await apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: input.fullName.trim(),
      email: normalizeEmail(input.email),
      password: input.password,
    }),
  });

  setLastLoginMethod("EMAIL", response.user.email);
  return response;
}

export async function verifyEmailCode(email: string, code: string) {
  return apiFetch<VerifyEmailResponse>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({
      email: normalizeEmail(email),
      code: code.trim(),
    }),
  });
}

export async function resendVerificationCode(email: string) {
  return apiFetch<ResendVerificationResponse>("/auth/resend-verification-code", {
    method: "POST",
    body: JSON.stringify({
      email: normalizeEmail(email),
    }),
  });
}

export async function requestPasswordReset(email: string) {
  return apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      email: normalizeEmail(email),
    }),
  });
}

export async function resetPassword(token: string, password: string) {
  return apiFetch<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: token.trim(),
      password,
    }),
  });
}

export async function logoutSession() {
  const response = await apiFetch<LogoutResponse>("/auth/logout", {
    method: "POST",
  });

  clearLastLoginHint();
  clearAuthFlowState();
  return response;
}

export async function getMe(): Promise<MeResponse | null> {
  try {
    return await apiFetch<MeResponse>("/auth/me");
  } catch {
    return null;
  }
}

export async function finalizeLoginSession() {
  const me = await getMe();

  if (me?.email) {
    const preferred = normalizeProvider(me.preferredLoginMethod) ?? "EMAIL";
    setLastLoginMethod(preferred, me.email);
  }

  return { me };
}

export function continueWithGoogle() {
  if (!isBrowser()) return;
  setLastLoginMethod("GOOGLE");
  window.location.assign(`${API_URL}/auth/google`);
}

export function continueWithApple() {
  if (!isBrowser()) return;
  setLastLoginMethod("APPLE");
  window.location.assign(`${API_URL}/auth/apple`);
}

export function getSuggestedLoginMethod() {
  return {
    method: getLastLoginMethod(),
    email: getLastLoginEmail(),
  };
}