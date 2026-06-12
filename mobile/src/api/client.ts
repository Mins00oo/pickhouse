import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
  }

  interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
    _retried?: boolean;
  }
}

export interface ApiClientOptions {
  baseURL: string;
  getAccessToken: () => Promise<string | null>;
  onUnauthorized: () => Promise<string | null>;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
  skipAuth?: boolean;
}

interface ApiEnvelope<T> {
  code: string;
  message: string;
  data: T;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number | null,
    public readonly data: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.message === 'string' &&
    Object.prototype.hasOwnProperty.call(value, 'data')
  );
}

function toApiError(error: AxiosError): Error {
  const body = error.response?.data;
  if (isApiEnvelope(body)) {
    return new ApiError(body.code, body.message, error.response?.status ?? null, body.data);
  }
  return error;
}

export function createApiClient(opts: ApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: opts.baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  if (__DEV__) {
    // 개발 중 네트워크 가시성: 요청/응답/에러를 Metro 콘솔에 출력한다.
    // eslint-disable-next-line no-console
    console.log('[api] baseURL =', opts.baseURL);
    client.interceptors.request.use((config) => {
      // eslint-disable-next-line no-console
      console.log(`[api] → ${config.method?.toUpperCase()} ${config.baseURL ?? ''}${config.url ?? ''}`);
      return config;
    });
    client.interceptors.response.use(
      (resp) => {
        // eslint-disable-next-line no-console
        console.log(`[api] ← ${resp.status} ${resp.config.url ?? ''}`);
        return resp;
      },
      (err: AxiosError) => {
        // eslint-disable-next-line no-console
        console.log(
          `[api] ✗ ${err.config?.url ?? ''} — ${err.response?.status ?? err.code ?? 'NETWORK'}: ${err.message}`,
        );
        throw err;
      },
    );
  }

  client.interceptors.request.use(async (config) => {
    const cfg = config as RetriableConfig;
    if (cfg.skipAuth) return config;
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
    (resp) => {
      if (isApiEnvelope(resp.data)) {
        resp.data = resp.data.data;
      }
      return resp;
    },
    async (err: AxiosError) => {
      const cfg = err.config as RetriableConfig | undefined;
      if (err.response?.status === 401 && cfg && !cfg._retried && !cfg.skipAuth) {
        cfg._retried = true;
        const newToken = await opts.onUnauthorized();
        if (newToken) {
          cfg.headers = cfg.headers ?? {};
          (cfg.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
          return client.request(cfg);
        }
      }
      throw toApiError(err);
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
