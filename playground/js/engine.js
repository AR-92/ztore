import { createStore } from '../../src/ztore.js';
import { createIcons, icons } from 'lucide';

// ============================================================
// PLAYGROUND ENGINE
// ============================================================
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
    document.getElementById("consoleOutput").innerHTML = "";
    document.getElementById("stateOutput").innerHTML = "";
    document.getElementById("eventOutput").innerHTML = "";
    document.getElementById("consoleEmpty").style.display = "flex";
    document.getElementById("stateEmpty").style.display = "flex";
    document.getElementById("eventEmpty").style.display = "flex";
    this.updateUI();
  },

  updateUI() {
    document.getElementById("storeCount").textContent = this.stores.size;
    document.getElementById("updateCount").textContent = this.updateCounter;
    document.getElementById("eventCount").textContent = this.eventCounter;
    const dot = document.getElementById("statusDot");
    dot.className = "w-2 h-2 rounded-full inline-block " + (this.stores.size > 0 ? "bg-green-400" : "bg-gray-600");
    this.renderState();
    this.renderEvents();
    createIcons({ icons });
  },

  renderState() {
    const container = document.getElementById("stateOutput");
    const empty = document.getElementById("stateEmpty");
    container.innerHTML = "";
    if (this.stores.size === 0) { empty.style.display = "flex"; return; }
    empty.style.display = "none";

    this.stores.forEach((entry, id) => {
      const div = document.createElement("div");
      div.className = "border border-gray-800 rounded-lg overflow-hidden mb-3";
      div.innerHTML = `
        <div class="flex items-center justify-between px-3 py-1.5 bg-gray-800 text-xs font-semibold border-b border-gray-700">
          <span class="text-purple-400 flex items-center gap-1"><i data-lucide="box" class="w-3 h-3"></i> ${id}</span>
          <span class="text-gray-500 font-normal text-xs">${this.updateCounter} updates</span>
        </div>
        <div class="px-3 py-2 text-xs whitespace-pre-wrap font-mono leading-relaxed">${this.formatJSON(entry.state)}</div>
      `;
      container.appendChild(div);
    });
  },

  renderEvents() {
    const container = document.getElementById("eventOutput");
    const empty = document.getElementById("eventEmpty");
    container.innerHTML = "";
    if (this.eventLog.length === 0) { empty.style.display = "flex"; return; }
    empty.style.display = "none";

    this.eventLog.slice(-50).forEach((ev) => {
      const div = document.createElement("div");
      div.className = "border-b border-gray-800 py-1.5 px-2 hover:bg-gray-900";
      div.innerHTML = `
        <div class="text-xs text-gray-500 mb-0.5">
          <span class="text-purple-400"><i data-lucide="box" class="w-2.5 h-2.5 inline"></i> ${ev.storeId}</span>
          <span class="mx-1 opacity-50">></span>
          <span class="text-orange-400 font-semibold">${ev.event}</span>
          <span class="ml-1.5 opacity-50">${ev.ts.toLocaleTimeString()}</span>
        </div>
        <div class="pl-1 text-gray-300 whitespace-pre-wrap">${this.formatInline(ev.data)}</div>
      `;
      container.appendChild(div);
    });
  },

  formatJSON(obj, depth) {
    depth = depth || 0;
    if (obj === null || obj === undefined) return '<span class="text-gray-500 italic">null</span>';
    if (typeof obj === "string") return '<span class="text-green-400">' + this.esc(JSON.stringify(obj)) + '</span>';
    if (typeof obj === "number") return '<span class="text-orange-400">' + obj + '</span>';
    if (typeof obj === "boolean") return '<span class="text-purple-400">' + obj + '</span>';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '<span class="text-gray-500">[ ]</span>';
      const ind = "  ".repeat(depth + 1), cl = "  ".repeat(depth);
      const items = obj.map(function(i) { return ind + playground.formatJSON(i, depth + 1); }).join(",\n");
      return '<span class="text-gray-500">[</span>\n' + items + '\n' + cl + '<span class="text-gray-500">]</span>';
    }
    if (typeof obj === "object") {
      var keys = Object.keys(obj);
      if (keys.length === 0) return '<span class="text-gray-500">{ }</span>';
      const ind = "  ".repeat(depth + 1), cl = "  ".repeat(depth);
      const items = keys.map(function(k) {
        return ind + '<span class="text-blue-400">' + playground.esc(JSON.stringify(k)) + '</span>: ' + playground.formatJSON(obj[k], depth + 1);
      }).join(",\n");
      return '<span class="text-gray-500">{</span>\n' + items + '\n' + cl + '<span class="text-gray-500">}</span>';
    }
    return this.esc(String(obj));
  },

  formatInline(obj) {
    if (obj === null || obj === undefined) return '<span class="text-gray-500 italic">null</span>';
    if (typeof obj === "string") return '<span class="text-green-400">' + this.esc(JSON.stringify(obj)) + '</span>';
    if (typeof obj === "number") return '<span class="text-orange-400">' + obj + '</span>';
    if (typeof obj === "boolean") return '<span class="text-purple-400">' + obj + '</span>';
    if (Array.isArray(obj)) {
      var items = obj.map(function(i) { return playground.formatInline(i); }).join(", ");
      return '<span class="text-gray-500">[</span> ' + items + ' <span class="text-gray-500">]</span>';
    }
    if (typeof obj === "object") {
      var items = Object.entries(obj).map(function(e) {
        return '<span class="text-blue-400">' + e[0] + '</span>: ' + playground.formatInline(e[1]);
      }).join(", ");
      return '<span class="text-gray-500">{</span> ' + items + ' <span class="text-gray-500">}</span>';
    }
    return this.esc(String(obj));
  },

  esc: function(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
};

// ============================================================
// CONSOLE CAPTURE
// ============================================================
const _console = { log: console.log, warn: console.warn, error: console.error, info: console.info };

function captureConsole(method, args) {
  const text = Array.from(args).map(function(a) {
    if (typeof a === "object") return playground.esc(JSON.stringify(a, null, 2));
    return playground.esc(String(a));
  }).join(" ");

  var container = document.getElementById("consoleOutput");
  var empty = document.getElementById("consoleEmpty");
  empty.style.display = "none";

  var line = document.createElement("div");
  var colorClass = method === "warn" ? "text-orange-400" : method === "error" ? "text-red-400" : method === "info" ? "text-blue-400" : "text-gray-100";
  line.className = "border-b border-gray-800 py-1 px-3 hover:bg-gray-900 " + colorClass;
  line.innerHTML = '<span class="text-gray-600 mr-2 text-xs">' + new Date().toLocaleTimeString() + '</span><span class="payload">' + text + '</span>';
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
  while (container.children.length > 200) container.removeChild(container.firstChild);
  createIcons({ icons });
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
  document.getElementById("statusText").textContent = "Running...";

  try {
    var fn = new Function("createStore", code);
    var result = fn(playground.createStore.bind(playground));

    if (result !== undefined && result !== null) {
      console.log("Result:", result);
    }
    document.getElementById("statusText").textContent = "Done (" + playground.storeIdCounter + " store" + (playground.storeIdCounter !== 1 ? "s" : "") + ")";
  } catch (err) {
    console.error(err);
    document.getElementById("statusText").textContent = "Error";
  }
  createIcons({ icons });
}
