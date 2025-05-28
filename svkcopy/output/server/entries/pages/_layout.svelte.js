import { C as fallback, E as attr_style, F as escape_html, G as bind_props, I as stringify, J as store_get, K as unsubscribe_stores, B as pop, z as push } from "../../chunks/index.js";
import { n as navigating } from "../../chunks/stores.js";
function LoadingIndicator($$payload, $$props) {
  let fullScreen = fallback($$props["fullScreen"], true);
  let message = fallback($$props["message"], "Microtasks is getting ready...");
  let duration = fallback($$props["duration"], 1.5);
  let containerSize = fallback($$props["containerSize"], "200px");
  let boxSize = fallback($$props["boxSize"], "27px");
  let boxBorderRadius = fallback($$props["boxBorderRadius"], "15%");
  let overlayBackgroundColor = fallback($$props["overlayBackgroundColor"], "rgba(30, 41, 59, 0.7)");
  let messageTextColor = fallback($$props["messageTextColor"], "#e2e8f0");
  let slideBoxAfterStartColor = fallback($$props["slideBoxAfterStartColor"], "#1795FF");
  let slideBoxAfterEndColor = fallback($$props["slideBoxAfterEndColor"], "#23D3FB");
  let box2AfterColor = fallback($$props["box2AfterColor"], "#1C9FFF");
  let box3AfterColor = fallback($$props["box3AfterColor"], "#1FB1FD");
  let box4AfterColor = fallback($$props["box4AfterColor"], "#22C7FB");
  let box5AfterColor = fallback($$props["box5AfterColor"], "#23D3FB");
  let boxShadowBaseColor = fallback($$props["boxShadowBaseColor"], "#1C9FFF");
  if (fullScreen) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="loader-overlay svelte-jslq0t" role="status" aria-live="polite"${attr_style("", { "--overlay-bg-color": overlayBackgroundColor })}><div class="animation-wrapper svelte-jslq0t"${attr_style("", {
      "--duration": `${stringify(duration)}s`,
      "--container-size": containerSize,
      "--box-size": boxSize,
      "--box-border-radius": boxBorderRadius,
      "--slide-box-after-start-color": slideBoxAfterStartColor,
      "--slide-box-after-end-color": slideBoxAfterEndColor,
      "--box2-after-color": box2AfterColor,
      "--box3-after-color": box3AfterColor,
      "--box4-after-color": box4AfterColor,
      "--box5-after-color": box5AfterColor,
      "--box-shadow-base-color": boxShadowBaseColor
    })}><div class="container svelte-jslq0t"><div class="box svelte-jslq0t"></div> <div class="box svelte-jslq0t"></div> <div class="box svelte-jslq0t"></div> <div class="box svelte-jslq0t"></div> <div class="box svelte-jslq0t"></div></div></div> `;
    if (message) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="loader-message svelte-jslq0t"${attr_style("", { color: messageTextColor })}>${escape_html(message)}</p>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="animation-wrapper svelte-jslq0t"${attr_style("", {
      "--duration": `${stringify(duration)}s`,
      "--container-size": containerSize,
      "--box-size": boxSize,
      "--box-border-radius": boxBorderRadius,
      "--slide-box-after-start-color": slideBoxAfterStartColor,
      "--slide-box-after-end-color": slideBoxAfterEndColor,
      "--box2-after-color": box2AfterColor,
      "--box3-after-color": box3AfterColor,
      "--box4-after-color": box4AfterColor,
      "--box5-after-color": box5AfterColor,
      "--box-shadow-base-color": boxShadowBaseColor
    })}><div class="container svelte-jslq0t"><div class="box svelte-jslq0t"></div> <div class="box svelte-jslq0t"></div> <div class="box svelte-jslq0t"></div> <div class="box svelte-jslq0t"></div> <div class="box svelte-jslq0t"></div></div> `;
    if (message) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="loader-message-inline svelte-jslq0t"${attr_style("", { color: messageTextColor })}>${escape_html(message)}</p>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, {
    fullScreen,
    message,
    duration,
    containerSize,
    boxSize,
    boxBorderRadius,
    overlayBackgroundColor,
    messageTextColor,
    slideBoxAfterStartColor,
    slideBoxAfterEndColor,
    box2AfterColor,
    box3AfterColor,
    box4AfterColor,
    box5AfterColor,
    boxShadowBaseColor
  });
}
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  let { children } = $$props;
  if (store_get($$store_subs ??= {}, "$navigating", navigating)) {
    $$payload.out += "<!--[-->";
    LoadingIndicator($$payload, {});
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  children($$payload);
  $$payload.out += `<!---->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _layout as default
};
