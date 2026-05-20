import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

export interface ApiClientOptions {
  baseURL: string;
  getAccessToken: () => Promise<string | null>;
  onUnauthorized: () => Promise<string | null>;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

export function createApiClient(opts: ApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: opts.baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    const cfg = config as RetriableConfig;
    // Skip token injection on retry — token already set by response interceptor
    if (cfg._retried) {
      return config;
    }
    const token = await opts.getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (resp) => resp,
    async (err: AxiosError) => {
      const cfg = err.config as RetriableConfig | undefined;
      if (err.response?.status === 401 && cfg && !cfg._retried) {
        cfg._retried = true;
        const newToken = await opts.onUnauthorized();
        if (newToken) {
          cfg.headers = cfg.headers ?? {};
          (cfg.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
          return client.request(cfg);
        }
      }
      throw err;
    },
  );

  return client;
}

let singleton: AxiosInstance | null = null;

export function setApiClient(c: AxiosInstance): void {
  singleton = c;
}

export function getApiClient(): AxiosInstance {
  if (!singleton) {
    throw new Error('API client not initialized. Call setApiClient first.');
  }
  return singleton;
}
