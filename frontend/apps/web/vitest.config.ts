import { fileURLToPath } from "node:url";
import { mergeConfig } from "vitest/config";
import { sharedConfig } from "../../vitest.shared.ts";

export default mergeConfig(sharedConfig, {
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
});
