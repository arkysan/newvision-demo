(function () {
  const ENABLE_KEY = 'newvision.cms.editor';
  const TOKEN_KEY = 'newvision.cms.token';
  const DRAFT_KEY = 'newvision.cms.localDraft';
  const MAX_IMAGE_EDGE = 1600;
  const IMAGE_QUALITY = 0.82;

  const params = new URLSearchParams(location.search);
  const startsEnabled = params.has('edit') || location.hash === '#edit' || localStorage.getItem(ENABLE_KEY) === '1';
  let panelReady = false;
  let state = null;
  let selectedId = null;

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      localStorage.setItem(ENABLE_KEY, '1');
      mountEditor(true);
    }
  });

  if (startsEnabled) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountEditor(false));
    else mountEditor(false);
  }

  function cms() {
    if (!window.newVisionCMS) throw new Error('Site editor bridge is not ready.');
    return window.newVisionCMS;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function currentState() {
    const base = cms().getState();
    const defaults = cms().getDefaultContent();
    return {
      content: Object.assign({}, defaults, base.content || {}),
      vehicles: (base.vehicles || []).map((vehicle) => Object.assign({}, vehicle)),
    };
  }

  function mountEditor(openPanel) {
    if (!panelReady) {
      panelReady = true;
      localStorage.setItem(ENABLE_KEY, '1');
      injectStyles();
      document.body.insertAdjacentHTML('beforeend', editorHtml());
      bindEditor();
      state = currentState();
      const savedDraft = readDraft();
      if (savedDraft) {
        state = savedDraft;
        cms().applyState(clone(state));
      }
      selectedId = state.vehicles[0] && state.vehicles[0].id;
      renderEditor();
      refreshStatus();
      if (savedDraft) setStatus('Local draft loaded in editor preview. Use Save live to publish it.', true);
    }
    if (openPanel) document.getElementById('nvAdminShell').classList.add('open');
  }

  function injectStyles() {
    const css = `
      .nv-admin-fab{position:fixed;right:18px;bottom:86px;z-index:9500;border:0;border-radius:8px;background:#1b5e20;color:white;font-weight:800;padding:12px 15px;box-shadow:0 10px 30px rgba(0,0,0,.18);cursor:pointer}
      .nv-admin-shell{position:fixed;inset:0;z-index:9600;pointer-events:none}
      .nv-admin-shell.open{pointer-events:auto}
      .nv-admin-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.38);opacity:0;transition:opacity .18s}
      .nv-admin-shell.open .nv-admin-backdrop{opacity:1}
      .nv-admin-panel{position:absolute;top:0;right:0;width:min(520px,100vw);height:100%;background:#fbfdf8;border-left:1px solid #d7e4d2;box-shadow:-20px 0 45px rgba(0,0,0,.18);transform:translateX(105%);transition:transform .2s;display:flex;flex-direction:column;color:#142317}
      .nv-admin-shell.open .nv-admin-panel{transform:translateX(0)}
      .nv-admin-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #dfe9dc;background:#fff}
      .nv-admin-head h2{font-size:18px;margin:0;color:#1b5e20}
      .nv-admin-close,.nv-admin-icon{border:1px solid #c9d8c5;background:#fff;border-radius:7px;height:34px;min-width:34px;cursor:pointer;font-weight:800;color:#244c29}
      .nv-admin-body{padding:14px 18px 24px;overflow:auto;display:grid;gap:14px}
      .nv-admin-status{font-size:12px;line-height:1.45;background:#edf7ed;border:1px solid #cfe4cb;border-radius:7px;padding:10px;color:#254d2b}
      .nv-admin-warn{background:#fff6df;border-color:#e8d49b;color:#715214}
      .nv-admin-section{border-top:1px solid #dfe9dc;padding-top:13px}
      .nv-admin-section h3{font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 10px;color:#426248}
      .nv-admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .nv-admin-field{display:grid;gap:4px}
      .nv-admin-field label{font-size:11px;font-weight:800;text-transform:uppercase;color:#607064}
      .nv-admin-field input,.nv-admin-field textarea,.nv-admin-field select{width:100%;border:1px solid #cbdac7;border-radius:7px;background:#fff;padding:9px 10px;font:inherit;font-size:13px;color:#142317}
      .nv-admin-field textarea{min-height:74px;resize:vertical}
      .nv-admin-checks{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:7px}
      .nv-admin-checks label{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700}
      .nv-admin-actions{display:flex;flex-wrap:wrap;gap:8px}
      .nv-admin-actions button,.nv-admin-upload button{border:1px solid #b9ccb5;background:#fff;border-radius:7px;padding:9px 12px;font-weight:800;color:#1f3f24;cursor:pointer}
      .nv-admin-actions .primary,.nv-admin-upload .primary{background:#2e7d32;border-color:#2e7d32;color:#fff}
      .nv-admin-actions .danger{border-color:#d9b1a9;color:#8a2d20}
      .nv-admin-upload{display:grid;gap:8px}
      .nv-admin-upload input[type=file]{font-size:12px}
      .nv-admin-link{font-size:12px;word-break:break-all;color:#176c2a}
      @media (max-width:620px){.nv-admin-grid{grid-template-columns:1fr}.nv-admin-checks{grid-template-columns:1fr}.nv-admin-fab{right:12px;bottom:72px}}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function editorHtml() {
    return `
      <button class="nv-admin-fab" id="nvAdminFab" type="button">Edit Site</button>
      <div class="nv-admin-shell" id="nvAdminShell" aria-hidden="true">
        <div class="nv-admin-backdrop" data-close-admin></div>
        <aside class="nv-admin-panel" aria-label="Site editor">
          <div class="nv-admin-head">
            <h2>New Vision Editor</h2>
            <button class="nv-admin-close" type="button" data-close-admin>Close</button>
          </div>
          <div class="nv-admin-body">
            <div class="nv-admin-status" id="nvAdminStatus">Checking storage...</div>
            <div class="nv-admin-section">
              <h3>Access</h3>
              <div class="nv-admin-field">
                <label for="nvAdminToken">Admin token</label>
                <input id="nvAdminToken" type="password" autocomplete="off" placeholder="Paste admin token">
              </div>
            </div>
            <div class="nv-admin-section">
              <h3>Page text</h3>
              <div id="nvContentFields" class="nv-admin-grid"></div>
            </div>
            <div class="nv-admin-section">
              <h3>Vehicles</h3>
              <div class="nv-admin-field">
                <label for="nvVehicleSelect">Vehicle</label>
                <select id="nvVehicleSelect"></select>
              </div>
              <div id="nvVehicleFields" class="nv-admin-grid" style="margin-top:10px"></div>
              <div class="nv-admin-checks">
                <label><input type="checkbox" data-vehicle-field="ev"> EV/PHEV</label>
                <label><input type="checkbox" data-vehicle-field="hot"> Hot</label>
                <label><input type="checkbox" data-vehicle-field="premium"> Premium</label>
              </div>
              <div class="nv-admin-upload" style="margin-top:12px">
                <input id="nvVehicleImageFile" type="file" accept="image/*">
                <button class="primary" id="nvUploadVehicleImage" type="button">Upload image to selected vehicle</button>
              </div>
              <div class="nv-admin-actions" style="margin-top:12px">
                <button id="nvAddVehicle" type="button">Add vehicle</button>
                <button id="nvDuplicateVehicle" type="button">Duplicate</button>
                <button class="danger" id="nvDeleteVehicle" type="button">Delete local</button>
              </div>
            </div>
            <div class="nv-admin-section">
              <h3>Files</h3>
              <div class="nv-admin-upload">
                <input id="nvAnyFile" type="file">
                <button id="nvUploadAnyFile" type="button">Upload file to Blob CDN</button>
                <div class="nv-admin-link" id="nvLastAsset"></div>
              </div>
            </div>
            <div class="nv-admin-section">
              <h3>Save</h3>
              <div class="nv-admin-actions">
                <button class="primary" id="nvSaveLive" type="button">Save live</button>
                <button id="nvLoadLive" type="button">Reload live</button>
                <button id="nvSaveDraft" type="button">Save local draft</button>
                <button class="danger" id="nvClearDraft" type="button">Clear draft</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    `;
  }

  function bindEditor() {
    document.getElementById('nvAdminFab').addEventListener('click', () => openPanel(true));
    document.querySelectorAll('[data-close-admin]').forEach((el) => el.addEventListener('click', () => openPanel(false)));
    document.getElementById('nvAdminToken').value = localStorage.getItem(TOKEN_KEY) || '';
    document.getElementById('nvAdminToken').addEventListener('input', (event) => localStorage.setItem(TOKEN_KEY, event.target.value.trim()));
    document.getElementById('nvVehicleSelect').addEventListener('change', (event) => {
      selectedId = Number(event.target.value);
      renderVehicleFields();
    });
    document.getElementById('nvAddVehicle').addEventListener('click', addVehicle);
    document.getElementById('nvDuplicateVehicle').addEventListener('click', duplicateVehicle);
    document.getElementById('nvDeleteVehicle').addEventListener('click', deleteVehicle);
    document.getElementById('nvUploadVehicleImage').addEventListener('click', uploadVehicleImage);
    document.getElementById('nvUploadAnyFile').addEventListener('click', uploadAnyFile);
    document.getElementById('nvSaveLive').addEventListener('click', saveLive);
    document.getElementById('nvLoadLive').addEventListener('click', loadLive);
    document.getElementById('nvSaveDraft').addEventListener('click', saveDraft);
    document.getElementById('nvClearDraft').addEventListener('click', clearDraft);
  }

  function openPanel(open) {
    const shell = document.getElementById('nvAdminShell');
    shell.classList.toggle('open', open);
    shell.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function setStatus(message, warn) {
    const status = document.getElementById('nvAdminStatus');
    status.textContent = message;
    status.classList.toggle('nv-admin-warn', Boolean(warn));
  }

  async function refreshStatus() {
    try {
      const res = await fetch('/api/cms?action=status', { cache: 'no-store' });
      const data = await res.json();
      const parts = [
        data.adminConfigured ? 'Admin token configured' : 'Admin token missing',
        data.storageConfigured ? 'Blob storage configured' : 'Blob storage missing',
      ];
      setStatus(parts.join(' | '), !data.adminConfigured || !data.storageConfigured);
    } catch (error) {
      setStatus(`Editor API unavailable: ${error.message}`, true);
    }
  }

  function renderEditor() {
    renderContentFields();
    renderVehicleSelect();
    renderVehicleFields();
  }

  function renderContentFields() {
    const labels = {
      demo_notice: 'Top notice',
      hero_h1: 'Hero headline',
      hero_sub: 'Hero subtitle',
      inv_sub: 'Inventory note',
      showroom_desc: 'Company copy',
    };
    const container = document.getElementById('nvContentFields');
    container.innerHTML = cms().editableContentKeys.map((key) => `
      <div class="nv-admin-field ${key === 'hero_h1' || key === 'showroom_desc' ? 'wide' : ''}">
        <label for="nvContent_${key}">${labels[key] || key}</label>
        <textarea id="nvContent_${key}" data-content-key="${key}">${escapeHtml(state.content[key] || '')}</textarea>
      </div>
    `).join('');
    container.querySelectorAll('[data-content-key]').forEach((el) => {
      el.addEventListener('input', () => {
        state.content[el.dataset.contentKey] = el.value;
        applyPreview();
      });
    });
  }

  function renderVehicleSelect() {
    const select = document.getElementById('nvVehicleSelect');
    select.innerHTML = state.vehicles.map((v) => `<option value="${v.id}">${v.id} - ${escapeHtml(v.make)} ${escapeHtml(v.model)}</option>`).join('');
    if (!state.vehicles.some((v) => v.id === selectedId)) selectedId = state.vehicles[0] && state.vehicles[0].id;
    if (selectedId) select.value = String(selectedId);
  }

  function selectedVehicle() {
    return state.vehicles.find((vehicle) => vehicle.id === selectedId) || null;
  }

  function renderVehicleFields() {
    const vehicle = selectedVehicle();
    const container = document.getElementById('nvVehicleFields');
    if (!vehicle) {
      container.innerHTML = '<div class="nv-admin-status nv-admin-warn">No vehicle selected.</div>';
      return;
    }
    const fields = [
      ['make', 'Make'], ['model', 'Model'], ['year', 'Year'], ['price', 'FOB price'],
      ['mileage', 'Mileage'], ['condition', 'Condition'], ['type', 'Type'], ['fuel', 'Fuel'],
      ['body', 'Body'], ['trans', 'Transmission'], ['engine', 'Engine'], ['drive', 'Drive'],
      ['doors', 'Doors'], ['seats', 'Seats'], ['range_km', 'EV range km'], ['img', 'Image URL'],
    ];
    container.innerHTML = fields.map(([key, label]) => {
      if (key === 'condition') {
        return `<div class="nv-admin-field"><label>${label}</label><select data-vehicle-field="${key}"><option${vehicle[key] === 'New' ? ' selected' : ''}>New</option><option${vehicle[key] === 'Used' ? ' selected' : ''}>Used</option></select></div>`;
      }
      return `<div class="nv-admin-field"><label>${label}</label><input data-vehicle-field="${key}" value="${escapeHtml(vehicle[key] == null ? '' : vehicle[key])}"></div>`;
    }).join('');

    document.querySelectorAll('[data-vehicle-field]').forEach((el) => {
      if (el.type === 'checkbox') el.checked = Boolean(vehicle[el.dataset.vehicleField]);
      el.oninput = updateVehicleFromFields;
      el.onchange = updateVehicleFromFields;
    });
  }

  function updateVehicleFromFields() {
    const vehicle = selectedVehicle();
    if (!vehicle) return;
    document.querySelectorAll('[data-vehicle-field]').forEach((el) => {
      const key = el.dataset.vehicleField;
      const value = el.type === 'checkbox' ? el.checked : el.value;
      if (['id', 'year', 'price', 'mileage', 'doors', 'seats', 'range_km'].includes(key)) {
        vehicle[key] = value === '' ? null : Number(value);
      } else {
        vehicle[key] = value;
      }
    });
    applyPreview();
    renderVehicleSelect();
  }

  function applyPreview() {
    cms().applyState(clone(state));
  }

  function nextId() {
    return Math.max(0, ...state.vehicles.map((vehicle) => Number(vehicle.id) || 0)) + 1;
  }

  function addVehicle() {
    const id = nextId();
    state.vehicles.unshift({
      id,
      make: 'New Brand',
      model: 'New model',
      year: new Date().getFullYear(),
      mileage: 0,
      condition: 'New',
      type: 'SUV',
      fuel: 'Petrol',
      body: 'SUV',
      price: 15000,
      img: '',
      ev: false,
      hot: false,
      premium: false,
      trans: 'Auto',
      engine: '',
      drive: 'FWD',
      doors: 4,
      seats: 5,
      range_km: null,
    });
    selectedId = id;
    renderEditor();
    applyPreview();
  }

  function duplicateVehicle() {
    const vehicle = selectedVehicle();
    if (!vehicle) return;
    const copy = Object.assign({}, vehicle, { id: nextId(), model: `${vehicle.model} Copy` });
    state.vehicles.unshift(copy);
    selectedId = copy.id;
    renderEditor();
    applyPreview();
  }

  function deleteVehicle() {
    const vehicle = selectedVehicle();
    if (!vehicle) return;
    if (!confirm(`Delete ${vehicle.make} ${vehicle.model} from this draft?`)) return;
    state.vehicles = state.vehicles.filter((item) => item.id !== vehicle.id);
    selectedId = state.vehicles[0] && state.vehicles[0].id;
    renderEditor();
    applyPreview();
  }

  async function uploadVehicleImage() {
    const file = document.getElementById('nvVehicleImageFile').files[0];
    const vehicle = selectedVehicle();
    if (!file || !vehicle) return setStatus('Choose an image and a vehicle first.', true);
    try {
      setStatus('Compressing and uploading vehicle image...');
      const prepared = await prepareUploadFile(file, true);
      const asset = await postUpload(prepared);
      vehicle.img = asset.url;
      renderVehicleFields();
      applyPreview();
      setStatus(`Uploaded image to Blob CDN: ${asset.url}`);
    } catch (error) {
      setStatus(`Upload failed: ${error.message}`, true);
    }
  }

  async function uploadAnyFile() {
    const file = document.getElementById('nvAnyFile').files[0];
    if (!file) return setStatus('Choose a file first.', true);
    try {
      setStatus('Uploading file to Blob CDN...');
      const asset = await postUpload(await prepareUploadFile(file, false));
      document.getElementById('nvLastAsset').innerHTML = `<a href="${asset.url}" target="_blank" rel="noreferrer">${asset.url}</a>`;
      navigator.clipboard?.writeText(asset.url).catch(() => {});
      setStatus('File uploaded. URL copied if clipboard access is available.');
    } catch (error) {
      setStatus(`Upload failed: ${error.message}`, true);
    }
  }

  async function prepareUploadFile(file, compressImage) {
    if (!compressImage || !file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
      return { name: file.name, type: file.type || 'application/octet-stream', data: await fileToBase64(file) };
    }

    const bitmap = await loadImage(file);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', IMAGE_QUALITY));
    if (!blob) throw new Error('Image compression failed.');
    const base = file.name.replace(/\.[^.]+$/, '');
    return { name: `${base}.webp`, type: 'image/webp', data: await fileToBase64(blob) };
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image could not be decoded.'));
      };
      img.src = url;
    });
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(new Error('File read failed.'));
      reader.readAsDataURL(file);
    });
  }

  async function postUpload(file) {
    const token = localStorage.getItem(TOKEN_KEY) || '';
    const res = await fetch('/api/cms?action=upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-newvision-admin-token': token },
      body: JSON.stringify(file),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.message || 'Server upload failed.');
    return data.asset;
  }

  async function saveLive() {
    const token = localStorage.getItem(TOKEN_KEY) || '';
    try {
      setStatus('Saving live state...');
      const res = await fetch('/api/cms?action=state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-newvision-admin-token': token },
        body: JSON.stringify({ state }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Save failed.');
      state = {
        content: Object.assign({}, cms().getDefaultContent(), data.state.content || {}),
        vehicles: data.state.vehicles || [],
      };
      cms().applyState(clone(state));
      localStorage.removeItem(DRAFT_KEY);
      setStatus(`Live site saved at ${data.state.updatedAt}.`);
    } catch (error) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
      setStatus(`Live save failed; saved local draft only. ${error.message}`, true);
    }
  }

  async function loadLive() {
    try {
      setStatus('Loading live state...');
      const data = await cms().reloadState?.();
      const res = data || await fetch('/api/cms?action=state', { cache: 'no-store' }).then((r) => r.json());
      if (!res.ok) throw new Error(res.message || 'Load failed.');
      if (res.state) {
        cms().applyState(res.state);
        state = currentState();
        selectedId = state.vehicles[0] && state.vehicles[0].id;
        renderEditor();
        setStatus('Live state loaded.');
      } else {
        setStatus('No live edits saved yet; using built-in site content.', true);
      }
    } catch (error) {
      setStatus(`Live load failed: ${error.message}`, true);
    }
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    setStatus('Local draft saved in this browser only. Use Save live to publish.');
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setStatus('Local draft cleared.');
  }

  function readDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.vehicles)) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
