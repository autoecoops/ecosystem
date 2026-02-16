import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  // Externalize Node.js core modules that are either not needed at runtime
  // or provided by the Cloudflare edge runtime / tooling, so they are not
  // bundled into the edge function code.
  edgeExternals: ["node:crypto", "node:events", "node:buffer"],
  // Exclude server-side/Node-only libraries that are not compatible with the Cloudflare runtime
  // and are intended to run only in the backend environment.
  exclude: ["mammoth", "pdf-parse"],
});
