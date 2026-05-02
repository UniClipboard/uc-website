import "@testing-library/jest-dom";

// jsdom does not implement IntersectionObserver. framer-motion's viewport
// features (whileInView / AnimateIn) try to observe elements during render,
// so without this stub any component tree using `motion.*` blows up.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = IntersectionObserverStub;
}
