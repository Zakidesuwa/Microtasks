import * as server from '../entries/pages/settings/_page.server.ts.js';

export const index = 9;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/settings/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/settings/+page.server.ts";
export const imports = ["_app/immutable/nodes/9.CHHzvNCD.js","_app/immutable/chunks/vthok_eK.js","_app/immutable/chunks/BzRJZXn9.js","_app/immutable/chunks/DjKZgApb.js","_app/immutable/chunks/DexkCHB1.js","_app/immutable/chunks/e8VI5U1H.js","_app/immutable/chunks/BBI8m-aS.js","_app/immutable/chunks/BTrMBUsU.js","_app/immutable/chunks/w3EaC4W1.js","_app/immutable/chunks/DoonBkoh.js","_app/immutable/chunks/Bq-VOS1f.js","_app/immutable/chunks/BotH8uJD.js","_app/immutable/chunks/CQ-rNl5F.js","_app/immutable/chunks/CRjAGTYJ.js","_app/immutable/chunks/DA7Cc7Tm.js","_app/immutable/chunks/BRtj5TtV.js","_app/immutable/chunks/Bt-Xh7oU.js","_app/immutable/chunks/iVSWiVfi.js","_app/immutable/chunks/Hc-2lIR6.js"];
export const stylesheets = ["_app/immutable/assets/9.C_kf912G.css"];
export const fonts = [];
