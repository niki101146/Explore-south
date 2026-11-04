import axios from "axios";

// In development Vite proxies /api to Django. In production set VITE_API_URL on Vercel to the
// backend address, e.g. https://exploresouth-api.onrender.com/api (no trailing slash).
export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

const api = axios.create({ baseURL: API_URL });

export const tokens = {
  get access() { return localStorage.getItem("access"); },
  get refresh() { return localStorage.getItem("refresh"); },
  set({ access, refresh }) {
    if (access) localStorage.setItem("access", access);
    if (refresh) localStorage.setItem("refresh", refresh);
  },
  clear() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  },
};

api.interceptors.request.use((config) => {
  if (tokens.access) config.headers.Authorization = `Bearer ${tokens.access}`;
  return config;
});

// On 401, try the refresh token once, then retry the original request.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && tokens.refresh && !original._retry
        && !original.url.includes("/auth/")) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh: tokens.refresh });
        tokens.set({ access: data.access });
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        tokens.clear();
      }
    }
    return Promise.reject(error);
  }
);

// Turns a DRF error response into one readable string.
export function errorMessage(err, fallback = "Something went wrong.") {
  const data = err?.response?.data;
  if (!data || typeof data === "string") return fallback;
  if (data.detail) return data.detail;
  return Object.entries(data)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
    .join(" | ");
}

export default api;
