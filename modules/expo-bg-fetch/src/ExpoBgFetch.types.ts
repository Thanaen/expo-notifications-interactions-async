// Simplified fetch request args supported by the native module
export type BgFetchArgs = {
  url: string; // required
  method?: string; // defaults to GET
  headers?: Record<string, string>;
  body?: string; // send as UTF-8 text; keep simple
  timeoutMs?: number; // optional per-request timeout
};

// Minimal result, enough to know success/failure
export type BgFetchResult = {
  ok: boolean;
  status: number; // 0 when request failed to start
  url?: string;
  error?: string; // present when ok is false due to error/exception
};

// Event payload when a background fetch completes
export type BgFetchResultEvent = {
  requestId: string;
  result: BgFetchResult;
};

// Module events
export type ExpoBgFetchModuleEvents = {
  onResult: (params: BgFetchResultEvent) => void;
};
