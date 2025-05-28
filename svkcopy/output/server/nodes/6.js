import * as server from '../entries/pages/forgotpass/_page.server.ts.js';

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/forgotpass/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/forgotpass/+page.server.ts";
export const imports = ["_app/immutable/nodes/6.k_BTBEAE.js","_app/immutable/chunks/vthok_eK.js","_app/immutable/chunks/BzRJZXn9.js","_app/immutable/chunks/DjKZgApb.js","_app/immutable/chunks/DexkCHB1.js","_app/immutable/chunks/e8VI5U1H.js","_app/immutable/chunks/BBI8m-aS.js","_app/immutable/chunks/BTrMBUsU.js","_app/immutable/chunks/w3EaC4W1.js","_app/immutable/chunks/BDD76Zze.js","_app/immutable/chunks/Bq-VOS1f.js","_app/immutable/chunks/Hc-2lIR6.js"];
export const stylesheets = ["_app/immutable/assets/6.BGpIWMNg.css"];
export const fonts = [];
