import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/addon/edit/closebrackets.js';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import { createIcons } from 'lucide';
import { playground, executeCode } from './engine.js';
import { EXAMPLES } from './examples.js';
import '../main.css';

// ============================================================
// UI CONTROLLERS
// ============================================================
const exampleSelect = document.getElementById("exampleSelect");
const runBtn = document.getElementById("runBtn");
const autoRun = document.getElementById("autoRun");
const clearOutput = document.getElementById("clearOutput");
const clearAll = document.getElementById("clearAll");
const tabBtns = document.querySelectorAll(".tab-btn");

// CodeMirror editor
const codeEditor = CodeMirror(document.getElementById("editor-container"), {
  value: "",
  mode: "javascript",
  theme: "dracula",
  lineNumbers: true,
  indentUnit: 2,
  tabSize: 2,
  indentWithTabs: false,
  lineWrapping: true,
  autoCloseBrackets: true,
  matchBrackets: true,
  extraKeys: {
    "Ctrl-Enter": function(instance) { executeCode(instance.getValue()); },
    "Cmd-Enter": function(instance) { executeCode(instance.getValue()); },
  },
});

// Fill editor to container height
(function fillEditor() {
  codeEditor.setSize(null, "100%");
  document.getElementById("editor-container").style.height = "100%";
})();

let debounceTimer = null;

function loadExample(name) {
  const code = EXAMPLES[name];
  if (code) {
    codeEditor.setValue(code.trim());
    if (autoRun.checked) executeCode(codeEditor.getValue());
  }
}

exampleSelect.addEventListener("change", function() { loadExample(this.value); this.blur(); });
runBtn.addEventListener("click", function() { executeCode(codeEditor.getValue()); });

codeEditor.on("change", function() {
  clearTimeout(debounceTimer);
  if (autoRun.checked) debounceTimer = setTimeout(function() { executeCode(codeEditor.getValue()); }, 400);
});

autoRun.addEventListener("change", function() {
  if (this.checked) executeCode(codeEditor.getValue());
});

clearOutput.addEventListener("click", function() {
  document.getElementById("consoleOutput").innerHTML = "";
  document.getElementById("eventOutput").innerHTML = "";
  document.getElementById("consoleEmpty").style.display = "flex";
  document.getElementById("eventEmpty").style.display = "flex";
  playground.eventLog = [];
  playground.eventCounter = 0;
  playground.updateUI();
});

clearAll.addEventListener("click", function() {
  playground.reset();
  codeEditor.setValue("");
  document.getElementById("statusText").textContent = "Reset";
  createIcons();
});

tabBtns.forEach(function(btn) {
  btn.addEventListener("click", function() {
    tabBtns.forEach(function(b) {
      b.style.color = "#9ca3af";
      b.style.borderColor = "transparent";
    });
    btn.style.color = "#60a5fa";
    btn.style.borderColor = "#60a5fa";
    document.querySelectorAll(".panel").forEach(function(p) { p.classList.add("hidden"); });
    document.getElementById("panel-" + btn.dataset.tab).classList.remove("hidden");
  });
});

createIcons();
loadExample("agent");
