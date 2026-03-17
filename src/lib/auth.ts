import { API_URL } from "@/lib/api";

type LoginResponse = {
  requiresEmailVerification?: boolean;
  emailVerified?: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    skuullyId?: string | null;
  };
};

type RegisterResponse = {
  message: string;
  requiresEmailVerification?: boolean;
  emailVerified?: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    skuullyId?: string | null;
  };
};

type MeResponse = {
  id: string;
  fullName: string;
  email: string;
  skuullyId?: string | null;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
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

export function getPendingVerificationEmail() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pendingVerificationEmail");
}

export function setPendingVerificationEmail(email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("pendingVerificationEmail", email);
}

export function clearPendingVerificationEmail() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("pendingVerificationEmail");
}

export function markVerificationCodeSent() {
  if (typeof window === "undefined") return;
  localStorage.setItem("verificationCodeSentAt", String(Date.now()));
}

export function getVerificationCodeSentAt() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("verificationCodeSentAt");
  return raw ? Number(raw) : null;
}

export function clearVerificationCodeSentAt() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("verificationCodeSentAt");
}

export function getVerificationTimeRemainingMs() {
  const sentAt = getVerificationCodeSentAt();
  if (!sentAt) return 0;
  return Math.max(0, sentAt + VERIFICATION_TTL_MS - Date.now());
}

export function getPendingResetEmail() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pendingResetEmail");
}

export function setPendingResetEmail(email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("pendingResetEmail", email);
}

export function clearPendingResetEmail() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("pendingResetEmail");
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();
  const csrfToken =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((item) => item.startsWith("skuully_csrf_token="))
          ?.split("=")[1]
      : null;

  const headers: HeadersInit = {
    ...(init?.headers ?? {}),
    ...(method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && csrfToken
      ? { "X-CSRF-Token": decodeURIComponent(csrfToken) }
      : {}),
  };

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Request failed");
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function loginWithEmail(email: string, password: string) {
  return fetchJson<LoginResponse>(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}

export async function registerWithEmail(input: {
  email: string;
  password: string;
}) {
  return fetchJson<RegisterResponse>(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
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
  return fetchJson<LogoutResponse>(`${API_URL}/auth/logout`, {
    method: "POST",
  });
}

export async function getMe() {
  return fetchJson<MeResponse>(`${API_URL}/auth/me`);
}

export async function finalizeLoginSession() {
  const me = await getMe();
  return { me };
}