import { T as current_component } from "./index.js";
function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
async function tick() {
}
export {
  onDestroy as o,
  tick as t
};
