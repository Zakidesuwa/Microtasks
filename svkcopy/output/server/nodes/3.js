import * as server from '../entries/pages/ai-chat/_page.server.ts.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/ai-chat/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/ai-chat/+page.server.ts";
export const imports = ["_app/immutable/nodes/3.DeXNBDeI.js","_app/immutable/chunks/vthok_eK.js","_app/immutable/chunks/BzRJZXn9.js","_app/immutable/chunks/DjKZgApb.js","_app/immutable/chunks/DexkCHB1.js","_app/immutable/chunks/e8VI5U1H.js","_app/immutable/chunks/BTrMBUsU.js","_app/immutable/chunks/w3EaC4W1.js","_app/immutable/chunks/DoonBkoh.js","_app/immutable/chunks/Bq-VOS1f.js","_app/immutable/chunks/CQ-rNl5F.js","_app/immutable/chunks/CRjAGTYJ.js","_app/immutable/chunks/DA7Cc7Tm.js","_app/immutable/chunks/BRtj5TtV.js","_app/immutable/chunks/iVSWiVfi.js"];
export const stylesheets = ["_app/immutable/assets/3.1dZ7WSTP.css"];
export const fonts = [];
