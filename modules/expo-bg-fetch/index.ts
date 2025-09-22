// Public JS API for expo-bg-fetch
import NativeModule from "./src/ExpoBgFetchModule";
import type {
  BgFetchArgs,
  BgFetchResult,
  BgFetchResultEvent,
} from "./src/ExpoBgFetch.types";
export * from "./src/ExpoBgFetch.types";

export const BgFetch = {
  // Synchronous start; returns a requestId immediately. Callback fires when result event arrives.
  send(args: BgFetchArgs, cb?: (result: BgFetchResult) => void) {
    const id = NativeModule.send(args);
    if (cb) {
      const sub = NativeModule.addListener(
        "onResult",
        (evt: BgFetchResultEvent) => {
          if (evt.requestId === id) {
            try {
              cb(evt.result);
            } finally {
              sub.remove();
            }
          }
        },
      );
    }
    return id;
  },
};

export default BgFetch;
