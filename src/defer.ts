// Every callback `SVGInjector` makes is routed through here, so the guarantee
// that none of them fires before the call returns has one implementation.
// `setTimeout` rather than `queueMicrotask` on purpose: a microtask checkpoint
// cannot be preempted by a paint, and the waiter drain in `load-svg-cached.ts`
// yields to the renderer deliberately.
const defer = (fn: () => void) => {
  setTimeout(fn, 0)
}

export default defer
