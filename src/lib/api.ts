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

async function parseApiError(res: Response): Promise<never> {
  const text = await res.text();

  if (!text) throw new Error("Request failed");

  try {
    const parsed = JSON.parse(text);
    const message = Array.isArray(parsed?.message)
      ? parsed.message[0]
      : parsed?.message || text;

    throw new Error(message);
  } catch {
    throw new Error(text || "Request failed");
  }
}

/* 🔒 GLOBAL REFRESH LOCK */
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    })();

    const result = await refreshPromise;
    refreshPromise = null;
    return result;
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  hasRetried = false
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const csrfToken = getCookie("skuully_csrf_token");

  const headers: HeadersInit = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(method !== "GET" &&
    method !== "HEAD" &&
    method !== "OPTIONS" &&
    csrfToken
      ? { "X-CSRF-Token": csrfToken }
      : {}),
    ...(options.headers ?? {}),
  };

  const controller = new AbortController();
  const timeout =
    typeof window !== "undefined"
      ? window.setTimeout(() => controller.abort(), 20000)
      : null;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    if (res.status === 401 && !hasRetried) {
      const refreshed = await refreshSession();

      if (refreshed) {
        return apiFetch<T>(path, options, true);
      }

      throw new Error("SESSION_EXPIRED");
    }

    if (!res.ok) {
      await parseApiError(res);
    }

    if (res.status === 204) {
      return {} as T;
    }

    const text = await res.text();
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