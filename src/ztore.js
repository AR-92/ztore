const createStore = (initial) => {
  let state = structuredClone(initial);

  const listeners = new Set();
  const eventSubscribers = new Map();

  const store = {
    // -------------------------
    // STATE
    // -------------------------

    get() {
      return state;
    },

    set(next) {
      const prev = state;

      state = typeof next === "function" ? next(prev) : next;

      listeners.forEach((listener) => {
        try {
          listener(state, prev);
        } catch (err) {
          console.error("Listener error:", err);
        }
      });
    },

    update(fn) {
      store.set(fn);
    },

    setKey(key, value) {
      store.set((s) => ({
        ...s,
        [key]: typeof value === "function" ? value(s[key]) : value,
      }));
    },

    // -------------------------
    // REACTIVITY
    // -------------------------

    subscribe(listener, immediate = false) {
      listeners.add(listener);

      if (immediate) {
        listener(state, state);
      }

      return () => listeners.delete(listener);
    },

    select(selector, callback) {
      let prev = selector(state);

      return store.subscribe((nextState) => {
        const next = selector(nextState);

        if (Object.is(prev, next)) return;

        callback(next, prev);
        prev = next;
      });
    },

    // -------------------------
    // EVENTS
    // -------------------------

    on(event, callback) {
      if (!eventSubscribers.has(event)) {
        eventSubscribers.set(event, new Set());
      }

      eventSubscribers.get(event).add(callback);

      return () => store.off(event, callback);
    },

    once(event, callback) {
      const off = store.on(event, (...args) => {
        off();
        callback(...args);
      });

      return off;
    },

    off(event, callback) {
      if (!event) {
        eventSubscribers.clear();
        return;
      }

      const subs = eventSubscribers.get(event);

      if (!subs) return;

      if (!callback) {
        subs.clear();
        return;
      }

      subs.delete(callback);
    },

    emit(event, data) {
      const subs = eventSubscribers.get(event);

      if (!subs) return;

      for (const cb of subs) {
        try {
          cb({
            type: event,
            data,
            state,
          });
        } catch (err) {
          console.error(`Event "${event}" error:`, err);
        }
      }
    },

    // -------------------------
    // UTILS
    // -------------------------

    destroy() {
      listeners.clear();
      eventSubscribers.clear();
    },
  };

  return store;
};

export { createStore };
