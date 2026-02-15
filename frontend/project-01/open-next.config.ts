import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  edgeExternals: ["node:crypto", "node:events", "node:buffer"],
  exclude: ["mammoth", "pdf-parse"],
});
