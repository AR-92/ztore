import { createStore } from '../../src/ztore.js';
import { createIcons, icons } from 'lucide';
import { pm } from './projects.js';

export const playground = {
  stores: new Map(),
  storeIdCounter: 0,
  updateCounter: 0,
  eventCounter: 0,
  eventLog: [],

  createStore(initial) {
    const store = createStore(initial);
    const id = "store_" + (++this.storeIdCounter);

    this.stores.set(id, { store, state: structuredClone(initial) });
    this.updateUI();

    store.subscribe((state) => {
      this.stores.set(id, { store, state: structuredClone(state) });
      this.updateCounter++;
      this.updateUI();
    });

    const origEmit = store.emit.bind(store);
    store.emit = (event, data) => {
      this.eventCounter++;
      this.eventLog.push({
        ts: new Date(),
        storeId: id,
        event,
        data: structuredClone(data ?? null),
        state: structuredClone(store.get()),
      });
      this.eventLog = this.eventLog.slice(-100);
      this.updateUI();
      origEmit(event, data);
    };

    return store;
  },

  reset() {
    this.stores.clear();
    this.storeIdCounter = 0;
    this.updateCounter = 0;
    this.eventCounter = 0;
    this.eventLog = [];
    ["console", "state", "events"].forEach(function(p) {
      const out = document.getElementById(p + "Output");
      const empty = document.getElementById(p + "Empty");
      if (out) out.innerHTML = "";
      if (empty) empty.style.display = "flex";
    });
    this.updateUI();
  },

  updateUI() {
    const sc = this.stores.size;
    const scEl = document.getElementById("storeCount");
    const ucEl = document.getElementById("updateCount");
    const ecEl = document.getElementById("eventCount");
    if (scEl) scEl.textContent = sc;
    if (ucEl) ucEl.textContent = this.updateCounter;
    if (ecEl) ecEl.textContent = this.eventCounter;

    const dot = document.getElementById("statusDot");
    if (dot) dot.className = "w-1.5 h-1.5 rounded-full inline-block transition-colors duration-300 " +
      (sc > 0 ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]" : "bg-gray-600");

    const storeBadge = document.getElementById("storeBadge");
    const eventBadge = document.getElementById("eventBadge");
    if (storeBadge) { if (sc > 0) { storeBadge.textContent = sc; storeBadge.classList.remove("hidden"); } else { storeBadge.classList.add("hidden"); } }
    if (eventBadge) { if (this.eventCounter > 0) { eventBadge.textContent = this.eventCounter; eventBadge.classList.remove("hidden"); } else { eventBadge.classList.add("hidden"); } }

    this.renderState();
    this.renderEvents();
    createIcons({ icons });
  },

  renderState() {
    const container = document.getElementById("stateOutput");
    const empty = document.getElementById("stateEmpty");
    if (!container) return;
    container.innerHTML = "";
    if (this.stores.size === 0) { if (empty) empty.style.display = "flex"; return; }
    if (empty) empty.style.display = "none";

    this.stores.forEach((entry, id) => {
      const div = document.createElement("div");
      div.className = "state-card animate-fade-in";
      div.innerHTML =
        '<div class="state-card-header">' +
          '<span class="text-purple-400 flex items-center gap-1.5"><i data-lucide="box" class="w-3 h-3"></i> ' + this.esc(id) + '</span>' +
          '<span class="text-gray-600 font-normal">' + this.updateCounter + ' updates</span>' +
        '</div>' +
        '<div class="state-card-body">' + this.formatJSON(entry.state) + '</div>';
      container.appendChild(div);
    });
  },

  renderEvents() {
    const container = document.getElementById("eventOutput");
    const empty = document.getElementById("eventEmpty");
    if (!container) return;
    container.innerHTML = "";
    if (this.eventLog.length === 0) { if (empty) empty.style.display = "flex"; return; }
    empty.style.display = "none";

    this.eventLog.slice().reverse().forEach(function(ev) {
      const div = document.createElement("div");
      div.className = "event-entry animate-fade-in";
      div.innerHTML =
        '<div class="event-meta">' +
          '<span class="text-purple-400/80"><i data-lucide="box" class="w-2.5 h-2.5 inline"></i> ' + playground.esc(ev.storeId) + '</span>' +
          '<span class="mx-1.5 opacity-40">\u2192</span>' +
          '<span class="event-name">' + playground.esc(ev.event) + '</span>' +
          '<span class="ml-2 opacity-40">' + ev.ts.toLocaleTimeString() + '</span>' +
        '</div>' +
        '<div class="event-data">' + playground.formatInline(ev.data) + '</div>';
      container.appendChild(div);
    });
  },

  formatJSON(obj, depth) {
    depth = depth || 0;
    if (obj === null || obj === undefined) return '<span class="json-null">null</span>';
    if (typeof obj === "string") return '<span class="json-string">' + this.esc(JSON.stringify(obj)) + '</span>';
    if (typeof obj === "number") return '<span class="json-number">' + obj + '</span>';
    if (typeof obj === "boolean") return '<span class="json-boolean">' + obj + '</span>';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '<span class="json-bracket">[ ]</span>';
      const ind = "  ".repeat(depth + 1), cl = "  ".repeat(depth);
      const items = obj.map(function(i) { return ind + playground.formatJSON(i, depth + 1); }).join(",\n");
      return '<span class="json-bracket">[</span>\n' + items + '\n' + cl + '<span class="json-bracket">]</span>';
    }
    if (typeof obj === "object") {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '<span class="json-bracket">{ }</span>';
      const ind = "  ".repeat(depth + 1), cl = "  ".repeat(depth);
      const items = keys.map(function(k) {
        return ind + '<span class="json-key">' + playground.esc(JSON.stringify(k)) + '</span>: ' + playground.formatJSON(obj[k], depth + 1);
      }).join(",\n");
      return '<span class="json-bracket">{</span>\n' + items + '\n' + cl + '<span class="json-bracket">}</span>';
    }
    return this.esc(String(obj));
  },

  formatInline(obj) {
    if (obj === null || obj === undefined) return '<span class="json-null">null</span>';
    if (typeof obj === "string") return '<span class="json-string">' + this.esc(JSON.stringify(obj)) + '</span>';
    if (typeof obj === "number") return '<span class="json-number">' + obj + '</span>';
    if (typeof obj === "boolean") return '<span class="json-boolean">' + obj + '</span>';
    if (Array.isArray(obj)) {
      const items = obj.map(function(i) { return playground.formatInline(i); }).join(", ");
      if (items.length > 80) {
        const indented = obj.map(function(i, idx) {
          return "  " + playground.formatInline(i) + (idx < obj.length - 1 ? "," : "");
        }).join("\n");
        return '<span class="json-bracket">[</span>\n' + indented + '\n<span class="json-bracket">]</span>';
      }
      return '<span class="json-bracket">[</span> ' + items + ' <span class="json-bracket">]</span>';
    }
    if (typeof obj === "object") {
      const items = Object.entries(obj).map(function(e) {
        return '<span class="json-key">' + playground.esc(e[0]) + '</span>: ' + playground.formatInline(e[1]);
      }).join(", ");
      if (items.length > 60) {
        const lines = Object.entries(obj).map(function(e) {
          return "  <span class=\"json-key\">" + playground.esc(e[0]) + "</span>: " + playground.formatInline(e[1]);
        }).join(",\n");
        return '<span class="json-bracket">{</span>\n' + lines + '\n<span class="json-bracket">}</span>';
      }
      return '<span class="json-bracket">{</span> ' + items + ' <span class="json-bracket">}</span>';
    }
    return this.esc(String(obj));
  },

  esc: function(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
};

// ============================================================
// CONSOLE CAPTURE
// ============================================================
const _console = { log: console.log, warn: console.warn, error: console.error, info: console.info };
let _capturing = false;

function captureConsole(method, args) {
  if (_capturing) return;
  _capturing = true;

  const text = Array.from(args).map(function(a) {
    if (typeof a === "object") {
      try { return playground.esc(JSON.stringify(a, null, 2)); }
      catch(e) { return playground.esc(String(a)); }
    }
    return playground.esc(String(a));
  }).join(" ");

  const container = document.getElementById("consoleOutput");
  const empty = document.getElementById("consoleEmpty");
  if (!container) { _capturing = false; return; }
  empty.style.display = "none";

  const line = document.createElement("div");
  line.className = "console-line " + method + " animate-fade-in";
  line.innerHTML =
    '<span class="timestamp">' + new Date().toLocaleTimeString() + '</span>' +
    '<span class="payload">' + text + '</span>';
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
  while (container.children.length > 500) container.removeChild(container.firstChild);
  createIcons({ icons });
  _capturing = false;
}

console.log = function() { _console.log.apply(console, arguments); captureConsole("log", arguments); };
console.warn = function() { _console.warn.apply(console, arguments); captureConsole("warn", arguments); };
console.error = function() { _console.error.apply(console, arguments); captureConsole("error", arguments); };
console.info = function() { _console.info.apply(console, arguments); captureConsole("info", arguments); };

// ============================================================
// EXECUTION
// ============================================================
export function executeCode(code) {
  playground.reset();
  const label = document.getElementById("statusLabel");
  const dot = document.getElementById("statusDot");
  if (label) label.textContent = "Running...";
  if (dot) dot.className = "w-1.5 h-1.5 rounded-full inline-block bg-blue-400 animate-pulse transition-colors duration-300";

  try {
    const fn = new Function("createStore", code);
    const result = fn(playground.createStore.bind(playground));

    if (result !== undefined && result !== null) {
      console.log("Result:", result);
    }
    const count = playground.storeIdCounter;
    if (label) label.textContent = "Done (" + count + " store" + (count !== 1 ? "s" : "") + ")";
    if (dot) dot.className = "w-1.5 h-1.5 rounded-full inline-block bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)] transition-colors duration-300";
  } catch (err) {
    console.error(err);
    if (label) label.textContent = "Error";
    if (dot) dot.className = "w-1.5 h-1.5 rounded-full inline-block bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)] transition-colors duration-300";
  }
  createIcons({ icons });
}
