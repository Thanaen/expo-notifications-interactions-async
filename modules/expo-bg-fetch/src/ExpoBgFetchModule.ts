import { NativeModule, requireNativeModule } from "expo";

import { BgFetchArgs, ExpoBgFetchModuleEvents } from "./ExpoBgFetch.types";

declare class ExpoBgFetchModule extends NativeModule<ExpoBgFetchModuleEvents> {
  // Start a background fetch and return a requestId synchronously
  send: (args: BgFetchArgs) => string;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoBgFetchModule>("ExpoBgFetch");
