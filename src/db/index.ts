// D1 database access — the binding is passed from Astro's request context.
// No singleton, no file system access. Each DB function receives D1Database as its first parameter.
export type { D1Database } from '@cloudflare/workers-types';
