# ztore

**ztore** is a state management library in 138 lines. No dependencies. No build step. No proxies, observables, or symbols. Just a plain JavaScript object with 11 methods that give you state, reactivity, and an event system in one unified API.

```sh
npm install ztore
# or just copy ztore.js into your project — it's one file
```

## Why another state library?

Every JS state library makes a tradeoff. Redux gives you predictability but requires boilerplate. Zustand gives you simplicity but relies on Proxies. MobX gives you granular reactivity but adds magic. Jotai and Recoil give you atomic atoms but need a framework-specific mental model. Pinia ties you to Vue. Signals are new and not yet standardized.

ztore makes a different tradeoff: **zero magic, zero dependencies, maximum portability.** It's a single function that returns a plain object. You can read it, understand it, fork it, and inline it into any project in 5 minutes.

## What it does

ztore gives you three things that work together:

| Layer | What | Methods |
|-------|------|---------|
| **State** | A single state object managed through controlled updates | `get`, `set`, `update`, `setKey` |
| **Reactivity** | Subscribe to state changes with granular selection | `subscribe`, `select` |
| **Events** | A named event system that carries the current state | `on`, `once`, `off`, `emit` |

These three layers share the same store instance. You can read state in event handlers. You can emit events inside state updaters. You can select derived state and react to it. Everything is explicit, synchronous, and predictable.

## Core philosophy

**1. State is just an object.**

No proxies, no `Proxy` traps, no `defineProperty` magic. The state is a plain JS object created with `structuredClone` on init. You read it with `.get()` and write it with `.set()`. Nothing happens implicitly. This makes debugging trivial — you can `console.log(store.get())` anywhere and see exactly what's stored.

**2. Updates are intentional.**

State never changes on its own. No deep watching, no computed side effects, no auto-run tracking. You call `store.set()` or `store.setKey()` explicitly. Every state change traces back to a single call site. This is the same predictability that makes Redux popular, without the action types, reducers, or dispatch.

**3. Reactivity is opt-in.**

Nothing re-renders unless you explicitly subscribe. `subscribe()` watches everything. `select()` watches a derived value with `Object.is` equality checking. Both return unsubscribe functions. There's no automatic dependency tracking — you decide what to listen to and when to stop.

**4. Events are first-class.**

Most state libraries treat events as an afterthought or push them into middleware. ztore has a built-in event emitter that's as fundamental as state itself. Events carry the current state snapshot automatically — useful for audit logs, WebSocket sync, multi-agent communication, or decoupling producers from consumers without adding another library.

**5. Errors don't cascade.**

If one subscriber or event handler throws, it's caught and logged. Other subscribers still fire. A bug in one listener won't crash the entire store or silence other listeners. This makes ztore resilient in production, especially when third-party code subscribes to your store.

**6. Size matters.**

138 lines. You can read the entire source in one sitting. There are no hidden code paths, no dependency chains, no webpack configs. If there's a bug, you can fix it in the file. If you need a feature, you can add it in 3 lines. If you want to audit it for a security review, you can print it on one page.

## How it works (the 30-second version)

```js
import { createStore } from "ztore";

// Create a store with initial state
const store = createStore({ count: 0, user: null });

// Read state
store.get();  // { count: 0, user: null }

// Update state — every update notifies subscribers
store.set({ count: 1, user: "alice" });

// Update with a function (gets previous state)
store.set((prev) => ({ ...prev, count: prev.count + 1 }));

// Update a single key
store.setKey("count", 5);

// Subscribe to all changes
const unsub = store.subscribe((state, prev) => {
  console.log("changed from", prev, "to", state);
});

// Subscribe to a derived value (skips on no change)
store.select((s) => s.count, (count) => {
  console.log("count is now", count);
});

// Emit and handle custom events
store.on("login", (e) => console.log(e.data.user, "logged in", e.state));
store.emit("login", { user: "alice" });

// Cleanup when done
unsub();
store.destroy();
```

## When to use ztore

ztore fits best when you want:

- **A single-file state solution** — one file, no node_modules required
- **Framework independence** — the same store works in React, Vue, Svelte, Solid, vanilla JS, Node.js, or a Web Worker
- **Auditable code** — you or your security team can read every line in 5 minutes
- **Predictable updates** — explicit `set()` calls with no hidden mutation
- **Decoupled communication** — the event system lets unrelated parts of your app talk without imports or callbacks
- **Multi-agent systems** — state + events maps naturally to agent loops, tool execution, and LLM interaction
- **Small bundles** — 138 lines minified to ~500 bytes, no tree-shaking needed

## When not to use ztore

- **Massive state trees** (10,000+ keys) — ztore does a full state replacement on every `set`. For pathological sizes, consider Immer or a mutable approach with change tracking.
- **You need Proxies** — if you want `store.count = 5` syntax, use Zustand or Valerio. ztore requires method calls.
- **You need time-travel debugging** — ztore doesn't have a devtools middleware. Add it yourself via `subscribe()`.
- **You need strict action typing** — ztore has no TypeScript action unions. Use Zustand or Redux Toolkit if you want `dispatch({ type: "increment" })` patterns.

## The 138-line guarantee

Here's the entire library annotated:

```js
const createStore = (initial) => {
  let state = structuredClone(initial);     // 1: clone initial state
  const listeners = new Set();              // 2: state change subscribers
  const eventSubscribers = new Map();       // 3: event subscribers

  return {
    get()       { return state; },
    set(next)   { /* replace state, notify listeners */ },
    update(fn)  { /* alias for set(fn) */ },
    setKey(k,v) { /* update single key */ },
    subscribe(l, immediate)   { /* add listener, return unsub */ },
    select(sel, cb)           { /* derived value subscription */ },
    on(event, cb)    { /* add event listener */ },
    once(event, cb)  { /* one-shot event listener */ },
    off(e, cb)       { /* remove event listeners */ },
    emit(event,data) { /* fire event */ },
    destroy()   { /* clear everything */ },
  };
};
```

Every method is a plain function. No classes, no `this` binding issues, no prototypes. The store is a closure. This pattern makes it impossible to lose context — you don't need `.bind(store)` or arrow functions in class fields.

## Installation

```
npm install ztore
```

Or for projects that don't use a bundler:

```html
<script type="module">
  import { createStore } from "./ztore.js";
</script>
```

Or copy-paste the file. It's one function. You own it.

## API

### `createStore(initial)`

Creates a new store instance. The `initial` value is deep-cloned with `structuredClone`, so the original object is never mutated.

```js
import { createStore } from "ztore";

const store = createStore({ count: 0, user: null, items: [] });
```

The returned `store` object has 11 methods across 4 categories: **State**, **Reactivity**, **Events**, and **Utils**.

---

### State methods

#### `store.get()`

Returns the current state object. The returned reference changes after every `set()` call — the state is replaced, not mutated.

```js
const state = store.get();
console.log(state.count); // 0
```

> **Note:** `get()` returns the live reference used internally. Mutating the returned object directly will NOT trigger listeners. Always use `set()` to update.

---

#### `store.set(next)`

Replaces the state and notifies all subscribers. Two call signatures:

**Pass an object directly** — replaces state entirely (shallow merge is your responsibility):

```js
store.set({ count: 5, user: "bob", items: [] });
```

**Pass a function** — receives the previous state, must return the new state:

```js
store.set((prev) => ({ ...prev, count: prev.count + 1 }));
```

This is the idiomatic pattern for incrementing counters, toggling booleans, or any update that depends on current state.

**What happens internally:**
1. The previous state is captured as `prev`
2. If `next` is a function, it's called with `prev` and the return value becomes the new state
3. If `next` is not a function, it's used directly as the new state
4. Every subscriber in the listeners set is called with `(newState, prevState)`
5. Errors in individual listeners are caught and logged — one bad listener won't break others

```js
store.set({ count: 1, user: "alice" });
// listeners fire with ({ count: 1, user: "alice" }, { count: 0, user: null })
```

---

#### `store.update(fn)`

Exact alias for `store.set(fn)`. Exists for semantic clarity when you always intend to use an updater function.

```js
store.update((s) => ({ ...s, count: s.count + 1 }));
// identical to: store.set((s) => ({ ...s, count: s.count + 1 }));
```

---

#### `store.setKey(key, value)`

Updates a single key on the state object. Internally calls `store.set()` with an updater function that spreads the previous state and overwrites the specified key.

**Pass a value directly:**

```js
store.setKey("count", 10);
// state becomes { count: 10, user: null, items: [] }
```

**Pass a function** — receives the current value of that key, returns the new value:

```js
store.setKey("count", (n) => n + 1);
// state becomes { count: 11, user: null, items: [] }
```

This is equivalent to:

```js
store.set((s) => ({ ...s, count: typeof value === "function" ? value(s.count) : value }));
```

Useful for deeply nested updates combined with spread:

```js
store.setKey("user", (u) => ({ ...u, name: "new name" }));
```

---

### Reactivity methods

#### `store.subscribe(listener, immediate?)`

Registers a listener that fires on every state change. Returns an unsubscribe function.

**`listener`** is called with `(newState, prevState)` after every `set()`:

```js
const unsub = store.subscribe((state, prev) => {
  console.log("State changed:");
  console.log("  from:", prev);
  console.log("  to:",   state);
});
```

**`immediate`** (default `false`) — if `true`, the listener fires immediately with `(state, state)` on registration:

```js
store.subscribe((state) => {
  render(state);
}, true); // renders immediately, then on every change
```

The returned function unsubscribes the listener:

```js
const unsub = store.subscribe(myListener);
// later:
unsub(); // listener removed
```

> **Edge cases:**
> - Subscribing the same function twice adds it twice; it will fire twice. Use the returned unsubscribe or `listeners.delete()` to remove.
> - If a listener throws, the error is caught and logged. Other listeners still fire.
> - Calling `unsub()` multiple times is safe — `Set.delete()` is a no-op if the item isn't in the set.

---

#### `store.select(selector, callback)`

Subscribes to a *derived value* from state. The `callback` only fires when the selected value *actually changes* (using `Object.is` comparison). Returns an unsubscribe function.

**`selector`** receives the full state and returns a derived value:

```js
store.select(
  (state) => state.count,
  (next, prev) => {
    console.log(`count: ${prev} -> ${next}`);
  }
);
```

**How it works internally:**
1. On registration, calls `selector(currentState)` and stores it as `prev`
2. On every state change, calls `selector(newState)` to get `next`
3. Compares `prev` and `next` with `Object.is(next, prev)`
4. If they differ, calls `callback(next, prev)` and updates `prev = next`
5. If they're the same (e.g., same array reference returned from selector), callback is skipped — preventing unnecessary re-renders

**Use cases:**

```js
// Track a single value
store.select((s) => s.user?.name, (name) => console.log("User:", name));

// Track a computed value
store.select(
  (s) => s.items.reduce((sum, i) => sum + i.price, 0),
  (total) => console.log("Cart total:", total)
);

// Track presence of a key
store.select((s) => s.items.length > 0, (hasItems) => {
  document.getElementById("cart-badge").style.display = hasItems ? "block" : "none";
});
```

> **Important:** The `selector` function itself runs on every state change. If the selector creates a new object/array each time (e.g., `.map()`, `.filter()`, `{ ... }`), `Object.is` will always see a different reference and the callback will fire every time. To avoid this, select primitive values or memoize.

```js
// BAD — new array each time, callback fires on every change
store.select((s) => s.items.map((i) => i.name), callback);

// GOOD — select a primitive that only changes when relevant data changes
store.select((s) => s.items.length, callback);
```

---

### Event methods

ztore has a built-in event emitter that runs alongside the state system. Events and state are independent — you can emit events without changing state, and change state without emitting events. But they share the same store and events carry the current state snapshot.

---

#### `store.on(event, callback)`

Subscribes to a named event. Returns an unsubscribe function.

**`event`** is a string (any format — `"login"`, `"user:created"`, `"ws/message"`, etc.)

**`callback`** receives an event object with three properties:

| Property | Type | Description |
|----------|------|-------------|
| `e.type` | `string` | The event name |
| `e.data` | `any` | The data passed to `emit()` |
| `e.state` | `object` | A snapshot of the store's state at the moment of emission |

```js
const unsub = store.on("login", (e) => {
  console.log(e.type);    // "login"
  console.log(e.data);    // { userId: 42 }
  console.log(e.state);   // { count: 0, user: { id: 42, name: "alice" }, ... }
});

store.emit("login", { userId: 42 });
```

The returned function unsubscribes:

```js
const unsub = store.on("login", handler);
unsub(); // handler will no longer fire
```

> The returned unsubscribe calls `store.off(event, callback)` internally — same as doing it manually.

---

#### `store.once(event, callback)`

Subscribes to an event for a single emission, then automatically removes itself.

```js
store.once("init", (e) => {
  console.log("This runs only once:", e.data);
});

store.emit("init", { phase: 1 }); // callback fires
store.emit("init", { phase: 2 }); // callback does NOT fire
```

Internally, it wraps the callback so that the first invocation calls `off()` then the original callback. Returns an unsubscribe function if you need to cancel before it fires.

---

#### `store.off(event?, callback?))

Removes event listeners. Three levels of granularity:

**Remove a specific handler for an event:**

```js
function onLogin(e) { console.log(e.data); }
store.on("login", onLogin);

store.off("login", onLogin); // only `onLogin` is removed
```

**Remove all handlers for an event:**

```js
store.on("login", handlerA);
store.on("login", handlerB);

store.off("login"); // both handlerA and handlerB removed
```

**Remove ALL handlers for ALL events:**

```js
store.on("login", handlerA);
store.on("logout", handlerB);

store.off(); // everything is cleared
```

> **Edge cases:**
> - Calling `off("nonexistent_event")` is a no-op
> - Calling `off("login", nonExistentHandler)` is a no-op
> - Calling `off()` (no args) clears the entire `eventSubscribers` Map
> - The `once` wrapper uses `off` internally — safe to call `off` on a `once` handler

---

#### `store.emit(event, data)`

Emits a named event. All subscribers for that event are called synchronously with an event object `{ type, data, state }`.

```js
store.emit("notification", { text: "Hello!", level: "info" });
// subscribers receive: { type: "notification", data: { text: "Hello!", level: "info" }, state: {...} }
```

**Behavior:**
- If no subscribers exist for the event, `emit` is a silent no-op
- The `state` in the event object is a live reference to `store.get()` at the time of emission
- Errors in individual subscribers are caught and logged — one bad subscriber won't break others
- Subscribers are called in insertion order

**Pattern — events as commands:**

```js
store.on("reset", () => store.set(initialState));
store.emit("reset"); // triggers state reset
```

**Pattern — events with async side effects:**

```js
store.on("save", async (e) => {
  try {
    await api.save(e.data);
    store.emit("save:success", { id: e.data.id });
  } catch (err) {
    store.emit("save:error", { error: err.message });
  }
});

store.emit("save", { id: 1, text: "hello" });
```

---

### Utility methods

#### `store.destroy()`

Clears all state listeners and all event subscribers. After calling `destroy()`, the store still holds its current state (accessible via `get()`) but no reactivity or event wiring remains.

```js
store.destroy();

// These now do nothing:
store.set({ count: 1 });           // no listeners fire
store.emit("login", {});           // no subscribers fire

// These still work (but are usually useless after destroy):
store.get();                       // still returns the last state
```

Useful for cleanup in component `unmount`, test teardown, or when a store is no longer needed.

---

### Complete API reference table

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `get` | — | `state` | Returns the current state |
| `set` | `next: object \| (prev) => next` | `undefined` | Replace state, notify listeners |
| `update` | `fn: (prev) => next` | `undefined` | Alias for `set(fn)` |
| `setKey` | `key: string, value: any \| (prev) => next` | `undefined` | Update a single key, notify listeners |
| `subscribe` | `listener: (state, prev) => void, immediate?: boolean` | `() => void` | Listen to all state changes |
| `select` | `selector: (state) => any, callback: (next, prev) => void` | `() => void` | Listen to a derived value, skip on no change |
| `on` | `event: string, callback: ({ type, data, state }) => void` | `() => void` | Subscribe to a named event |
| `once` | `event: string, callback: ({ type, data, state }) => void` | `() => void` | Subscribe to one emission |
| `off` | `event?: string, callback?: ({ type, data, state }) => void` | `undefined` | Remove event listeners (3 levels) |
| `emit` | `event: string, data?: any` | `undefined` | Emit a named event |
| `destroy` | — | `undefined` | Clear all listeners and subscribers |

## Real-world examples

### React hook

```jsx
function useStore(store, selector = (s) => s) {
  const [slice, setSlice] = useState(selector(store.get()));

  useEffect(() => store.select(selector, setSlice), []);

  return slice;
}

// Usage
const count = useStore(counterStore, (s) => s.count);
```

### Vanilla JS counter

```js
const store = createStore({ count: 0 });

document.getElementById("inc").onclick = () =>
  store.setKey("count", (n) => n + 1);

store.select((s) => s.count, (count) => {
  document.getElementById("display").textContent = count;
});
```

## What can you build with ztore?

### Frontend apps (React, Vue, Svelte, Solid, etc.)

Wrap `subscribe`/`select` in a framework hook. ztore replaces Redux, Zustand, or Pinia for small-to-medium apps.

- **Global UI state** — theme, sidebar open/closed, modals, toast queue
- **Auth state** — token, user profile, login/logout events
- **Form state** — multi-step forms, field values, validation errors
- **Real-time dashboards** — WebSocket data piped into `store.set()`, UI subscribes to slices

```js
// React hook (see full example above)
const user = useStore(authStore, (s) => s.user);

// Svelte
$: count.subscribe((n) => console.log(n));
```

### Games

Games are state machines at heart. ztore handles game loops, player stats, NPC AI, maps, combat, and dialogue — all through state + events.

#### Core game loop

```js
const game = createStore({
  running: false,
  tick: 0,
  speed: 1,          // 1 = normal, 2 = 2x, 0 = paused
  entities: {},       // id -> { type, x, y, hp, state, ... }
  map: [],            // tile grid
  score: 0,
});

game.on("start", () => game.setKey("running", true));
game.on("pause", () => game.setKey("speed", 0));
game.on("resume", () => game.setKey("speed", 1));

// Game tick — emitted by requestAnimationFrame loop
game.on("tick", (e) => {
  if (game.get().speed === 0) return;
  game.setKey("tick", (t) => t + 1);
  game.emit("update", { dt: e.data.dt * game.get().speed });
});
```

#### Player state

```js
const player = createStore({
  id: "player_1",
  name: "Hero",
  x: 0, y: 0,
  hp: 100, maxHp: 100,
  mp: 50, maxMp: 50,
  xp: 0, level: 1,
  inventory: [],
  gold: 0,
  equipped: { weapon: null, armor: null },
  buffs: [],
  status: "idle",   // idle | walking | attacking | casting | stunned | dead
});

player.on("move", (e) => {
  player.setKey("x", (x) => x + e.data.dx);
  player.setKey("y", (y) => y + e.data.dy);
  player.setKey("status", "walking");
  setTimeout(() => player.setKey("status", "idle"), 200);
});

player.on("damage", (e) => {
  const dmg = Math.max(0, e.data.amount - (player.get().equipped.armor?.defense ?? 0));
  player.setKey("hp", (hp) => Math.max(0, hp - dmg));
  if (player.get().hp <= 0) player.emit("death");
});

player.on("heal", (e) => {
  player.setKey("hp", (hp) => Math.min(player.get().maxHp, hp + e.data.amount));
});

player.on("xp_gain", (e) => {
  const newXp = player.get().xp + e.data.amount;
  const needed = player.get().level * 100;
  if (newXp >= needed) {
    player.setKey("level", (l) => l + 1);
    player.setKey("xp", newXp - needed);
    player.setKey("maxHp", (h) => h + 20);
    player.setKey("hp", (h) => h + 20); // heal on level up
    player.emit("level_up", { level: player.get().level });
  } else {
    player.setKey("xp", newXp);
  }
});

player.on("pickup", (e) => {
  player.setKey("inventory", (inv) => [...inv, { id: crypto.randomUUID(), ...e.data.item }]);
  player.emit("notification", { text: `Picked up ${e.data.item.name}` });
});
```

#### Combat system

```js
const combat = createStore({
  active: false,
  turn: null,          // entity id whose turn it is
  turnOrder: [],
  round: 0,
  log: [],
});

combat.on("start", (e) => {
  const { playerId, enemyIds } = e.data;
  const order = [playerId, ...enemyIds].sort(() => Math.random() - 0.5);
  combat.setKey("active", true);
  combat.setKey("turnOrder", order);
  combat.setKey("turn", order[0]);
  combat.setKey("round", 1);
  combat.emit("turn_start", { entity: order[0] });
});

combat.on("attack", (e) => {
  const { attackerId, targetId, skill } = e.data;
  const attacker = game.get().entities[attackerId];
  const target = game.get().entities[targetId];
  const damage = skill ? skill.damage : attacker.atk;
  const logEntry = `${attacker.name} attacks ${target.name} for ${damage}`;

  combat.setKey("log", (l) => [...l, logEntry]);
  game.emit("damage", { targetId, amount: damage });
  combat.emit("next_turn");
});

combat.on("next_turn", () => {
  const order = combat.get().turnOrder;
  const currentIdx = order.indexOf(combat.get().turn);
  const nextIdx = (currentIdx + 1) % order.length;
  const nextTurn = order[nextIdx];

  if (nextIdx === 0) combat.setKey("round", (r) => r + 1);
  combat.setKey("turn", nextTurn);
  combat.emit("turn_start", { entity: nextTurn });
});
```

#### Inventory & equipment

```js
const inventory = createStore({
  slots: Array(20).fill(null),
  gold: 0,
  weight: 0,
  maxWeight: 50,
});

inventory.on("add", (e) => {
  const idx = inventory.get().slots.findIndex((s) => s === null);
  if (idx === -1) return inventory.emit("full");
  inventory.setKey("slots", (s) => { s[idx] = e.data.item; return s; });
  inventory.setKey("weight", (w) => w + (e.data.item.weight ?? 0));
});

inventory.on("remove", (e) => {
  inventory.setKey("slots", (s) => { s[e.data.index] = null; return s; });
  inventory.setKey("weight", (w) => Math.max(0, w - (e.data.item?.weight ?? 0)));
});

inventory.on("swap", (e) => {
  inventory.setKey("slots", (slots) => {
    const next = [...slots];
    [next[e.data.a], next[e.data.b]] = [next[e.data.b], next[e.data.a]];
    return next;
  });
});

// Reactive weight bar
inventory.select((s) => s.weight / s.maxWeight, (ratio) => {
  document.getElementById("weight-bar").style.width = `${ratio * 100}%`;
});
```

#### NPC behavior system (rule-based agents)

Each NPC is a mini state machine reacting to events.

```js
const npcs = createStore({
  villagers: {
    alice: { x: 10, y: 5, role: "blacksmith", state: "idle", mood: "neutral", queue: [] },
    bob:   { x: 3, y: 8, role: "farmer", state: "idle", mood: "neutral", queue: [] },
  },
  schedule: {},   // time -> task
});

// NPC AI tick
game.on("update", (e) => {
  const hour = Math.floor(game.get().tick / 3600);
  Object.entries(npcs.get().villagers).forEach(([id, npc]) => {
    const task = npcs.get().schedule[`${hour}:${id}`];
    if (task) npc.emit(`${npc.role}:${task}`, { npcId: id });
  });
});

// Blacksmith behavior
npcs.on("blacksmith:work", (e) => {
  npcs.setKey("villagers", (v) => ({
    ...v,
    [e.data.npcId]: { ...v[e.data.npcId], state: "working" },
  }));
  // ... forge items, emit events
});

npcs.on("farmer:harvest", (e) => {
  npcs.setKey("villagers", (v) => ({
    ...v,
    [e.data.npcId]: { ...v[e.data.npcId], state: "harvesting" },
  }));
});
```

#### Dialogue system (branching conversations)

```js
const dialogue = createStore({
  active: false,
  npcId: null,
  currentNode: null,
  history: [],
  variables: {},   // flags that change dialogue paths
});

// Dialogue tree
const dialogues = {
  blacksmith_greet: {
    text: "Need a weapon forged?",
    choices: [
      { text: "Yes, I need a sword", next: "blacksmith_sword" },
      { text: "Not right now", next: "blacksmith_leave" },
      { text: "Tell me about yourself", next: "blacksmith_lore", condition: (vars) => vars.met_blacksmith },
    ],
  },
  blacksmith_sword: {
    text: "A fine choice. Bring me 5 iron ore.",
    choices: [
      { text: "I have the ore!", next: "blacksmith_forge" },
      { text: "I'll come back later", next: "blacksmith_leave" },
    ],
    onEnter: (vars) => ({ ...vars, quest_active: "blacksmith_sword" }),
  },
};

dialogue.on("start", (e) => {
  dialogue.setKey("active", true);
  dialogue.setKey("npcId", e.data.npcId);
  dialogue.setKey("history", []);
  dialogue.emit("show", { nodeId: `${e.data.role}_greet` });
});

dialogue.on("show", (e) => {
  const node = dialogues[e.data.nodeId];
  if (!node) return dialogue.emit("end");

  // Check conditions on choices
  const available = (node.choices ?? []).filter((c) => !c.condition || c.condition(dialogue.get().variables));

  dialogue.setKey("currentNode", { ...node, choices: available, id: e.data.nodeId });
  dialogue.setKey("history", (h) => [...h, e.data.nodeId]);

  if (node.onEnter) {
    dialogue.setKey("variables", node.onEnter);
  }
});

dialogue.on("choose", (e) => {
  const node = dialogue.get().currentNode;
  const choice = node.choices[e.data.index];
  if (!choice) return;

  dialogue.setKey("variables", (v) => ({ ...v, [`chose_${choice.next}`]: true }));
  dialogue.emit("show", { nodeId: choice.next });
});

dialogue.on("end", () => {
  dialogue.setKey("active", false);
  dialogue.setKey("npcId", null);
  dialogue.setKey("currentNode", null);
});
```

#### Quest / objective system

```js
const quests = createStore({
  active: {},       // questId -> { title, description, objectives, rewards, progress }
  completed: [],    // completed quest ids
  log: [],          // full history
});

quests.on("accept", (e) => {
  quests.setKey("active", (q) => ({
    ...q,
    [e.data.id]: {
      ...e.data,
      progress: e.data.objectives.map(() => 0),
      acceptedAt: Date.now(),
    },
  }));
});

quests.on("progress", (e) => {
  quests.setKey("active", (q) => {
    const quest = q[e.data.questId];
    if (!quest) return q;
    const progress = [...quest.progress];
    progress[e.data.objectiveIndex] = Math.min(
      quest.objectives[e.data.objectiveIndex].target,
      progress[e.data.objectiveIndex] + (e.data.amount ?? 1)
    );
    // Check if all objectives complete
    if (progress.every((p, i) => p >= quest.objectives[i].target)) {
      quests.emit("complete", { questId: e.data.questId });
    }
    return { ...q, [e.data.questId]: { ...quest, progress } };
  });
});

quests.on("complete", (e) => {
  const quest = quests.get().active[e.data.questId];
  quests.setKey("active", (q) => { const { [e.data.questId]: _, ...rest } = q; return rest; });
  quests.setKey("completed", (c) => [...c, e.data.questId]);
  quests.setKey("log", (l) => [...l, { ...quest, completedAt: Date.now() }]);
  player.emit("xp_gain", { amount: quest.rewards.xp });
  player.emit("notification", { text: `Quest complete: ${quest.title}` });
});
```

#### Map & tile engine

```js
const map = createStore({
  tiles: [],         // 2D array -> { terrain, entity, explored }
  width: 100,
  height: 100,
  visible: new Set(), // tiles currently on screen
  fogOfWar: true,
  revealed: new Set(),
});

// Reveal tiles around player
player.subscribe((state) => {
  if (!map.get().fogOfWar) return;
  const radius = 5;
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      if (dx * dx + dy * dy <= radius * radius) {
        map.setKey("revealed", (r) => r.add(`${state.x + dx},${state.y + dy}`));
      }
    }
  }
});

// Minimap — reactively render
map.select((s) => [...s.revealed], (revealed) => {
  // draw minimap canvas
});
```

### Agent-based games

Combine game state with AI agents — NPCs driven by LLMs, emergent storytelling, autonomous town simulations.

#### LLM-powered NPC

```js
const npc = createStore({
  id: "merchant_1",
  name: "Old Gregor",
  role: "merchant",
  personality: "grumpy but fair",
  knowledge: "I know the secret entrance to the ancient ruins",
  memory: [],         // conversation history
  state: "idle",      // idle | talking | trading | following
  relationship: 0,    // -100 to 100
  x: 42, y: 18,
  inventory: [
    { name: "Rusty Sword", price: 50 },
    { name: "Healing Potion", price: 30 },
    { name: "Ancient Map", price: 200, questItem: true },
  ],
});

// Player talks to NPC — LLM generates the response
npc.on("talk", async (e) => {
  npc.setKey("state", "talking");
  npc.setKey("memory", (m) => [...m, { role: "player", content: e.data.message }]);

  const response = await callLLM({
    system: `You are ${npc.get().name}, a ${npc.get().personality} ${npc.get().role}.
             You know: ${npc.get().knowledge}.
             Relationship: ${npc.get().relationship}.
             Inventory: ${JSON.stringify(npc.get().inventory)}.`,
    messages: npc.get().memory,
  });

  npc.setKey("memory", (m) => [...m, { role: "npc", content: response }]);
  npc.setKey("state", "idle");
  npc.emit("said", { npcId: npc.get().id, text: response });
});
```

#### Autonomous town simulation

Each villager has needs, a job, relationships, and makes decisions through events.

```js
const town = createStore({
  time: { hour: 6, day: 1, season: "spring" },
  villagers: {
    gregor:  { job: "merchant",  home: "shop_1", energy: 100, hunger: 0, social: 50, gold: 200 },
    elara:   { job: "farmer",    home: "house_2", energy: 100, hunger: 0, social: 50, gold: 50 },
    finn:    { job: "guard",     home: "barracks", energy: 100, hunger: 0, social: 50, gold: 100 },
  },
  buildings: {
    shop_1: { type: "shop", x: 5, y: 5, owner: "gregor", stock: {} },
    house_2: { type: "house", x: 8, y: 3, owner: "elara" },
    barracks: { type: "guard", x: 2, y: 9 },
  },
  relationships: {},    // "villager1:villager2" -> score
  rumors: [],
});

// Time tick — advances town simulation
town.on("advance_hour", () => {
  town.setKey("time", (t) => {
    const hour = t.hour + 1;
    const day = hour >= 24 ? t.day + 1 : t.day;
    const season = day > 90 ? "summer" : t.season;
    return { hour: hour % 24, day, season };
  });
  town.emit("villager_tick"); // each villager decides what to do
});

// Villager decision-making based on needs
town.on("villager_tick", () => {
  const hour = town.get().time.hour;
  town.setKey("villagers", (v) => {
    const next = {};
    for (const [id, villager] of Object.entries(v)) {
      // Increase hunger, decrease energy over time
      let energy = Math.max(0, villager.energy - 2);
      let hunger = Math.min(100, villager.hunger + 3);
      let gold = villager.gold;
      let social = Math.max(0, villager.social - 1);

      // Decision based on needs and time
      if (hour >= 6 && hour <= 18 && villager.job === "farmer") {
        // Go farming
        town.emit("villager:work", { id, job: "farmer" });
        gold += 10;
      } else if (villager.hunger > 70) {
        town.emit("villager:eat", { id });
        hunger = 0;
        gold -= 5;
      } else if (villager.social < 20) {
        town.emit("villager:socialize", { id });
        social = 100;
      } else if (hour >= 22) {
        town.emit("villager:sleep", { id });
        energy = 100;
      }

      next[id] = { ...villager, energy, hunger, social, gold };
    }
    return next;
  });
});

// React to events — two villagers meeting affects relationships
town.on("villager:socialize", (e) => {
  const others = Object.keys(town.get().villagers).filter((id) => id !== e.data.id);
  const partner = others[Math.floor(Math.random() * others.length)];
  const pair = [e.data.id, partner].sort().join(":");
  town.setKey("relationships", (r) => ({
    ...r,
    [pair]: (r[pair] ?? 50) + Math.floor(Math.random() * 10) - 2,
  }));
  town.setKey("rumors", (rumors) => [
    ...rumors.slice(-20),
    `${e.data.id} was seen talking to ${partner}`,
  ]);
});
```

#### Rumor & event propagation

```js
town.on("villager:work", (e) => {
  if (Math.random() < 0.1) { // 10% chance of notable event
    const events = [
      `${e.data.id} found a strange artifact while farming`,
      `${e.data.id} saw something moving in the dark`,
      `${e.data.id} heard strange noises from the old mine`,
    ];
    const rumor = events[Math.floor(Math.random() * events.length)];
    town.setKey("rumors", (r) => [...r.slice(-30), rumor]);
    // Narratively important rumors can become quests
    if (rumor.includes("artifact") || rumor.includes("old mine")) {
      quests.emit("generate", { rumor, source: e.data.id });
    }
  }
});
```

#### LLM Game Master agent

```js
const gm = createStore({
  active: false,
  story: [],
  worldState: {},
  pendingChoice: null,
  playerAction: null,
});

gm.on("narrate", async (e) => {
  gm.setKey("active", true);
  const context = {
    story: gm.get().story.slice(-10),
    worldState: gm.get().worldState,
    playerAction: e.data.action,
    npcs: Object.values(town.get().villagers).map((v) => ({ name: v.id, job: v.job })),
    rumors: town.get().rumors.slice(-5),
  };

  const response = await callLLM({
    system: `You are a game master. Narrate the world in response to player actions.
             Keep the story moving. Offer 2-3 clear choices at the end.`,
    messages: [{ role: "user", content: JSON.stringify(context) }],
  });

  gm.setKey("story", (s) => [...s, { role: "gm", content: response }]);
  gm.setKey("pendingChoice", extractChoices(response));
  gm.emit("narrated", { text: response });
});

gm.on("player_choice", (e) => {
  gm.setKey("pendingChoice", null);
  gm.setKey("playerAction", e.data.choice);
  // The choice changes world state
  gm.setKey("worldState", (ws) => ({
    ...ws,
    lastChoice: e.data.choice,
    turn: (ws.turn ?? 0) + 1,
  }));
  // Advance the simulation
  town.emit("advance_hour");
  gm.emit("narrate", { action: e.data.choice });
});
```

#### Agent vs agent combat (auto-battler)

```js
const autoBattle = createStore({
  teams: {
    player: [{ id: "warrior", hp: 100, atk: 15, def: 10, speed: 8, ability: "power_strike" }],
    enemy:  [{ id: "goblin_1", hp: 40, atk: 8, def: 3, speed: 12 },
             { id: "goblin_2", hp: 35, atk: 9, def: 2, speed: 14 }],
  },
  round: 0,
  log: [],
  winner: null,
});

autoBattle.on("tick", () => {
  const { teams, round } = autoBattle.get();
  if (autoBattle.get().winner) return;

  autoBattle.setKey("round", (r) => r + 1);

  // Each agent decides its action
  const allUnits = [...teams.player, ...teams.enemy]
    .sort((a, b) => b.speed - a.speed);

  for (const unit of allUnits) {
    const enemies = teams.player.includes(unit) ? teams.enemy : teams.player;
    if (enemies.every((e) => e.hp <= 0)) {
      autoBattle.setKey("winner", teams.player.includes(unit) ? "player" : "enemy");
      return;
    }

    const target = enemies.filter((e) => e.hp > 0)
      .sort((a, b) => a.hp - b.hp)[0]; // target lowest HP

    const damage = Math.max(1, unit.atk - target.def + Math.floor(Math.random() * 5));
    const logEntry = `${unit.id} attacks ${target.id} for ${damage}`;
    autoBattle.setKey("log", (l) => [...l, logEntry]);

    // Update HP in teams
    autoBattle.setKey("teams", (t) => {
      const teamKey = t.player.includes(target) ? "player" : "enemy";
      return {
        ...t,
        [teamKey]: t[teamKey].map((u) =>
          u.id === target.id ? { ...u, hp: u.hp - damage } : u
        ),
      };
    });
  }
});

// Reactive health bars
autoBattle.select(
  (s) => [...s.teams.player, ...s.teams.enemy].map((u) => ({ id: u.id, hp: u.hp })),
  (units) => units.forEach((u) => {
    document.getElementById(`hp-${u.id}`).style.width = `${u.hp}%`;
  })
);
```

#### Agent-driven economy

```js
const economy = createStore({
  resources: { wood: 500, stone: 300, food: 200, gold: 1000 },
  prices: { wood: 2, stone: 5, food: 3 },
  agents: {
    lumberjack: { count: 3, rate: 10, cost: { food: 2 } },
    miner:      { count: 2, rate: 8, cost: { food: 3 } },
    farmer:     { count: 2, rate: 15, cost: {} },
  },
  orders: [],      // agent orders (buy/sell)
});

economy.on("tick", () => {
  // Each agent produces resources
  economy.setKey("resources", (r) => {
    const agents = economy.get().agents;
    return {
      wood: r.wood + agents.lumberjack.count * agents.lumberjack.rate,
      stone: r.stone + agents.miner.count * agents.miner.rate,
      food: r.food + agents.farmer.count * agents.farmer.rate,
      gold: r.gold,
    };
  });

  // Agents consume food
  const totalWorkers = Object.values(economy.get().agents).reduce((s, a) => s + a.count, 0);
  economy.setKey("resources", (r) => ({ ...r, food: Math.max(0, r.food - totalWorkers * 2) }));
});

### Multi-tab / WebSocket sync

The event system is a natural fit for bidirectional sync.

- **WebSocket messages** → `store.emit("ws:message", data)` → listeners update state
- **State changes** → serialize and push upstream
- **Cross-tab sync** — `BroadcastChannel` + ztore events keep tabs in sync

```js
const ws = new WebSocket("wss://example.com");

ws.onmessage = (msg) => {
  const { event, data } = JSON.parse(msg.data);
  store.emit(event, data);
};
```

### Mini Pub/Sub event bus

Use ztore purely as an event system — no state required.

```js
const bus = createStore({}); // state irrelevant, just use events

bus.on("user:created", (e) => analytics.track(e.data));
bus.on("user:created", (e) => sendWelcomeEmail(e.data));
bus.emit("user:created", { id: 1, email: "a@b.com" });
```

### IoT / hardware state

- **Sensor readings** — temperature, humidity, pressure as state keys
- **Alarms** — thresholds emit alerts as events
- **Device state machine** — idle → running → error → idle

```js
const sensor = createStore({ temp: 22, humid: 55, status: "idle" });

sensor.select(
  (s) => s.temp,
  (temp) => { if (temp > 40) sensor.emit("overheat", { temp }); }
);
```

### CLI tools & Node services

- **Config state** — parsed flags + config file merged into store
- **Pipeline state** — stages emit events (`build:start`, `build:done`, `build:error`)
- **Plugin systems** — plugins subscribe to events, emit their own

```js
const pipeline = createStore({ stage: "init", errors: [] });

pipeline.on("build:error", (e) => {
  pipeline.setKey("errors", (errs) => [...errs, e.data]);
  console.error("Build failed:", e.data);
});
```

### Undo / Redo (trivial to add)

Since `set` passes `prev` to every listener, you can build an undo stack:

```js
const history = [];
store.subscribe((state, prev) => history.push(prev));

function undo() {
  const prev = history.pop();
  if (prev) store.set(prev);
}
```

### Testing

The `select` API with `Object.is` equality makes component testing predictable — no flaky re-renders. Mock a store, assert on `emit` calls, snapshot state after actions.

### State machines & workflow engines

ztore's state + events maps one-to-one to finite state machines.

```js
const checkout = createStore({ step: "cart", orderId: null, paid: false });

const transitions = {
  cart:    { to: "shipping" },
  shipping: { to: "payment" },
  payment:  { to: "confirm" },
  confirm:  { to: "done" },
};

checkout.on("next", () => {
  const current = checkout.get().step;
  const next = transitions[current]?.to;
  if (next) checkout.setKey("step", next);
});

checkout.on("back", () => {
  // reverse lookup previous step
});
```

### E-commerce cart

```js
const cart = createStore({ items: [], coupon: null, notes: "" });

cart.on("add", (e) => {
  cart.setKey("items", (items) => [...items, { ...e.data, id: Date.now() }]);
});

cart.on("remove", (e) => {
  cart.setKey("items", (items) => items.filter((i) => i.id !== e.data.id));
});

cart.on("apply_coupon", (e) => {
  cart.setKey("coupon", e.data.code);
});

// Reactive totals
cart.select(
  (s) => s.items.reduce((sum, i) => sum + i.price * i.qty, 0),
  (total) => console.log("Cart total:", total)
);
```

### Real-time collaboration

Track presence, cursors, and document state across users.

```js
const collab = createStore({
  document: { text: "", version: 0 },
  users: {},      // userId -> { name, color, cursor }
  cursors: {},    // userId -> { line, col }
});

// Local user moves cursor
collab.setKey("cursors", (c) => ({ ...c, [myId]: { line, col } }));

// Remote user joins
collab.setKey("users", (u) => ({ ...u, [userId]: { name, color } }));
collab.emit("user:join", { userId, name });

// Broadcast state over WebRTC / WebSocket
collab.subscribe((state) => channel.send(JSON.stringify(state)));
```

### Media player

```js
const player = createStore({
  playlist: [],
  currentIndex: 0,
  playing: false,
  volume: 0.8,
  progress: 0,
  shuffle: false,
  repeat: "off", // off | one | all
});

player.on("play", () => player.setKey("playing", true));
player.on("pause", () => player.setKey("playing", false));
player.on("next", () => {
  player.setKey("currentIndex", (i) => (i + 1) % player.get().playlist.length);
});
player.on("seek", (e) => player.setKey("progress", e.data.position));
```

### Drawing / canvas app

```js
const canvas = createStore({
  tool: "pen",        // pen | eraser | rectangle | circle
  color: "#000",
  strokeWidth: 2,
  layers: [{ name: "Layer 1", strokes: [] }],
  activeLayer: 0,
  history: [],
});

canvas.on("stroke:end", (e) => {
  canvas.setKey("layers", (layers) => {
    const next = [...layers];
    next[canvas.get().activeLayer] = {
      ...next[canvas.get().activeLayer],
      strokes: [...next[canvas.get().activeLayer].strokes, e.data],
    };
    return next;
  });
  canvas.setKey("history", (h) => [...h, e.data]);
});

canvas.on("undo", () => {
  const last = canvas.get().history.pop();
  if (last) canvas.emit("stroke:remove", last);
});
```

### Form builder (dynamic forms)

```js
const formBuilder = createStore({
  fields: [],
  selectedField: null,
  validation: {},
});

formBuilder.on("field:add", (e) => {
  formBuilder.setKey("fields", (f) => [...f, { id: crypto.randomUUID(), ...e.data }]);
});

formBuilder.on("field:move", (e) => {
  // reorder fields array
  formBuilder.setKey("fields", (fields) => {
    const next = [...fields];
    const [removed] = next.splice(e.data.from, 1);
    next.splice(e.data.to, 0, removed);
    return next;
  });
});

// Conditional visibility — reactively show/hide fields
formBuilder.select(
  (s) => s.fields.filter((f) => {
    const rule = s.validation[f.id];
    return !rule || rule.condition(s.fields);
  }),
  (visible) => render(visible)
);
```

### Feature flags & A/B testing

```js
const flags = createStore({
  features: {
    dark_mode: true,
    new_checkout: false,
    ai_recommendations: true,
  },
  experiments: {
    signup_btn_color: { variant: "blue", users: [] },
  },
  overrides: {}, // per-user overrides
});

flags.on("toggle", (e) => {
  flags.setKey("features", (f) => ({ ...f, [e.data.flag]: !f[e.data.flag] }));
  flags.emit("changed", { flag: e.data.flag });
});

// React to flag changes
flags.select((s) => s.features.dark_mode, (enabled) => {
  document.documentElement.classList.toggle("dark", enabled);
});
```

### Offline queue & sync

```js
const sync = createStore({
  queue: [],
  syncing: false,
  lastSync: null,
  conflicts: [],
});

sync.on("enqueue", (e) => {
  sync.setKey("queue", (q) => [...q, { ...e.data, id: Date.now(), retries: 0 }]);
});

sync.on("flush", async () => {
  if (sync.get().syncing) return;
  sync.setKey("syncing", true);

  for (const item of sync.get().queue) {
    try {
      await fetch("/api/sync", { method: "POST", body: JSON.stringify(item) });
      sync.setKey("queue", (q) => q.filter((i) => i.id !== item.id));
    } catch (err) {
      sync.emit("conflict", { item, error: err.message });
    }
  }

  sync.setKey("syncing", false);
  sync.setKey("lastSync", Date.now());
});
```

### Animation timeline

```js
const anim = createStore({
  timeline: [],       // [{ selector, keyframes, duration, delay, easing }]
  playing: false,
  currentTime: 0,
  speed: 1,
  loop: false,
});

anim.on("play", () => anim.setKey("playing", true));
anim.on("pause", () => anim.setKey("playing", false));
anim.on("tick", (e) => {
  anim.setKey("currentTime", (t) => t + e.data.dt * anim.get().speed);
  // evaluate keyframe interpolations at currentTime
});
```

### Payment / checkout flow

```js
const payment = createStore({
  step: "method",       // method | details | confirm | processing | done | error
  method: null,
  amount: 0,
  error: null,
  retries: 0,
});

payment.on("select:method", (e) => {
  payment.setKey("method", e.data.method);
  payment.setKey("step", "details");
});

payment.on("submit", async () => {
  payment.setKey("step", "processing");
  try {
    const result = await fetch("/api/pay", { method: "POST", body: JSON.stringify(payment.get()) });
    if (!result.ok) throw new Error(await result.text());
    payment.setKey("step", "done");
  } catch (err) {
    payment.setKey("error", err.message);
    payment.setKey("retries", (r) => r + 1);
    payment.setKey("step", "error");
  }
});
```

### Onboarding / product tour

```js
const tour = createStore({
  active: false,
  currentStep: 0,
  steps: [
    { target: "#sidebar", title: "Welcome!", text: "This is the sidebar" },
    { target: "#editor", title: "Write code", text: "Type your code here" },
    { target: "#preview", title: "See results", text: "Live preview" },
  ],
  completed: false,
  skipped: false,
});

tour.on("next", () => {
  const next = tour.get().currentStep + 1;
  if (next >= tour.get().steps.length) {
    tour.setKey("completed", true);
    tour.setKey("active", false);
  } else {
    tour.setKey("currentStep", next);
  }
});

tour.on("skip", () => tour.setKey("skipped", true));
tour.on("reset", () => tour.setKey("currentStep", 0));
```

### WebRTC / video call state

```js
const call = createStore({
  status: "idle",        // idle | calling | ringing | connected | ended
  localStream: null,
  remoteStream: null,
  participants: [],
  audioMuted: false,
  videoMuted: false,
  screenSharing: false,
});

call.on("toggle:audio", () => call.setKey("audioMuted", (m) => !m));
call.on("toggle:video", () => call.setKey("videoMuted", (m) => !m));
call.on("toggle:screenshare", () => call.setKey("screenSharing", (s) => !s));
call.on("participant:join", (e) => {
  call.setKey("participants", (p) => [...p, e.data]);
});
```

### Database state & caching

ztore works with any database — SQLite, PostgreSQL, MySQL, IndexedDB, Supabase, Firebase, you name it. It manages the *client-side* state around your database operations.

#### Query result cache

```js
const db = createStore({
  queries: {},        // queryKey -> { data, loading, error, lastFetched }
  mutations: [],      // pending write queue
  subscriptions: [],  // active realtime subs
});

// Cache a query result
db.on("query:success", (e) => {
  db.setKey("queries", (q) => ({
    ...q,
    [e.data.key]: { data: e.data.result, loading: false, error: null, lastFetched: Date.now() },
  }));
});

// Deduplicate concurrent requests for the same query
db.on("query:request", async (e) => {
  const existing = db.get().queries[e.data.key];
  if (existing && Date.now() - existing.lastFetched < 30_000) {
    return; // serve from cache
  }
  db.setKey("queries", (q) => ({ ...q, [e.data.key]: { ...q[e.data.key], loading: true } }));
  // ... fetch from DB, emit query:success or query:error
});
```

#### Optimistic updates (write-then-sync)

```js
const todos = createStore({ items: [], dirty: new Set() });

todos.on("add", async (e) => {
  const item = { id: crypto.randomUUID(), text: e.data.text, done: false };

  // Optimistic — update UI immediately
  todos.setKey("items", (items) => [...items, item]);
  todos.setKey("dirty", (d) => d.add(item.id));

  try {
    await db.query("INSERT INTO todos (id, text) VALUES ($1, $2)", [item.id, item.text]);
    todos.setKey("dirty", (d) => { d.delete(item.id); return d; });
  } catch (err) {
    // Revert on failure
    todos.setKey("items", (items) => items.filter((i) => i.id !== item.id));
    todos.emit("error", { operation: "add", item, error: err.message });
  }
});
```

#### Mutation queue (offline-first)

```js
const sync = createStore({ queue: [], online: navigator.onLine });

sync.on("mutate", (e) => {
  sync.setKey("queue", (q) => [...q, { ...e.data, ts: Date.now() }]);
});

sync.on("online", async () => {
  sync.setKey("online", true);
  for (const op of sync.get().queue) {
    try {
      await fetch("/api/sync", { method: "POST", body: JSON.stringify(op) });
      sync.setKey("queue", (q) => q.filter((i) => i.ts !== op.ts));
    } catch (err) {
      sync.emit("conflict", { op, error: err.message });
    }
  }
});

window.addEventListener("online", () => sync.emit("online"));
```

#### CRUD form state

```js
const form = createStore({
  mode: "create",        // create | edit | view
  original: null,        // snapshot of DB row when editing
  fields: {},
  errors: {},
  saving: false,
  touched: new Set(),
});

form.on("load", (e) => {
  const row = e.data;
  form.setKey("mode", "edit");
  form.setKey("original", structuredClone(row));
  form.setKey("fields", structuredClone(row));
});

form.on("save", async () => {
  form.setKey("saving", true);
  try {
    if (form.get().mode === "create") {
      await db.query("INSERT INTO ...", [form.get().fields]);
    } else {
      await db.query("UPDATE ... WHERE id = $1", [form.get().fields.id, form.get().fields]);
    }
    form.setKey("saving", false);
    form.emit("saved", form.get().fields);
  } catch (err) {
    form.setKey("errors", { general: err.message });
    form.setKey("saving", false);
  }
});

// Track dirty state
form.select(
  (s) => s.mode === "edit" && JSON.stringify(s.fields) !== JSON.stringify(s.original),
  (dirty) => console.log(dirty ? "unsaved changes" : "clean")
);
```

#### Pagination & infinite scroll

```js
const page = createStore({
  endpoint: "/api/users",
  page: 1,
  perPage: 20,
  data: [],
  total: 0,
  loading: false,
  hasMore: true,
});

page.on("load", async () => {
  if (page.get().loading || !page.get().hasMore) return;
  page.setKey("loading", true);

  const { page: p, perPage, endpoint } = page.get();
  const res = await fetch(`${endpoint}?_page=${p}&_limit=${perPage}`);
  const total = parseInt(res.headers.get("X-Total-Count") ?? "0");
  const items = await res.json();

  page.setKey("data", (d) => [...d, ...items]);
  page.setKey("total", total);
  page.setKey("page", (n) => n + 1);
  page.setKey("hasMore", page.get().data.length < total);
  page.setKey("loading", false);
});

page.on("refresh", () => {
  page.setKey("data", []);
  page.setKey("page", 1);
  page.setKey("hasMore", true);
  page.emit("load");
});
```

#### Connection & migration state

```js
const conn = createStore({
  connected: false,
  url: null,
  poolSize: 0,
  activeConnections: 0,
  latency: 0,
  migrations: {
    pending: [],
    executed: [],
    lastRun: null,
  },
});

conn.on("connect", (e) => {
  conn.setKey("connected", true);
  conn.setKey("url", e.data.url);
  conn.setKey("poolSize", e.data.poolSize);
});

conn.on("migrate", async () => {
  const pending = conn.get().migrations.pending;
  if (!pending.length) return;

  for (const migration of pending) {
    try {
      await runMigration(migration);
      conn.setKey("migrations", (m) => ({
        pending: m.pending.filter((p) => p.id !== migration.id),
        executed: [...m.executed, { ...migration, executedAt: Date.now() }],
        lastRun: Date.now(),
      }));
      conn.emit("migration:done", { id: migration.id, name: migration.name });
    } catch (err) {
      conn.emit("migration:error", { id: migration.id, error: err.message });
      break;
    }
  }
});
```

#### Real-time DB subscriptions (Supabase, Postgres LISTEN/NOTIFY, Firebase)

```js
const realtime = createStore({
  channels: {},    // channelName -> { status: "subscribed" | "error", lastEvent: null }
  changes: [],     // recent row changes
});

// Supabase example
realtime.on("subscribe", (e) => {
  const { channel, table, filter } = e.data;
  const sub = supabase
    .channel(channel)
    .on("postgres_changes", { event: "*", schema: "public", table, filter },
      (payload) => {
        realtime.setKey("changes", (c) => [payload, ...c].slice(0, 100));
        realtime.emit("change", payload);
      }
    )
    .subscribe((status) => {
      realtime.setKey("channels", (ch) => ({ ...ch, [channel]: { status, lastEvent: null } }));
    });
});

// Postgres LISTEN example
const pg = new pgClient();
pg.on("notification", (msg) => {
  realtime.emit("notification", { channel: msg.channel, payload: JSON.parse(msg.payload) });
});
await pg.query("LISTEN table_changes");
```

#### Query builder state

```js
const builder = createStore({
  table: null,
  select: ["*"],
  where: [],
  orderBy: [],
  limit: 50,
  offset: 0,
  joins: [],
  raw: "",
});

// Build SQL reactively
builder.select(
  (s) => {
    let sql = `SELECT ${s.select.join(", ")} FROM ${s.table}`;
    s.joins.forEach((j) => { sql += ` ${j.type} JOIN ${j.table} ON ${j.on}`; });
    s.where.forEach((w, i) => { sql += i === 0 ? " WHERE" : " AND"; sql += ` ${w.column} ${w.op} $${i + 1}`; });
    if (s.orderBy.length) sql += ` ORDER BY ${s.orderBy.map((o) => `${o.column} ${o.dir}`).join(", ")}`;
    sql += ` LIMIT ${s.limit} OFFSET ${s.offset}`;
    return sql;
  },
  (sql) => builder.setKey("raw", sql)
);

builder.on("execute", async () => {
  const sql = builder.get().raw;
  const params = builder.get().where.map((w) => w.value);
  const result = await db.query(sql, params);
  builder.emit("result", result.rows);
});
```

### SPA framework (routing + views + lifecycle)

ztore is not a framework, but its state + events are enough to build an SPA framework-like system — client-side routing, view swapping, navigation guards, and lifecycle hooks — all in ~50 lines on top of ztore.

#### Router state

```js
const router = createStore({
  current: { path: "/", params: {}, query: {} },
  previous: null,
  routes: [],
  history: [],
  guards: [],
});
```

#### Route registry

```js
router.setKey("routes", [
  { path: "/",          view: "home",    data: { title: "Home" } },
  { path: "/about",     view: "about",   data: { title: "About" } },
  { path: "/users/:id", view: "profile", data: { title: "Profile" } },
  { path: "/settings",  view: "settings", data: { title: "Settings", guard: "auth" } },
]);
```

#### Pattern matching

```js
function matchRoute(path, routes) {
  for (const route of routes) {
    const parts = route.path.split("/");
    const input = path.split("/");
    if (parts.length !== input.length) continue;

    const params = {};
    let match = true;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith(":")) params[parts[i].slice(1)] = input[i];
      else if (parts[i] !== input[i]) { match = false; break; }
    }
    if (match) return { ...route, params };
  }
  return null;
}
```

#### Navigation with guards

```js
router.on("navigate", async (e) => {
  const { path } = e.data;
  const matched = matchRoute(path, router.get().routes);
  if (!matched) return router.emit("not_found", { path });

  // Run guards
  if (matched.guard) {
    const guardPassed = await router.emit("guard:" + matched.guard, { to: matched, from: router.get().current });
    // guard handler calls preventDefault equivalent by emitting "guard:fail"
  }

  const prev = router.get().current;

  // Lifecycle: leave current view
  router.emit("view:leave", { from: prev });

  router.setKey("previous", prev);
  router.setKey("current", { path, ...matched });
  router.setKey("history", (h) => [...h, { path, ts: Date.now() }]);

  // Lifecycle: enter new view
  router.emit("view:enter", { to: router.get().current });

  // Update URL
  history.pushState(null, "", path);
});
```

#### Auth guard

```js
router.on("guard:auth", (e) => {
  const isLoggedIn = !!authStore.get().user;
  if (!isLoggedIn) {
    router.emit("navigate", { path: "/login" });
    // prevent original navigation
  }
});
```

#### View renderer (reactive)

```js
const app = createStore({ content: null });

router.select(
  (s) => s.current,
  (route) => {
    // Map view name to render function
    const views = {
      home: () => "<h1>Home</h1><p>Welcome</p>",
      about: () => "<h1>About</h1><p>This is ztore SPA</p>",
      profile: (params) => `<h1>User ${params.id}</h1>`,
      settings: () => "<h1>Settings</h1><form>...</form>",
    };

    const render = views[route.view];
    if (render) app.setKey("content", render(route.params));
  }
);

// Mount
app.subscribe((s) => {
  document.getElementById("app").innerHTML = s.content;
}, true);
```

#### Layout system

```js
const layout = createStore({
  header: true,
  sidebar: true,
  footer: true,
  sidebarView: null,
});

// Certain routes hide the sidebar
router.select((s) => s.current?.path, (path) => {
  layout.setKey("sidebar", !["/login", "/register"].includes(path));
});
```

#### Link component

```js
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-link]");
  if (!link) return;
  e.preventDefault();
  router.emit("navigate", { path: link.getAttribute("href") });
});
```

```html
<a href="/users/42" data-link>Profile</a>
```

#### Lazy-loaded routes

```js
router.on("view:enter", async (e) => {
  const { view } = e.data.to;
  if (view === "settings") {
    // Lazy load settings module
    const module = await import("./views/settings.js");
    views.settings = module.render;
  }
});
```

#### 404 handling

```js
router.on("not_found", (e) => {
  app.setKey("content", `<h1>404</h1><p>${e.data.path} not found</p>`);
  document.title = "404 - Not Found";
});
```

#### History back/forward

```js
window.addEventListener("popstate", () => {
  router.emit("navigate", { path: location.pathname });
});
```

This gives you the core of an SPA framework — routing, guards, layouts, lazy loading, reactive rendering — using just ztore as the backbone. No extra dependencies.

### AI agents & harnesses

ztore is a natural fit for AI agent architectures — the state + events model maps directly to how agents think, act, and communicate.

#### Agent memory & context

Store the agent's full context — system prompt, conversation history, tool results, working memory.

```js
const agent = createStore({
  task: null,
  messages: [],
  context: {},
  tools: [],
  status: "idle", // idle | thinking | waiting_tool | done | error
});

agent.on("tool:call", (e) => {
  agent.setKey("status", "waiting_tool");
  agent.setKey("messages", (msgs) => [
    ...msgs,
    { role: "assistant", tool_call: e.data },
  ]);
});

agent.on("tool:result", (e) => {
  agent.setKey("messages", (msgs) => [
    ...msgs,
    { role: "tool", result: e.data },
  ]);
  agent.setKey("status", "thinking");
});
```

#### Agent harness / loop

Drive the think-act-observe loop through state and events.

```js
async function agentLoop(store) {
  while (true) {
    if (store.get().status === "done") break;

    store.emit("think");               // LLM decides next action
    const action = await waitForAction(store);
    store.emit("act", action);         // execute tool or respond
    store.emit("observe", result);     // feed result back
  }
}

const harness = createStore({ cycle: 0, status: "running" });

harness.on("think", () => harness.setKey("cycle", (n) => n + 1));
harness.on("act", (e) => console.log("Action:", e.data));
harness.on("observe", (e) => console.log("Result:", e.data));
```

#### Multi-agent orchestration

Share a ztore instance across agents for coordination.

```js
const coordinator = createStore({
  agents: {},
  queue: [],
  results: [],
});

// Agent A registers
coordinator.setKey("agents", (a) => ({ ...a, researcher: "idle" }));

// Agent B listens for research tasks
coordinator.on("task:research", (e) => {
  coordinator.setKey("agents", (a) => ({ ...a, researcher: "busy" }));
  // ... do research ...
  coordinator.setKey("agents", (a) => ({ ...a, researcher: "idle" }));
  coordinator.emit("task:done", { agent: "researcher", result });
});
```

#### Tool-use harness

Track available tools, upcoming calls, and results reactively.

```js
const toolHarness = createStore({
  tools: [
    { name: "search", fn: async (q) => fetch(`/search?q=${q}`) },
    { name: "calc", fn: async (expr) => eval(expr) },
  ],
  pendingCall: null,
  history: [],
});

toolHarness.on("execute", async (e) => {
  const { name, args } = e.data;
  toolHarness.setKey("pendingCall", { name, args });

  const tool = toolHarness.get().tools.find((t) => t.name === name);
  if (!tool) return toolHarness.emit("error", { name, error: "unknown tool" });

  const result = await tool.fn(args);
  toolHarness.setKey("history", (h) => [...h, { name, args, result }]);
  toolHarness.setKey("pendingCall", null);
  toolHarness.emit("result", { name, result });
});
```

#### LLM conversation manager

```js
const chat = createStore({
  messages: [],
  tokenCount: 0,
  maxTokens: 4096,
});

chat.on("user:message", (e) => {
  chat.setKey("messages", (msgs) => [...msgs, { role: "user", content: e.data }]);
  chat.setKey("tokenCount", (t) => t + estimateTokens(e.data));
});

chat.on("truncate", () => {
  if (chat.get().tokenCount > chat.get().maxTokens) {
    // Summarize oldest messages
  }
});
```

## How to build an AI agent (step by step)

This walkthrough builds a working AI agent with tool-use from scratch using ztore.

### 1. Define the agent state

Start with what the agent knows and tracks.

```js
import { createStore } from "./ztore.js";

const agent = createStore({
  status: "idle",          // idle | thinking | waiting | done
  messages: [],            // full LLM conversation
  memory: {},              // persistent knowledge
  pendingTool: null,       // tool currently being executed
  toolHistory: [],         // past tool calls & results
  error: null,
});
```

### 2. Define available tools

Tools are just async functions registered in state.

```js
const tools = {
  weather: async (city) => {
    const res = await fetch(`https://wttr.in/${city}?format=%C+%t`);
    return res.text();
  },
  calculator: async (expr) => {
    // safe eval for math expressions
    const allowed = /^[\d\s+\-*/().,]+$/;
    if (!allowed.test(expr)) return "Invalid expression";
    return Function(`"use strict"; return (${expr})`)();
  },
  notes: {
    _store: {},
    read: async (key) => notes._store[key] ?? "not found",
    write: async (key, val) => { notes._store[key] = val; return "saved"; },
  },
};

agent.setKey("tools", Object.keys(tools));
```

### 3. Hook up the LLM call

When the agent needs to "think", emit an event that triggers the LLM.

```js
agent.on("think", async () => {
  agent.setKey("status", "thinking");

  const response = await callLLM({
    messages: [
      { role: "system", content: "You have tools: weather, calculator, notes." },
      ...agent.get().messages,
    ],
    tools: agent.get().tools,
  });

  if (response.tool_call) {
    agent.emit("execute", response.tool_call);
  } else {
    agent.setKey("messages", (m) => [...m, { role: "assistant", content: response.text }]);
    agent.setKey("status", "done");
  }
});
```

### 4. Execute tools reactively

When the LLM requests a tool, the `execute` event runs it and feeds the result back.

```js
agent.on("execute", async (e) => {
  const { name, args } = e.data;
  agent.setKey("pendingTool", name);
  agent.setKey("status", "waiting");

  try {
    const tool = resolveTool(name);
    const result = await tool(args);

    agent.setKey("messages", (m) => [
      ...m,
      { role: "assistant", tool_call: { name, args } },
      { role: "tool", name, result },
    ]);
    agent.setKey("toolHistory", (h) => [...h, { name, args, result }]);
    agent.setKey("pendingTool", null);

    // Go back to thinking with the new context
    agent.emit("think");
  } catch (err) {
    agent.setKey("error", err.message);
    agent.setKey("status", "error");
  }
});

function resolveTool(name) {
  if (name === "weather") return tools.weather;
  if (name === "calculator") return tools.calculator;
  if (name.startsWith("notes.")) {
    const method = name.split(".")[1];
    return (args) => tools.notes[method](args);
  }
  throw new Error(`Unknown tool: ${name}`);
}
```

### 5. Build the agent harness

The harness connects user input → think cycle → output.

```js
async function runAgent(userInput) {
  agent.setKey("messages", (m) => [...m, { role: "user", content: userInput }]);
  agent.setKey("error", null);

  agent.emit("think");
  await waitForStatus("done", "error");
}

// Simple promise-based waiter on status
function waitForStatus(...targets) {
  return new Promise((resolve) => {
    if (targets.includes(agent.get().status)) return resolve();

    const unsub = agent.select(
      (s) => s.status,
      (status) => {
        if (targets.includes(status)) {
          unsub();
          resolve();
        }
      }
    );
  });
}
```

### 6. Full working loop

```js
(async () => {
  await runAgent("What's the weather in London?");
  console.log(agent.get().messages.at(-1).content);

  await runAgent("Add 15 * 27 + 3");
  console.log(agent.get().messages.at(-1).content);

  await runAgent("Save my favorite number as 42");
  console.log(agent.get().toolHistory);

  agent.destroy();
})();
```

### 7. Add streaming and observability

Because everything flows through events, you can observe the agent in real-time.

```js
// Log every state change
agent.subscribe((state, prev) => {
  console.log(`[${state.status}] ${JSON.stringify(state.error ?? "ok")}`);
});

// Track timing
agent.on("think", () => console.time("think"));
agent.on("execute", () => console.time("tool"));
```

## Why not just use Zustand/Valtio/Jotai?

- **Zero dependencies** — no bundle bloat
- **138 lines** — easy to audit, fork, or inline
- **Framework agnostic** — works anywhere JS runs
- **Built-in event system** — not an afterthought; events carry current state automatically
- **No proxies** — simple `structuredClone` on init, plain objects throughout

## License

MIT
