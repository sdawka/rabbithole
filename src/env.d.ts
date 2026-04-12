/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

declare module 'cloudflare:workers' {
  interface Env {
    DB: import('@cloudflare/workers-types').D1Database;
    SESSION: import('@cloudflare/workers-types').KVNamespace;
  }
}
