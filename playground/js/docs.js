export const DOCS = {
  welcome: `# Welcome to ztore Playground

ztore is a **138-line** state management library for JavaScript with zero dependencies.

This interactive playground lets you write, run, and debug ztore code right in your browser.

## Quick Start

Click an example in the sidebar to load it, then press **Run** (or \`Ctrl+Enter\`) to execute.

Watch the Console, State, and Events panels update in real time as your code runs.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| \`Ctrl+Enter\` | Run code |
| \`Ctrl+S\` | Save |
| \`Ctrl+B\` | Toggle sidebar |

## Navigation

- **Open Tabs** — files you're currently editing
- **Explorer** — all your projects and their files
- **Docs** — API reference and guides
`,

  gettingStarted: `# Getting Started

## Installation

ztore is a single file. Copy \`src/ztore.js\` into your project:

\`\`\`js
import { createStore } from './ztore.js';
\`\`\`

Or use it directly in the browser:

\`\`\`html
<script type="module">
  import { createStore } from 'https://ar-92.github.io/ztore/src/ztore.js';
</script>
\`\`\`

## Your First Store

\`\`\`js
const store = createStore({ count: 0, text: 'hello' });

// Read state
console.log(store.get());            // { count: 0, text: 'hello' }
console.log(store.getKey('count'));  // 0

// Update state
store.setKey('count', 5);
store.setKey('count', (n) => n + 1); // updater function
store.set({ count: 10, text: 'world' }); // replace all

// Watch for changes
store.select((s) => s.count, (count) => {
  console.log('Count changed:', count);
});
\`\`\`

## React to Changes

Use \`select\` to derive values and react to changes:

\`\`\`js
const user = createStore({ name: 'Alice', age: 30 });

user.select(
  (s) => s.name.toUpperCase(),
  (uppercase) => console.log('Name:', uppercase)
);

user.setKey('name', 'Bob'); // logs: Name: BOB
\`\`\`
`,

  apiCreateStore: `# createStore()

Creates a new reactive store.

## Signature

\`\`\`ts
createStore(initialState: Record<string, any>): Store
\`\`\`

## Parameters

| Param | Type | Description |
|-------|------|-------------|
| \`initialState\` | \`object\` | The initial state values |

## Returns

A \`Store\` instance with the following methods:

- \`get()\` — get full state
- \`getKey(key)\` — get a single key
- \`set(state)\` — replace entire state
- \`setKey(key, value)\` — update a single key
- \`select(fn, callback)\` — subscribe to derived values
- \`subscribe(callback)\` — subscribe to all changes
- \`on(event, handler)\` — listen for events
- \`once(event, handler)\` — listen once
- \`emit(event, data)\` — emit an event

## Example

\`\`\`js
const store = createStore({ x: 0, y: 0 });
console.log(store.get()); // { x: 0, y: 0 }
\`\`\`
`,

  apiGetSet: `# get() / set() / getKey() / setKey()

Methods for reading and writing store state.

## get()

Returns the entire state object.

\`\`\`js
const s = store.get();
console.log(s.count);
\`\`\`

## getKey(key)

Returns a single key from state.

\`\`\`js
const count = store.getKey('count');
\`\`\`

## set(state)

Replaces the entire state. Fires all subscribers.

\`\`\`js
store.set({ count: 0, text: 'reset' });
\`\`\`

## setKey(key, value)

Updates a single key. Accepts either a value or an updater function.

\`\`\`js
store.setKey('count', 5);
store.setKey('count', (n) => n + 1); // updater
\`\`\`
`,

  apiSelect: `# select() / subscribe()

Reactively observe state changes.

## select(dependencyFn, callback)

Watches a derived value and calls the callback when it changes.

\`\`\`js
store.select(
  (state) => state.items.length,
  (count) => console.log('Item count:', count)
);
\`\`\`

The \`dependencyFn\` is called on every state change. The \`callback\` is only called when the *return value* changes (uses strict equality \`===\`).

\`\`\`js
store.select(
  (s) => ({ total: s.items.length, done: s.items.filter(i => i.done).length }),
  (stats) => console.log('Stats:', stats)
);
\`\`\`

## subscribe(callback)

Called on every state change with the new state and previous state.

\`\`\`js
store.subscribe((state, prev) => {
  console.log('Changed from', prev, 'to', state);
});
\`\`\`
`,

  apiEvents: `# Events: on() / once() / emit()

Event-driven communication within and between stores.

## on(event, handler)

Listen for an event. Multiple handlers can listen for the same event.

\`\`\`js
store.on('increment', (e) => {
  store.setKey('count', (n) => n + (e.data || 1));
});
\`\`\`

## once(event, handler)

Listen for an event exactly once, then unsubscribes automatically.

\`\`\`js
store.once('init', (e) => {
  console.log('First and only run');
});
\`\`\`

## emit(event, data)

Emit an event with optional data payload.

\`\`\`js
store.emit('increment', 5);
store.emit('custom:event', { key: 'value' });
\`\`\`

## Event Naming

Events can use any string name. Colon-separated namespaces are a convention:

\`\`\`js
store.on('user:login', handler);
store.on('user:logout', handler);
store.emit('user:login', { id: 1 });
\`\`\`
`,

  examplesOverview: `# Examples Overview

The playground includes 12 ready-to-run examples demonstrating ztore patterns.

Click any example in the sidebar to create a new project with that code.

## Available Examples

| # | Example | Concept |
|---|---------|---------|
| 1 | **Counter** | Basic state, select, setKey |
| 2 | **Todo List** | Array state, CRUD, derived stats |
| 3 | **User Auth** | Async events, loading states |
| 4 | **Shopping Cart** | Derived totals, event-driven updates |
| 5 | **Game Combat** | State machine, level-up logic |
| 6 | **Chat Room** | Multi-user state, computed metadata |
| 7 | **AI Agent** | Tool execution, memory |
| 8 | **Form Validation** | Error handling, submit flow |
| 9 | **Pub/Sub Bus** | Multi-handler events, once() |
| 10 | **Undo/Redo** | History stack, subscribe |
| 11 | **Pagination** | Async loading, infinite scroll |
| 12 | **State Machine** | Traffic light, transitions |
`,

  patterns: `# Common Patterns

## Derived State

Compute values from state using \`select\`:

\`\`\`js
const cart = createStore({ items: [], tax: 0.1 });

cart.select((s) => {
  const sub = s.items.reduce((t, i) => t + i.price * i.qty, 0);
  return { subtotal: sub, tax: sub * s.tax, total: sub * (1 + s.tax) };
}, (totals) => console.log('Cart:', totals));
\`\`\`

## Undo / Redo

Use \`subscribe\` to build a history stack:

\`\`\`js
const doc = createStore({ text: '' });
const past = [], future = [];

doc.subscribe((state, prev) => {
  if (prev) { past.push(structuredClone(prev)); future.length = 0; }
});

function undo() {
  if (!past.length) return;
  future.push(structuredClone(doc.get()));
  doc.set(past.pop());
}
\`\`\`

## State Machine

\`\`\`js
const machine = createStore({ state: 'idle' });
const transitions = {
  idle: { START: 'running' },
  running: { STOP: 'idle', ERROR: 'error' },
  error: { RESET: 'idle' },
};

machine.on('transition', (e) => {
  const next = transitions[machine.get().state]?.[e.data.action];
  if (next) machine.setKey('state', next);
});
\`\`\`
`,
};

export const EXAMPLE_LABELS = {
  counter: "Counter",
  todo: "Todo List",
  auth: "User Auth",
  cart: "Shopping Cart",
  game: "Game Combat",
  chat: "Chat Room",
  agent: "AI Agent",
  form: "Form Validation",
  pubsub: "Pub/Sub Bus",
  undo: "Undo / Redo",
  pagination: "Pagination",
  "state-machine": "State Machine",
};

export const DOC_LABELS = {
  welcome: "Welcome",
  gettingStarted: "Getting Started",
  apiCreateStore: "createStore()",
  apiGetSet: "get / set / getKey / setKey",
  apiSelect: "select / subscribe",
  apiEvents: "Events (on / once / emit)",
  examplesOverview: "Examples",
  patterns: "Patterns",
};

export const DOC_ORDER = [
  "welcome",
  "gettingStarted",
  "apiCreateStore",
  "apiGetSet",
  "apiSelect",
  "apiEvents",
  "examplesOverview",
  "patterns",
];
