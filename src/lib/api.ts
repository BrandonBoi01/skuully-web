export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const found = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!found) return null;
  return decodeURIComponent(found.split("=")[1] || "");
}

async function tryRefresh() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  return res.ok;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  hasRetried = false
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const csrfToken = getCookie("skuully_csrf_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && csrfToken
      ? { "X-CSRF-Token": csrfToken }
      : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !hasRetried) {
    const refreshed = await tryRefresh();

    if (refreshed) {
      return apiFetch<T>(path, options, true);
    }

    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }

    throw new Error("Session expired");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }

  return res.json();
}