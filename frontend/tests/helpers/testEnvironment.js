export function createLocalStorageMock(initialEntries = {}) {
  const values = new Map(Object.entries(initialEntries));

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
}

export function installLocalStorageMock(initialEntries = {}) {
  const previousLocalStorage = globalThis.localStorage;
  const localStorage = createLocalStorageMock(initialEntries);

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorage,
  });

  return () => {
    if (previousLocalStorage === undefined) {
      delete globalThis.localStorage;
      return;
    }

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: previousLocalStorage,
    });
  };
}

export function installFetchMock(handler) {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = handler;

  return () => {
    if (previousFetch === undefined) {
      delete globalThis.fetch;
      return;
    }

    globalThis.fetch = previousFetch;
  };
}
