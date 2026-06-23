import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL + '/api';
const nextServer = axios.create({
  baseURL,
  withCredentials: true,
});

// Mark a request that has already been retried after a refresh so we
// never loop on it.
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Single-flight refresh: concurrent 401s share one /auth/refresh call
// instead of firing a stampede of them.
let refreshPromise: Promise<unknown> | null = null;

// Auto-refresh on 401 for in-page API calls. The proxy middleware
// only refreshes on navigations; this covers the gap where an
// accessToken expires while the user sits on an open page and then
// triggers a fetch. Browser-only — server-side callers (serverApi)
// run their own session flow and must not recurse here.
nextServer.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    if (typeof window === 'undefined' || !original) {
      return Promise.reject(error);
    }

    const url = original.url ?? '';
    // Never try to refresh the auth endpoints themselves — that would
    // recurse (a failing /auth/refresh would trigger another refresh).
    const isAuthCall =
      url.includes('/auth/refresh') || url.includes('/auth/login');

    if (error.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = nextServer
            .post('/auth/refresh')
            .finally(() => {
              refreshPromise = null;
            });
        }
        await refreshPromise;
        // Cookies were rotated by the proxy route; replay the request.
        return nextServer(original);
      } catch {
        // Refresh genuinely failed → session is gone, bounce to login.
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default nextServer;
