import * as server from '../entries/pages/calendar/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/calendar/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/calendar/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.BLvVdTjE.js","_app/immutable/chunks/vthok_eK.js","_app/immutable/chunks/BzRJZXn9.js","_app/immutable/chunks/DjKZgApb.js","_app/immutable/chunks/DexkCHB1.js","_app/immutable/chunks/e8VI5U1H.js","_app/immutable/chunks/BRUWU8QW.js","_app/immutable/chunks/CP2jtEFB.js","_app/immutable/chunks/BRtj5TtV.js","_app/immutable/chunks/CRjAGTYJ.js","_app/immutable/chunks/BBI8m-aS.js","_app/immutable/chunks/BTrMBUsU.js","_app/immutable/chunks/w3EaC4W1.js","_app/immutable/chunks/BIvWHAOA.js","_app/immutable/chunks/DoonBkoh.js","_app/immutable/chunks/BDD76Zze.js","_app/immutable/chunks/Bq-VOS1f.js","_app/immutable/chunks/5-ktuanY.js","_app/immutable/chunks/BotH8uJD.js","_app/immutable/chunks/CQ-rNl5F.js","_app/immutable/chunks/DA7Cc7Tm.js","_app/immutable/chunks/iVSWiVfi.js"];
export const stylesheets = ["_app/immutable/assets/4.DOXHXLdm.css"];
export const fonts = [];
