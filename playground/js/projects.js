import { createIcons, icons } from 'lucide';

const STORAGE_KEY = 'ztore_projects';
let _lastSave = 0;

function now() { return Date.now(); }

function uid() { return crypto.randomUUID?.()?.slice(0, 8) ?? Math.random().toString(36).slice(2, 10); }

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { projects: {}, activeProject: null };
  } catch { return { projects: {}, activeProject: null }; }
}

function saveAll(data) {
  _lastSave = now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const pm = {
  _data: loadAll(),
  _listeners: [],

  onChange(fn) { this._listeners.push(fn); return () => { this._listeners = this._listeners.filter(l => l !== fn); }; },

  _notify() { this._listeners.forEach(fn => fn(this._data)); },

  getAll() { return this._data; },

  getActiveProjectId() { return this._data.activeProject; },

  getActiveProject() {
    const id = this._data.activeProject;
    return id ? this._data.projects[id] ?? null : null;
  },

  getActiveFile() {
    const proj = this.getActiveProject();
    if (!proj) return null;
    return proj.files[proj.activeFile] ?? null;
  },

  listProjects() {
    return Object.values(this._data.projects).sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getProject(id) { return this._data.projects[id] ?? null; },

  getFile(projectId, fileId) {
    const proj = this._data.projects[projectId];
    return proj ? (proj.files[fileId] ?? null) : null;
  },

  createProject(name, templateCode) {
    const fileId = 'f_' + uid();
    const projId = 'p_' + uid();
    const ts = now();
    const proj = {
      id: projId,
      name: name || 'Untitled',
      createdAt: ts,
      updatedAt: ts,
      files: {
        [fileId]: { id: fileId, name: 'main.js', content: templateCode ?? '', language: 'javascript', createdAt: ts, updatedAt: ts },
      },
      activeFile: fileId,
    };
    this._data.projects[projId] = proj;
    this._data.activeProject = projId;
    saveAll(this._data);
    this._notify();
    return projId;
  },

  deleteProject(id) {
    delete this._data.projects[id];
    if (this._data.activeProject === id) {
      const keys = Object.keys(this._data.projects);
      this._data.activeProject = keys.length > 0 ? keys[0] : null;
    }
    saveAll(this._data);
    this._notify();
  },

  renameProject(id, name) {
    const proj = this._data.projects[id];
    if (!proj) return;
    proj.name = name;
    proj.updatedAt = now();
    saveAll(this._data);
    this._notify();
  },

  setActiveProject(id) {
    if (!this._data.projects[id]) return;
    this._data.activeProject = id;
    saveAll(this._data);
    this._notify();
  },

  createFile(projectId, name, content) {
    const proj = this._data.projects[projectId];
    if (!proj) return null;
    const fileId = 'f_' + uid();
    const ts = now();
    proj.files[fileId] = { id: fileId, name: name || 'untitled.js', content: content ?? '', language: 'javascript', createdAt: ts, updatedAt: ts };
    proj.activeFile = fileId;
    proj.updatedAt = ts;
    saveAll(this._data);
    this._notify();
    return fileId;
  },

  deleteFile(projectId, fileId) {
    const proj = this._data.projects[projectId];
    if (!proj || !proj.files[fileId]) return;
    const keys = Object.keys(proj.files);
    if (keys.length <= 1) return;
    delete proj.files[fileId];
    if (proj.activeFile === fileId) {
      const idx = keys.indexOf(fileId);
      proj.activeFile = keys[idx > 0 ? idx - 1 : idx + 1];
    }
    proj.updatedAt = now();
    saveAll(this._data);
    this._notify();
  },

  renameFile(projectId, fileId, name) {
    const proj = this._data.projects[projectId];
    if (!proj || !proj.files[fileId]) return;
    proj.files[fileId].name = name;
    proj.files[fileId].updatedAt = now();
    proj.updatedAt = now();
    saveAll(this._data);
    this._notify();
  },

  setActiveFile(projectId, fileId) {
    const proj = this._data.projects[projectId];
    if (!proj || !proj.files[fileId]) return;
    proj.activeFile = fileId;
    proj.updatedAt = now();
    saveAll(this._data);
    this._notify();
  },

  saveFileContent(projectId, fileId, content) {
    const proj = this._data.projects[projectId];
    if (!proj || !proj.files[fileId]) return;
    proj.files[fileId].content = content;
    proj.files[fileId].updatedAt = now();
    proj.updatedAt = now();
    // Throttle localStorage writes
    if (now() - _lastSave > 300) {
      saveAll(this._data);
    }
    this._notify();
  },

  flush() { saveAll(this._data); },

  importExample(name, code) {
    const pid = this.createProject(name, code);
    return pid;
  },
};
