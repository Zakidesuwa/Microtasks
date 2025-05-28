import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.BPouEFV2.js","_app/immutable/chunks/vthok_eK.js","_app/immutable/chunks/BzRJZXn9.js","_app/immutable/chunks/e8VI5U1H.js","_app/immutable/chunks/CQ-rNl5F.js","_app/immutable/chunks/CRjAGTYJ.js","_app/immutable/chunks/DA7Cc7Tm.js","_app/immutable/chunks/BRtj5TtV.js","_app/immutable/chunks/DjKZgApb.js","_app/immutable/chunks/DexkCHB1.js","_app/immutable/chunks/BIvWHAOA.js","_app/immutable/chunks/w3EaC4W1.js","_app/immutable/chunks/BotH8uJD.js"];
export const stylesheets = ["_app/immutable/assets/0.Dn1HwRcb.css"];
export const fonts = [];
