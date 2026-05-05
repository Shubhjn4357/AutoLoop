import '@testing-library/jest-dom/vitest';

class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver = MockObserver as unknown as typeof IntersectionObserver;
window.ResizeObserver = MockObserver as unknown as typeof ResizeObserver;
