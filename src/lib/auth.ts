import { API_URL } from "@/lib/api";

export type AuthProvider = "EMAIL" | "GOOGLE" | "APPLE";

type LoginResponse = {
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

type RegisterResponse = {
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
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  skuullyId?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  preferredLoginMethod?: string | null;
  memberships?: Array<{
    role: string;
    status: string;
    createdAt: string;
    school: {
      id: string;
      name: string;
      country?: string | null;
    };
  }>;
  context?: {
    schoolId?: string | null;
    programId?: string | null;
    role?: string | null;
    membershipId?: string | null;
  };
};

type VerifyEmailResponse = {
  message: string;
  emailVerified?: boolean;
};

type ResendVerificationResponse = {
  message: string;
  emailVerified?: boolean;
};

type ForgotPasswordResponse = {
  message: string;
};

type ResetPasswordResponse = {
  message: string;
};

type LogoutResponse = {
  message: string;
};

const VERIFICATION_TTL_MS = 10 * 60 * 1000;
const LAST_LOGIN_METHOD_KEY = "skuullyLastLoginMethod";
const LAST_LOGIN_EMAIL_KEY = "skuullyLastLoginEmail";
const PENDING_VERIFICATION_EMAIL_KEY = "pendingVerificationEmail";
const VERIFICATION_SENT_AT_KEY = "verificationCodeSentAt";
const PENDING_RESET_EMAIL_KEY = "pendingResetEmail";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getPendingVerificationEmail() {
  if (!isBrowser()) return null;
  return localStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
}

export function setPendingVerificationEmail(email: string) {
  if (!isBrowser()) return;
  localStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
}

export function clearPendingVerificationEmail() {
  if (!isBrowser()) return;
  localStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
}

export function markVerificationCodeSent() {
  if (!isBrowser()) return;
  localStorage.setItem(VERIFICATION_SENT_AT_KEY, String(Date.now()));
}

export function getVerificationCodeSentAt() {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(VERIFICATION_SENT_AT_KEY);
  return raw ? Number(raw) : null;
}

export function clearVerificationCodeSentAt() {
  if (!isBrowser()) return;
  localStorage.removeItem(VERIFICATION_SENT_AT_KEY);
}

export function getVerificationTimeRemainingMs() {
  const sentAt = getVerificationCodeSentAt();
  if (!sentAt) return 0;
  return Math.max(0, sentAt + VERIFICATION_TTL_MS - Date.now());
}

export function getPendingResetEmail() {
  if (!isBrowser()) return null;
  return localStorage.getItem(PENDING_RESET_EMAIL_KEY);
}

export function setPendingResetEmail(email: string) {
  if (!isBrowser()) return;
  localStorage.setItem(PENDING_RESET_EMAIL_KEY, email);
}

export function clearPendingResetEmail() {
  if (!isBrowser()) return;
  localStorage.removeItem(PENDING_RESET_EMAIL_KEY);
}

export function setLastLoginMethod(method: AuthProvider, email?: string | null) {
  if (!isBrowser()) return;
  localStorage.setItem(LAST_LOGIN_METHOD_KEY, method);

  if (email?.trim()) {
    localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email.trim().toLowerCase());
  }
}

export function getLastLoginMethod(): AuthProvider | null {
  if (!isBrowser()) return null;

  const value = localStorage.getItem(LAST_LOGIN_METHOD_KEY);
  if (value === "EMAIL" || value === "GOOGLE" || value === "APPLE") {
    return value;
  }

  return null;
}

export function getLastLoginEmail() {
  if (!isBrowser()) return null;
  return localStorage.getItem(LAST_LOGIN_EMAIL_KEY);
}

export function clearLastLoginHint() {
  if (!isBrowser()) return;
  localStorage.removeItem(LAST_LOGIN_METHOD_KEY);
  localStorage.removeItem(LAST_LOGIN_EMAIL_KEY);
}

function getCsrfTokenFromCookie() {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("skuully_csrf_token="));

  if (!cookie) return null;

  return decodeURIComponent(cookie.split("=")[1]);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();
  const csrfToken = getCsrfTokenFromCookie();

  const headers: HeadersInit = {
    ...(init?.headers ?? {}),
    ...(method !== "GET" &&
    method !== "HEAD" &&
    method !== "OPTIONS" &&
    csrfToken
      ? { "X-CSRF-Token": csrfToken }
      : {}),
  };

  const controller = new AbortController();
  const timeout = typeof window !== "undefined"
    ? window.setTimeout(() => controller.abort(), 20000)
    : null;

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    const text = await res.text();

    if (!res.ok) {
      let message = "Request failed";

      try {
        const parsed = text ? JSON.parse(text) : null;
        message =
          Array.isArray(parsed?.message)
            ? parsed.message[0]
            : parsed?.message || text || message;
      } catch {
        message = text || message;
      }

      throw new Error(message);
    }

    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The request took too long. Please try again.");
    }
    throw error;
  } finally {
    if (timeout) {
      window.clearTimeout(timeout);
    }
  }
}

export async function loginWithIdentifier(
  identifier: string,
  password: string
) {
  const response = await fetchJson<LoginResponse>(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifier, password }),
  });

  setLastLoginMethod("EMAIL", response.user.email);
  return response;
}

export async function registerWithEmail(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  const response = await fetchJson<RegisterResponse>(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  setLastLoginMethod("EMAIL", response.user.email);
  return response;
}

export async function verifyEmailCode(email: string, code: string) {
  return fetchJson<VerifyEmailResponse>(`${API_URL}/auth/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });
}

export async function resendVerificationCode(email: string) {
  return fetchJson<ResendVerificationResponse>(
    `${API_URL}/auth/resend-verification-code`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    }
  );
}

export async function requestPasswordReset(email: string) {
  return fetchJson<ForgotPasswordResponse>(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string) {
  return fetchJson<ResetPasswordResponse>(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });
}

export async function logoutSession() {
  const response = await fetchJson<LogoutResponse>(`${API_URL}/auth/logout`, {
    method: "POST",
  });

  clearLastLoginHint();
  return response;
}

export async function getMe(): Promise<MeResponse | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      credentials: "include",
    });

    if (!res.ok) return null;

    return (await res.json()) as MeResponse;
  } catch {
    return null;
  }
}

export async function finalizeLoginSession() {
  const me = await getMe();

  if (me?.email) {
    const preferred =
      me.preferredLoginMethod === "GOOGLE"
        ? "GOOGLE"
        : me.preferredLoginMethod === "APPLE"
        ? "APPLE"
        : "EMAIL";

    setLastLoginMethod(preferred, me.email);
  }

  return { me };
}

/**
 * Social auth entry points.
 * These should point to backend redirect endpoints once you wire OAuth server-side.
 *
 * Expected backend examples:
 *   GET /auth/google
 *   GET /auth/apple
 */
export function continueWithGoogle() {
  if (!isBrowser()) return;
  setLastLoginMethod("GOOGLE");
  window.location.href = `${API_URL}/auth/google`;
}

export function continueWithApple() {
  if (!isBrowser()) return;
  setLastLoginMethod("APPLE");
  window.location.href = `${API_URL}/auth/apple`;
}

export function getSuggestedLoginMethod() {
  return {
    method: getLastLoginMethod(),
    email: getLastLoginEmail(),
  };
}