const SoundscapeMixer = (function () {

  const CATEGORIES = [
    {
      id: "forest",
      name: "Forest sounds",
      layers: [
        { id: "wind",         name: "Wind",          desc: "Low steady gust",  file: "assets/sounds/forest/Wind.mp3" },
        { id: "leaves",       name: "Leaves",        desc: "Rustling canopy",  file: "assets/sounds/forest/Leaves.mp3" },
        { id: "flowingwater", name: "Flowing Water", desc: "Flowing water",    file: "assets/sounds/forest/Flowingwater.mp3" },
        { id: "birdsongs",    name: "Birdsongs",     desc: "Distant birdsong", file: "assets/sounds/forest/Birdsongs.mp3" },
      ],
    },
    {
      id: "rain",
      name: "Rain sounds",
      layers: [
        { id: "light-rain", name: "Light Rain", desc: "Soft steady rainfall", file: "assets/sounds/rain/LightRain.mp3" },
        { id: "heavy-rain", name: "Heavy Rain", desc: "Dense downpour",       file: "assets/sounds/rain/HeavyRain.mp3" },
        { id: "thunder",    name: "Thunder",    desc: "Distant rolling thunder", file: "assets/sounds/rain/Thunder.mp3" },
        { id: "gutter",     name: "Window Drips", desc: "Water on glass/gutter", file: "assets/sounds/rain/WindowDrips.mp3" },
      ],
    },
    {
      id: "ocean",
      name: "Ocean sounds",
      layers: [
        { id: "waves",     name: "Waves",       desc: "Rolling shoreline waves", file: "assets/sounds/ocean/Waves.mp3" },
        { id: "seagulls",  name: "Seagulls",    desc: "Distant seagulls",        file: "assets/sounds/ocean/Seagulls.mp3" },
        { id: "beach-walking", name: "Walking on beach", desc: "Walking on stoned beach", file: "assets/sounds/ocean/Walkingonbeach.mp3" },
      ],
    },
    {
      id: "night",
      name: "Night sounds",
      layers: [
        { id: "crickets",   name: "Crickets",    desc: "Steady night crickets", file: "assets/sounds/night/Crickets.mp3" },
        { id: "owl",        name: "Owl",         desc: "Distant owl calls",     file: "assets/sounds/night/Owl.mp3" },
        { id: "white-noise",name: "White Noise", desc: "Soft Soothing White Noise", file: "assets/sounds/night/Whitenoise.mp3" },
      ],
    },
  ];

  let ctx = null;
  let masterGain = null;
  const categoryGains = {};    // categoryId -> GainNode (per-category volume bus)
  const categoryPlaying = {};  // categoryId -> bool
  const nodes = {};            // "<categoryId>:<layerId>" -> { src, gain, active }
  const bufferCache = {};

  const STORAGE_KEY = "vss-soundscape-mixes";

  // ---- Saved mixes (localStorage) ---------------------------------------
  function loadSavedMixes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn("Could not read saved mixes from localStorage.", err);
      return [];
    }
  }

  function persistSavedMixes(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (err) {
      console.warn("Could not save mix to localStorage.", err);
      return false;
    }
  }

  function getCurrentMixState(els) {
    const state = { categoryLevels: {}, layers: {} };
    CATEGORIES.forEach(category => {
      state.categoryLevels[category.id] = Number(els.categorySliders[category.id].value);
      category.layers.forEach(layer => {
        const key = keyFor(category.id, layer.id);
        const row = document.getElementById(`settings-row-${key}`);
        if (!row) return;
        state.layers[key] = { on: row.querySelector(".toggle").classList.contains("on") };
      });
    });
    return state;
  }

  async function applyMixState(state, els) {
    CATEGORIES.forEach(category => {
      const level = state.categoryLevels ? state.categoryLevels[category.id] : undefined;
      if (level !== undefined) {
        els.categorySliders[category.id].value = level;
        updateCategoryValueLabel(category.id, level, els);
        if (categoryPlaying[category.id]) {
          setCategoryLevelLive(category.id, level);
        }
      }
    });

    for (const category of CATEGORIES) {
      for (const layer of category.layers) {
        const key = keyFor(category.id, layer.id);
        const saved = state.layers ? state.layers[key] : null;
        if (!saved) continue;

        const row = document.getElementById(`settings-row-${key}`);
        const toggleBtn = row.querySelector(".toggle");
        const currentlyOn = toggleBtn.classList.contains("on");

        if (saved.on !== currentlyOn) {
          await toggleLayer(category, layer, key, els);
        }
      }
    }
    updateSaveButtonState(els);
  }

  function ensureContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.9;
      masterGain.connect(ctx.destination);

      CATEGORIES.forEach(category => {
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(masterGain);
        categoryGains[category.id] = gain;
        categoryPlaying[category.id] = false;
      });
    }
    return ctx;
  }

  function keyFor(categoryId, layerId) {
    return `${categoryId}:${layerId}`;
  }

  async function loadBuffer(context, key, layer) {
    if (bufferCache[key]) return bufferCache[key];
    const response = await fetch(layer.file);
    if (!response.ok) {
      throw new Error(`Could not load ${layer.name} (${response.status} ${response.statusText}).`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    bufferCache[key] = audioBuffer;
    return audioBuffer;
  }

  async function buildSource(context, key, layer) {
    const buffer = await loadBuffer(context, key, layer);
    const src = context.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  function updateCategoryValueLabel(categoryId, value, els) {
    els.categoryValueLabels[categoryId].textContent = `${value}%`;
  }

  // Ramps a category's bus to its slider value — only actually heard if
  // that category is currently "playing".
  function setCategoryLevelLive(categoryId, value) {
    const gain = categoryGains[categoryId];
    gain.gain.linearRampToValueAtTime(value / 100, ctx.currentTime + 0.05);
  }

  function buildMarkup(root) {
    const columns = CATEGORIES.map(category => `
      <div class="category-col" data-cat="${category.id}">
        <span class="category-label">${category.name}</span>
        <div class="vertical-slider-track">
          <input type="range" class="vertical-slider" orient="vertical"
                 min="0" max="100" value="60" data-cat="${category.id}">
        </div>
        <span class="category-value">60%</span>
        <div class="category-controls">
          <button class="col-play-btn" type="button" data-cat="${category.id}" aria-label="Play ${category.name}">▶</button>
          <button class="col-settings-btn" type="button" data-cat="${category.id}" aria-label="${category.name} settings">⚙</button>
        </div>
      </div>
    `).join("");



    root.innerHTML = `
      <div class="ssMixer">
        <div class="card">
          <div class="slider-row">${columns}</div>
          <div class="mixes-row">
            <button class="mixes-toggle-btn" type="button">Saved mixes</button>
          </div>
        </div>
      </div>

      <div class="settings-overlay" hidden>
        <div class="settings-panel">
          <div class="settings-header">
            <h2 class="settings-title">Settings</h2>
            <button class="settings-close" type="button" aria-label="Close settings">✕</button>
          </div>
          <div class="settings-body">
            <div class="settings-categories"></div>
          </div>
        </div>
      </div>

      <div class="mixes-overlay" hidden>
        <div class="settings-panel">
          <div class="settings-header">
            <h2 class="settings-title">Saved mixes</h2>
            <button class="mixes-close" type="button" aria-label="Close saved mixes">✕</button>
          </div>
          <div class="settings-body">
            <div class="save-row">
              <input type="text" class="mix-name-input" placeholder="Name this mix" maxlength="40">
              <button class="save-mix-btn" type="button">Save mix</button>
            </div>
            <div class="my-mixes">
              <div class="my-mixes-list"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const categorySliders = {};
    const categoryValueLabels = {};
    CATEGORIES.forEach(category => {
      categorySliders[category.id] = root.querySelector(`.vertical-slider[data-cat="${category.id}"]`);
      categoryValueLabels[category.id] = root.querySelector(`.category-col[data-cat="${category.id}"] .category-value`);
    });

    return {
      wrapper: root.querySelector(".ssMixer"),
      settingsOverlay: root.querySelector(".settings-overlay"),
      settingsTitle: root.querySelector(".settings-overlay .settings-title"),
      settingsCategoriesEl: root.querySelector(".settings-categories"),
      settingsCloseBtn: root.querySelector(".settings-close"),
      mixesOverlay: root.querySelector(".mixes-overlay"),
      mixesToggleBtn: root.querySelector(".mixes-toggle-btn"),
      mixesCloseBtn: root.querySelector(".mixes-close"),
      mixNameInput: root.querySelector(".mix-name-input"),
      saveMixBtn: root.querySelector(".save-mix-btn"),
      myMixesList: root.querySelector(".my-mixes-list"),
      categorySliders,
      categoryValueLabels,
      activeMixId: null,
    };
  }

  function updateSaveButtonState(els) {
    const anyActive = Object.values(nodes).some(n => n.active);
    els.saveMixBtn.disabled = !anyActive;
  }

  function renderSavedMixesList(els) {
    const mixes = loadSavedMixes();
    els.myMixesList.innerHTML = "";

    if (mixes.length === 0) {
      els.myMixesList.innerHTML = `<p class="no-mixes">No saved mixes yet.</p>`;
      return;
    }

    mixes.forEach(mix => {
      const row = document.createElement("div");
      row.className = "mix-row";
      const isPlayingMix = els.activeMixId === mix.id;
      row.innerHTML = `
        <span class="mix-row-name">${mix.name}</span>
        <button class="mix-load-btn ${isPlayingMix ? "playing" : ""}" type="button">${isPlayingMix ? "Loaded" : "Load"}</button>
        <button class="mix-delete-btn" type="button" aria-label="Delete ${mix.name}">✕</button>
      `;
      row.querySelector(".mix-load-btn").addEventListener("click", async () => {
        await applyMixState(mix.state, els);
        els.activeMixId = mix.id;
        renderSavedMixesList(els);
      });
      row.querySelector(".mix-delete-btn").addEventListener("click", () => {
        const remaining = loadSavedMixes().filter(m => m.id !== mix.id);
        persistSavedMixes(remaining);
        if (els.activeMixId === mix.id) els.activeMixId = null;
        renderSavedMixesList(els);
      });
      els.myMixesList.appendChild(row);
    });
  }

  // ---- Settings content ----
  function buildSettingsCategoryUI(category, els) {
    const section = document.createElement("div");
    section.className = "settings-category";
    section.dataset.cat = category.id;
    section.style.display = "none";

    section.innerHTML = `<div class="settings-category-body"></div>`;
    els.settingsCategoriesEl.appendChild(section);

    const body = section.querySelector(".settings-category-body");

    category.layers.forEach(layer => {
      const key = keyFor(category.id, layer.id);
      const row = document.createElement("div");
      row.className = "layer";
      row.id = `settings-row-${key}`;
      row.innerHTML = `
        <button class="toggle" aria-label="Toggle ${layer.name}"></button>
        <div class="layer-info">
          <div class="layer-name">${layer.name}</div>
          <div class="layer-desc">${layer.desc}</div>
        </div>
      `;
      body.appendChild(row);

      const toggleBtn = row.querySelector(".toggle");
      toggleBtn.addEventListener("click", () => toggleLayer(category, layer, key, els));
    });
  }

  async function toggleLayer(category, layer, key, els) {
    const context = ensureContext();
    if (context.state === "suspended") await context.resume();

    let node = nodes[key];

    if (!node) node = await createLayerNode(context, category, layer, key);

    const row = document.getElementById(`settings-row-${key}`);
    const toggleBtn = row.querySelector(".toggle");
    const now = context.currentTime;

    node.active = !node.active;
    node.gain.gain.cancelScheduledValues(now);
    node.gain.gain.setValueAtTime(node.gain.gain.value, now);
    node.gain.gain.linearRampToValueAtTime(node.active ? 1 : 0, now + 0.4);

    toggleBtn.classList.toggle("on", node.active);
    row.classList.toggle("active", node.active);
    updateSaveButtonState(els);
  }

  async function createLayerNode(context, category, layer, key) {
    const src = await buildSource(context, key, layer);
    const gain = context.createGain();
    gain.gain.value = 0;
    src.connect(gain);
    gain.connect(categoryGains[category.id]);
    src.start();
    const node = { src, gain, active: false };
    nodes[key] = node;
    return node;
  }

  // A play button should always produce a sound. If the visitor has not
  // selected a layer in this category yet, start its first layer for them.
  async function ensureCategoryHasLayer(category, els) {
    const hasActiveLayer = category.layers.some(layer => nodes[keyFor(category.id, layer.id)]?.active);
    if (hasActiveLayer) return;

    const layer = category.layers[0];
    const key = keyFor(category.id, layer.id);
    const context = ensureContext();
    const node = nodes[key] || await createLayerNode(context, category, layer, key);
    const now = context.currentTime;
    node.active = true;
    node.gain.gain.cancelScheduledValues(now);
    node.gain.gain.setValueAtTime(node.gain.gain.value, now);
    node.gain.gain.linearRampToValueAtTime(1, now + 0.15);

    const row = document.getElementById(`settings-row-${key}`);
    row.querySelector(".toggle").classList.add("on");
    row.classList.add("active");
    updateSaveButtonState(els);
  }

  // ---- Public mount function --------------------------------------------
  function mount(container) {
    if (!container) {
      console.error("SoundscapeMixer.mount() needs a container element.");
      return;
    }

    const els = buildMarkup(container);

    CATEGORIES.forEach(category => buildSettingsCategoryUI(category, els));
    renderSavedMixesList(els);
    updateSaveButtonState(els);

    // ---- Vertical sliders ----
    CATEGORIES.forEach(category => {
      els.categorySliders[category.id].addEventListener("input", (e) => {
        const value = Number(e.target.value);
        updateCategoryValueLabel(category.id, value, els);
        if (categoryPlaying[category.id]) {
          ensureContext();
          setCategoryLevelLive(category.id, value);
        }
      });
    });

    // ---- Per-column Play / Stop ----
    container.querySelectorAll(".col-play-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const catId = btn.dataset.cat;
        const context = ensureContext();
        if (context.state === "suspended") await context.resume();

        const category = CATEGORIES.find(item => item.id === catId);
        if (!categoryPlaying[catId]) {
          try {
            await ensureCategoryHasLayer(category, els);
          } catch (err) {
            console.error("Unable to start sound layer.", err);
            return;
          }
        }

        categoryPlaying[catId] = !categoryPlaying[catId];
        const now = context.currentTime;
        const gain = categoryGains[catId];
        const targetLevel = els.categorySliders[catId].value / 100;

        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(categoryPlaying[catId] ? targetLevel : 0, now + 0.5);

        btn.textContent = categoryPlaying[catId] ? "⏸" : "▶";
      });
    });

    // ---- Per-column Settings ----
    container.querySelectorAll(".col-settings-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const catId = btn.dataset.cat;
        const category = CATEGORIES.find(c => c.id === catId);

        container.querySelectorAll(".settings-category").forEach(section => {
          section.style.display = section.dataset.cat === catId ? "block" : "none";
        });
        els.settingsTitle.textContent = `${category.name} settings`;
        els.settingsOverlay.hidden = false;
      });
    });
    els.settingsCloseBtn.addEventListener("click", () => { els.settingsOverlay.hidden = true; });
    els.settingsOverlay.addEventListener("click", (e) => {
      if (e.target === els.settingsOverlay) els.settingsOverlay.hidden = true;
    });

    // ---- Saved mixes panel ----
    // It just works locally, not connected to any account


    els.mixesToggleBtn.addEventListener("click", () => { els.mixesOverlay.hidden = false; });
    els.mixesCloseBtn.addEventListener("click", () => { els.mixesOverlay.hidden = true; });
    els.mixesOverlay.addEventListener("click", (e) => {
      if (e.target === els.mixesOverlay) els.mixesOverlay.hidden = true;
    });

    els.saveMixBtn.addEventListener("click", () => {
      const name = els.mixNameInput.value.trim();
      if (!name) {
        els.mixNameInput.focus();
        return;
      }
      const mixes = loadSavedMixes();
      mixes.push({
        id: `mix-${Date.now()}`,
        name,
        state: getCurrentMixState(els),
      });
      const ok = persistSavedMixes(mixes);
      if (ok) {
        els.mixNameInput.value = "";
        renderSavedMixesList(els);
      }
    });
  }

  return { mount };
})();
