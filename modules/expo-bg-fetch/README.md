# expo-bg-fetch (local module)

A tiny native module to start an HTTP request immediately from JavaScript and get a minimal success/failure result via callback. Designed to be invoked from places like notification quick actions where a synchronous API helps ensure the call is dispatched right away.

## Install / Import

This package is already added locally in this repo under `modules/expo-bg-fetch`.

```ts
import BgFetch from "expo-bg-fetch";
```

## Usage

```ts
import BgFetch from "expo-bg-fetch";

const id = BgFetch.send(
  {
    url: "https://httpbin.org/status/200",
    method: "GET", // optional, default 'GET'
    headers: { Accept: "application/json" }, // optional
    // body: JSON.stringify({ foo: 'bar' }), // optional (ignored for GET/HEAD)
    timeoutMs: 10_000, // optional
  },
  (result) => {
    // result: { ok: boolean; status: number; url?: string; error?: string }
    console.log("request", id, "finished with", result);
  },
);
```

- `send(args, cb)` returns a `requestId` string synchronously and triggers `cb(result)` when the request finishes.
- `args` (all optional except `url`):
  - `url: string` (required)
  - `method?: string` (default `GET`)
  - `headers?: Record<string, string>`
  - `body?: string` (UTF-8 text; ignored for GET/HEAD)
  - `timeoutMs?: number`
- `result` contains:
  - `ok: boolean`
  - `status: number` (0 when request failed to start)
  - `url?: string`
  - `error?: string`

Notes

- This is not a scheduled background job—`send` just dispatches the request off the JS thread immediately and reports when it completes.
- Keep payloads small and simple; this API is meant for quick acknowledgements.

## iOS (what it does)

- Exposes a synchronous native function `send(args): string` that returns a `requestId` immediately.
- Builds a `URLRequest` from the provided args and starts a `URLSession.dataTask` in the background.
- When the request finishes (or errors), it emits a single native event `onResult` with `{ requestId, result }`, which the JS wrapper routes to your callback.
- Timeout is applied via `URLSessionConfiguration.timeoutIntervalForRequest` when `timeoutMs` is provided.

## Android (what it does)

- Exposes a synchronous native function `send(args): string` that returns a `requestId` immediately.
- Uses OkHttp to enqueue the HTTP call on a background thread.
- When the request finishes (or errors), it emits a single native event `onResult` with `{ requestId, result }`, which the JS wrapper routes to your callback.
- If `timeoutMs` is provided, it applies connect/read/write timeouts to the OkHttp client instance for that call.

## Platform support

- iOS and Android only. Web is intentionally not supported.

## Troubleshooting

- Android: ensure network permission (Internet) is present (it usually is by default in RN/Expo apps).
- iOS: for non-HTTPS endpoints, App Transport Security (ATS) exceptions may be required.
