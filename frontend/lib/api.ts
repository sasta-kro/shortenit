import { Url, LinkDetails, AnalyticsData, User } from "./types";
import { withBasePath } from "./app-path";

const API_BASE_URL = typeof window === "undefined"
  ? (process.env.NEXT_PUBLIC_API_BASE_URL || "")
  : "";
  
type RequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
  method?: RequestMethod;
  body?: any;
  headers?: Record<string, string>;
}

function resolveRequestUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }

  const appPath = withBasePath(endpoint);
  if (typeof window === "undefined" && !endpoint.startsWith("/internal")) {
    return `${API_BASE_URL}${appPath}`;
  }

  return appPath;
}

export function appFetch(
  endpoint: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(resolveRequestUrl(endpoint), init);
}

async function fetchClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  };

  const url = resolveRequestUrl(endpoint);

  let response = await fetch(url, config);

  // Auto-refresh token on 401 (skip for auth endpoints to avoid loops)
  if (response.status === 401 && !endpoint.includes("/api/auth/")) {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh-token") : null;
    if (refreshToken) {
      try {
        const refreshResponse = await appFetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const newToken = data.accessToken || data.token;
          if (newToken) {
            localStorage.setItem("auth-token", newToken);
            if (data.refreshToken) {
              localStorage.setItem("refresh-token", data.refreshToken);
            }

            // Retry the original request with new token
            const retryConfig: RequestInit = {
              ...config,
              headers: {
                ...config.headers as Record<string, string>,
                Authorization: `Bearer ${newToken}`,
              },
            };
            response = await fetch(url, retryConfig);
          }
        } else {
          // Refresh failed — clear tokens
          localStorage.removeItem("auth-token");
          localStorage.removeItem("refresh-token");
          localStorage.removeItem("auth-user");
          if (typeof window !== "undefined") {
            window.location.href = withBasePath("/auth");
          }
        }
      } catch {
        // Refresh request failed entirely
        localStorage.removeItem("auth-token");
        localStorage.removeItem("refresh-token");
        localStorage.removeItem("auth-user");
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  // Handle empty responses (e.g. DELETE, logout)
  const contentLength = response.headers.get("content-length");
  const contentType = response.headers.get("content-type");
  if (response.status === 204 || contentLength === "0" || !contentType?.includes("application/json")) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  auth: {
    refresh: (refreshToken: string) =>
      fetchClient<{ accessToken: string; refreshToken?: string }>("/api/auth/refresh", {
        method: "POST",
        body: { refreshToken },
      }),
    logout: () =>
      fetchClient<void>("/api/auth/logout", { method: "POST" }),
  },
  links: {
    getAll: () => fetchClient<Url[]>("/api/urls"),
    getOne: (code: string) => fetchClient<LinkDetails>(`/api/urls/${code}`),
    create: (data: { originalUrl: string; code?: string; title?: string; expirationDays?: number }) =>
      fetchClient<Url>("/api/urls", { method: "POST", body: data }),
    update: (code: string, data: any) =>
      fetchClient<LinkDetails>(`/api/urls/${code}`, { method: "PUT", body: data }),
    delete: (code: string) => fetchClient<void>(`/api/urls/${code}`, { method: "DELETE" }),
    validate: (url: string) => fetchClient<{ title: string }>("/internal/validate-url", { method: "POST", body: { url } }), // Note: internal API
  },
  analytics: {
    get: (code: string) => fetchClient<AnalyticsData>(`/api/analytics/${code}`),
  },
  admin: {
    getAllLinks: (params?: { page?: number; size?: number; sortBy?: string; direction?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.direction) queryParams.append('direction', params.direction);
      const queryString = queryParams.toString();
      return fetchClient<any>(`/api/admin/urls${queryString ? `?${queryString}` : ''}`);
    },
    getUsers: () => fetchClient<User[]>("/api/admin/users"),
    getUser: (id: number) => fetchClient<User>(`/api/admin/users/${id}`),
    deleteUser: (id: number) => fetchClient<void>(`/api/admin/users/${id}`, { method: "DELETE" }),
    updateRole: (id: number, role: string) => fetchClient<User>(`/api/admin/users/${id}/role`, { method: "PATCH", body: { role } }),
    promote: (id: number) => fetchClient<void>(`/api/admin/users/${id}/promote`, { method: "POST" }),
    demote: (id: number) => fetchClient<void>(`/api/admin/users/${id}/demote`, { method: "POST" }),
    checkProtected: () => fetchClient<{ protected: boolean }>("/api/admin/me/protected-status"),
  }
};
