// Every callback `SVGInjector` makes is routed through here: `settle` in
// `inject-element.ts` for each injection, and the `afterAll(0)` paths in
// `svg-injector.ts` for calls with nothing to inject. That keeps the guarantee
// that none of them fires before the call returns in one place.
// `inject-element.ts` also defers the transform, so consumer code in it never
// runs on the caller's stack.
// `setTimeout` rather than `queueMicrotask` on purpose: a microtask checkpoint
// cannot be preempted by a paint, and the deferred settles yield to the
// renderer between elements deliberately.
const defer = (fn: () => void) => {
  setTimeout(fn, 0)
}

export default defer
