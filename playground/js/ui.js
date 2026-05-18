import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascript);
import { createIcons, icons } from 'lucide';
import { pm } from './projects.js';
import { executeCode, playground } from './engine.js';
import { EXAMPLES } from './examples.js';
import { marked } from 'marked';
import { DOCS, DOC_LABELS, DOC_ORDER, EXAMPLE_LABELS } from './docs.js';
import '../main.css';
import 'highlight.js/styles/atom-one-dark.css';

// ============================================================
// TEXTAREA EDITOR WITH HIGHLIGHT.JS
// ============================================================
var editorContainer = document.getElementById("editor-container");
var editorWrapper = document.createElement("div");
editorWrapper.className = "editor-wrapper";

var gutter = document.createElement("div");
gutter.className = "editor-gutter";

var content = document.createElement("div");
content.className = "editor-content";

var pre = document.createElement("pre");
pre.className = "editor-highlight";
var code = document.createElement("code");
code.className = "language-javascript";
pre.appendChild(code);

var textarea = document.createElement("textarea");
textarea.className = "editor-textarea";
textarea.spellcheck = false;
textarea.autocorrect = "off";
textarea.autocapitalize = "off";
textarea.wrap = "off";
textarea.placeholder = "// type your code here...";

content.appendChild(pre);
content.appendChild(textarea);
editorWrapper.appendChild(gutter);
editorWrapper.appendChild(content);
editorContainer.appendChild(editorWrapper);

function getCode() { return textarea.value; }
function setCode(val) { textarea.value = val; updateEditor(); }

function updateLineNumbers() {
  var lines = textarea.value.split("\n");
  var html = "";
  for (var i = 1; i <= lines.length; i++) {
    html += '<span class="editor-ln">' + i + "</span>";
  }
  gutter.innerHTML = html;
}

function highlightCode() {
  code.textContent = textarea.value;
  hljs.highlightElement(code);
}

function syncScroll() {
  pre.scrollTop = textarea.scrollTop;
  pre.scrollLeft = textarea.scrollLeft;
  gutter.scrollTop = textarea.scrollTop;
}

function updateEditor() {
  updateLineNumbers();
  highlightCode();
}

textarea.addEventListener("scroll", syncScroll);
textarea.addEventListener("input", function() {
  updateEditor();
  onEditorChange();
});
textarea.addEventListener("keydown", function(e) {
  if (e.key === "Tab") {
    e.preventDefault();
    var start = this.selectionStart;
    var end = this.selectionEnd;
    this.value = this.value.substring(0, start) + "  " + this.value.substring(end);
    this.selectionStart = this.selectionEnd = start + 2;
    updateEditor();
    onEditorChange();
  }
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    runCurrent();
  }
  if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    pm.flush();
    updateSaveStatus();
  }
});

var _suppressChange = false;
var debounceTimer = null;
var autoRunTimer = null;

function onEditorChange() {
  if (_suppressChange) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function() {
    var file = pm.getActiveFile();
    var proj = pm.getActiveProject();
    if (file && proj) {
      pm.saveFileContent(proj.id, file.id, textarea.value);
      renderSidebar();
      renderOpenTabs();
    }
  }, 400);

  if (document.getElementById("autoRun").checked) {
    clearTimeout(autoRunTimer);
    autoRunTimer = setTimeout(function() {
      var file = pm.getActiveFile();
      if (file) executeCode(file.content);
    }, 600);
  }
}

// ============================================================
// PROJECT MANAGER
// ============================================================
function updateSaveStatus() {
  document.getElementById("saveStatus").textContent = "Saved";
}

function runCurrent() {
  const file = pm.getActiveFile();
  if (file) executeCode(file.content);
}

// Render sidebar open tabs
function renderOpenTabs() {
  const container = document.getElementById("openTabsList");
  const proj = pm.getActiveProject();
  if (!proj) { container.innerHTML = '<div class="text-[11px] text-gray-600 text-center py-3">No files open</div>'; return; }

  const files = Object.values(proj.files);
  if (files.length === 0) { container.innerHTML = ""; return; }

  container.innerHTML = "";
  files.forEach(function(file) {
    const div = document.createElement("div");
    div.className = "open-tab-item" + (file.id === proj.activeFile ? " active" : "");
    div.innerHTML =
      '<i data-lucide="file" class="w-3 h-3 shrink-0"></i>' +
      '<span class="file-name">' + esc(file.name) + '</span>' +
      (files.length > 1 ? '<button class="close-tab-btn" data-pid="' + proj.id + '" data-fid="' + file.id + '"><i data-lucide="x" class="w-2.5 h-2.5"></i></button>' : '');
    div.addEventListener("click", function(e) {
      if (e.target.closest(".close-tab-btn")) {
        deleteFileHandler(proj.id, file.id);
        return;
      }
      if (file.id !== proj.activeFile) {
        pm.setActiveFile(proj.id, file.id);
        loadActiveProject();
      }
    });
    container.appendChild(div);
  });
  createIcons({ icons });
}

// Render sidebar project list
function renderSidebar() {
  const container = document.getElementById("projectList");
  const data = pm.getAll();
  const projects = Object.values(data.projects).sort((a, b) => b.updatedAt - a.updatedAt);

  container.innerHTML = "";
  if (projects.length === 0) {
    container.innerHTML = '<div class="text-[11px] text-gray-600 text-center py-6">No projects yet<br><span class="text-gray-700">Click + to create one</span></div>';
    return;
  }

  projects.forEach(function(proj) {
    const isActive = proj.id === data.activeProject;
    const div = document.createElement("div");

    // Project header
    const header = document.createElement("div");
    header.className = "project-item" + (isActive ? " active" : "");
    header.innerHTML =
      '<i data-lucide="folder" class="w-3 h-3 shrink-0"></i>' +
      '<span class="proj-name">' + esc(proj.name) + '</span>';
    header.addEventListener("click", function(e) {
      if (proj.id !== pm.getActiveProjectId()) {
        pm.setActiveProject(proj.id);
        loadActiveProject();
      }
    });
    div.appendChild(header);

    // File tree with indent guides (only shown if active)
    if (isActive) {
      const files = Object.values(proj.files);
      const tree = document.createElement("div");
      tree.className = "file-tree";
      files.forEach(function(file, idx) {
        const isLast = idx === files.length - 1;
        const fi = document.createElement("div");
        fi.className = "file-item" + (file.id === proj.activeFile ? " active" : "");
        fi.innerHTML =
          '<span class="tree-guide"></span>' +
          (isLast ? '' : '<span class="tree-guide-v"></span>') +
          '<i data-lucide="file" class="w-3 h-3 shrink-0 relative" style="z-index:1"></i>' +
          '<span class="file-name">' + esc(file.name) + '</span>';
        fi.addEventListener("click", function(e) {
          if (file.id !== proj.activeFile) {
            pm.setActiveFile(proj.id, file.id);
            loadActiveProject();
          }
        });
        tree.appendChild(fi);
      });
      div.appendChild(tree);
    }

    container.appendChild(div);
  });

  createIcons({ icons });
}

// Render sidebar docs list
function renderDocs() {
  const container = document.getElementById("docsList");
  container.innerHTML = "";
  DOC_ORDER.forEach(function(key) {
    var div = document.createElement("div");
    div.className = "doc-item";
    div.dataset.doc = key;
    div.textContent = DOC_LABELS[key] || key;
    div.addEventListener("click", function() { showDoc(key); });
    container.appendChild(div);
  });
}

// Render sidebar examples list
function renderExamples() {
  var container = document.getElementById("examplesList");
  container.innerHTML = "";
  Object.keys(EXAMPLES).forEach(function(key) {
    var div = document.createElement("div");
    div.className = "example-item";
    div.dataset.example = key;
    div.textContent = EXAMPLE_LABELS[key] || key;
    div.addEventListener("click", function() {
      var name = EXAMPLE_LABELS[key] || key;
      pm.createProject(name, EXAMPLES[key]);
      loadActiveProject();
    });
    container.appendChild(div);
  });
}

var _currentDoc = null;

function showDoc(key) {
  var text = DOCS[key];
  if (!text) return;
  _currentDoc = key;
  var view = document.getElementById("docsView");
  view.innerHTML = marked.parse(text);

  // Highlight code blocks in rendered docs
  view.querySelectorAll("pre code").forEach(function(block) {
    hljs.highlightElement(block);
  });

  view.style.display = "block";
  editorWrapper.style.display = "none";

  // Highlight active doc in sidebar
  document.querySelectorAll(".doc-item").forEach(function(d) {
    d.classList.toggle("active", d.dataset.doc === key);
  });

  document.getElementById("statusLabel").textContent = DOC_LABELS[key] || "Docs";
  renderOpenTabs();
}

function hideDocs() {
  _currentDoc = null;
  document.getElementById("docsView").style.display = "none";
  editorWrapper.style.display = "flex";
  document.querySelectorAll(".doc-item").forEach(function(d) {
    d.classList.remove("active");
  });
}

function loadActiveProject() {
  hideDocs();
  const file = pm.getActiveFile();
  _suppressChange = true;
  textarea.value = file ? file.content : "";
  updateEditor();
  textarea.selectionStart = textarea.selectionEnd = 0;
  _suppressChange = false;
  renderSidebar();
  renderOpenTabs();
  updateSaveStatus();
  document.getElementById("statusLabel").textContent = "Ready";
}

// ============================================================
// MODAL
// ============================================================
let _modalResolve = null;

function showModal(title, placeholder, defaultValue) {
  return new Promise(function(resolve) {
    _modalResolve = resolve;
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalInput").placeholder = placeholder;
    document.getElementById("modalInput").value = defaultValue || "";
    document.getElementById("modalError").classList.add("hidden");
    document.getElementById("modalError").textContent = "";
    document.getElementById("modalOverlay").style.display = "flex";
    setTimeout(function() { document.getElementById("modalInput").focus(); document.getElementById("modalInput").select(); }, 50);
  });
}

function closeModal(value) {
  document.getElementById("modalOverlay").style.display = "none";
  if (_modalResolve) { _modalResolve(value); _modalResolve = null; }
}

document.getElementById("modalClose").addEventListener("click", function() { closeModal(null); });
document.getElementById("modalCancel").addEventListener("click", function() { closeModal(null); });
document.getElementById("modalConfirm").addEventListener("click", function() {
  const val = document.getElementById("modalInput").value.trim();
  if (!val) {
    document.getElementById("modalError").textContent = "This field is required";
    document.getElementById("modalError").classList.remove("hidden");
    return;
  }
  closeModal(val);
});
document.getElementById("modalInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter") document.getElementById("modalConfirm").click();
  if (e.key === "Escape") closeModal(null);
});
document.getElementById("modalOverlay").addEventListener("click", function(e) {
  if (e.target === this) closeModal(null);
});

// ============================================================
// HANDLERS
// ============================================================
function createProjectHandler() {
  showModal("New Project", "Project name", "Untitled").then(function(name) {
    if (!name) return;
    const examples = Object.keys(EXAMPLES);
    if (examples.length > 0) {
      pickExample(name);
    } else {
      pm.createProject(name);
      loadActiveProject();
    }
  });
}

function pickExample(projectName) {
  const container = document.getElementById("projectList");
  // Simple inline picker
  const picker = document.createElement("div");
  picker.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm";
  const box = document.createElement("div");
  box.className = "bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl w-72 max-h-80 overflow-hidden";
  let html = '<div class="px-4 py-3 border-b border-gray-800 text-sm font-semibold text-gray-200">Start from example</div><div class="overflow-y-auto max-h-64">';
  Object.keys(EXAMPLES).forEach(function(key) {
    const label = document.querySelector("#exampleSelect option[value=\"" + key + "\"]")?.textContent || key;
    html += '<div class="example-opt px-4 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 cursor-pointer border-b border-gray-800/40 transition-all" data-key="' + key + '">' + esc(label) + '</div>';
  });
  html += '<div class="example-opt px-4 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 cursor-pointer border-b border-gray-800/40 transition-all" data-key="">Blank project</div>';
  html += '</div>';
  box.innerHTML = html;
  picker.appendChild(box);
  document.body.appendChild(picker);

  picker.addEventListener("click", function(e) {
    const opt = e.target.closest(".example-opt");
    if (!opt) { if (e.target === picker) { document.body.removeChild(picker); } return; }
    document.body.removeChild(picker);
    const key = opt.dataset.key;
    if (key && EXAMPLES[key]) {
      pm.createProject(projectName, EXAMPLES[key]);
    } else {
      pm.createProject(projectName);
    }
    loadActiveProject();
  });
}

function deleteFileHandler(pid, fid) {
  pm.deleteFile(pid, fid);
  loadActiveProject();
}

// (no inline rename/delete buttons in explorer tree — use context menu or Open Tabs)

// ============================================================
// OTHER UI
// ============================================================
document.getElementById("runBtn").addEventListener("click", runCurrent);
document.getElementById("autoRun").addEventListener("change", function() {
  if (this.checked) runCurrent();
});
document.getElementById("clearOutput").addEventListener("click", function() {
  document.getElementById("consoleOutput").innerHTML = "";
  document.getElementById("eventOutput").innerHTML = "";
  document.getElementById("consoleEmpty").style.display = "flex";
  document.getElementById("eventEmpty").style.display = "flex";
  playground.eventLog = [];
  playground.eventCounter = 0;
  playground.updateUI();
});
document.getElementById("newProjectBtn").addEventListener("click", createProjectHandler);
document.getElementById("newFileBtn").addEventListener("click", function() {
  const proj = pm.getActiveProject();
  if (!proj) { createProjectHandler(); return; }
  showModal("New File", "File name (e.g. utils.js)", "").then(function(name) {
    if (name) {
      if (!name.endsWith(".js")) name += ".js";
      pm.createFile(proj.id, name);
      loadActiveProject();
    }
  });
});

// Output tabs (in status bar)
function switchTab(tab) {
  document.querySelectorAll(".status-tab").forEach(function(b) {
    b.classList.remove("text-blue-400");
    b.classList.add("text-gray-500", "hover:text-gray-300");
  });
  var btn = document.querySelector(".status-tab[data-tab=\"" + tab + "\"]");
  if (btn) {
    btn.classList.remove("text-gray-500", "hover:text-gray-300");
    btn.classList.add("text-blue-400");
  }
  document.querySelectorAll(".panel").forEach(function(p) { p.classList.add("hidden"); });
  var panel = document.getElementById("panel-" + tab);
  if (panel) panel.classList.remove("hidden");
}

document.querySelectorAll(".status-tab").forEach(function(btn) {
  btn.addEventListener("click", function() { switchTab(btn.dataset.tab); });
});

// ============================================================
// COLLAPSE TOGGLES
// ============================================================
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const isCollapsed = sidebar.classList.toggle("sidebar-collapsed");
  const iconName = isCollapsed ? "chevron-right" : "chevron-left";
  document.querySelectorAll("#sidebarToggle i, #statusSidebarToggle i").forEach(function(el) {
    el.setAttribute("data-lucide", iconName);
  });
  createIcons({ icons });
}

function togglePanel() {
  const panel = document.getElementById("outputPanel");
  const isCollapsed = panel.classList.toggle("panel-collapsed");
  const iconName = isCollapsed ? "chevron-left" : "chevron-right";
  document.querySelectorAll("#statusPanelToggle i").forEach(function(el) {
    el.setAttribute("data-lucide", iconName);
  });
  createIcons({ icons });
}

document.getElementById("sidebarToggle").addEventListener("click", toggleSidebar);
document.getElementById("statusSidebarToggle").addEventListener("click", toggleSidebar);
document.getElementById("statusPanelToggle").addEventListener("click", togglePanel);

document.addEventListener("keydown", function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "b") {
    e.preventDefault();
    toggleSidebar();
  }
});

// ============================================================
// RESIZE HANDLES
// ============================================================
function makeResizable(handleId, targetId, opts) {
  const handle = document.getElementById(handleId);
  const target = document.getElementById(targetId);
  if (!handle || !target) return;
  var startX, startSize, maxSize, collapsedClass = opts && opts.collapsedClass;

  function onDown(e) {
    e.preventDefault();
    var rect = target.getBoundingClientRect();
    // If collapsed, uncollapse first
    if (collapsedClass && target.classList.contains(collapsedClass)) {
      target.classList.remove(collapsedClass);
      rect = target.getBoundingClientRect();
    }
    startX = e.clientX;
    startSize = rect.width;
    var parent = target.parentElement;
    maxSize = opts && opts.max;
    if (maxSize && maxSize < 1) maxSize = maxSize * parent.getBoundingClientRect().width;
    handle.classList.add("active");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    target.style.transition = "none";

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function onMove(e) {
    var delta = e.clientX - startX;
    var newSize = Math.max(opts && opts.min || 150, startSize + delta);
    if (maxSize) newSize = Math.min(maxSize, newSize);
    target.style.width = newSize + "px";
  }

  function onUp() {
    handle.classList.remove("active");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    target.style.transition = "";
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }

  handle.addEventListener("mousedown", onDown);
}

makeResizable("sidebarResizeHandle", "sidebar", { min: 0, max: 500, collapsedClass: "sidebar-collapsed" });
makeResizable("panelResizeHandle", "outputPanel", { min: 0, max: 0.7, collapsedClass: "panel-collapsed" });

// ============================================================
// WATCH PROJECT CHANGES
// ============================================================
pm.onChange(function() {
  renderSidebar();
  renderOpenTabs();
  renderDocs();
  renderExamples();
});

// ============================================================
// SECTION COLLAPSE
// ============================================================
function getSectionState() {
  try { return JSON.parse(localStorage.getItem("ztore_sections")) || {}; } catch(e) { return {}; }
}
function saveSectionState(state) {
  localStorage.setItem("ztore_sections", JSON.stringify(state));
}
function toggleSection(key) {
  var state = getSectionState();
  state[key] = !state[key];
  saveSectionState(state);
  applySectionState(state);
}
function applySectionState(state) {
  document.querySelectorAll(".section-header").forEach(function(header) {
    var key = header.dataset.section;
    var expanded = state[key];
    var content = document.getElementById(key + "List");
    var chevron = header.querySelector(".section-chevron");
    if (content) content.classList.toggle("collapsed", !expanded);
    if (chevron) chevron.classList.toggle("expanded", expanded);
    header.dataset.expanded = expanded ? "true" : "false";
  });
  createIcons({ icons });
}
function initSectionToggles() {
  var state = getSectionState();
  applySectionState(state);
  document.querySelectorAll(".section-header").forEach(function(header) {
    header.addEventListener("click", function(e) {
      if (e.target.closest(".section-action")) return;
      toggleSection(header.dataset.section);
    });
  });
}

// ============================================================
// INIT
// ============================================================
function esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

// Load existing projects or create default
const data = pm.getAll();
if (Object.keys(data.projects).length === 0) {
  const firstKey = Object.keys(EXAMPLES)[0] || "agent";
  pm.createProject("Getting Started", EXAMPLES[firstKey]);
}
loadActiveProject();
initSectionToggles();
renderExamples();
renderDocs();
showDoc("welcome");
createIcons({ icons });
