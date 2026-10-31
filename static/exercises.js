// Dual-Mode Exercise Library Client Script: 90-Day Plan (64) + Global ExerciseDB (1,324 Animated GIFs)

let currentMode = 'plan'; // 'plan' or 'catalog'

// State for 90-Day Plan Mode
let planExercises = [];
let filteredPlanExercises = [];
let activePlanGroup = 'All';

// State for ExerciseDB Catalog Mode (1,324 exercises)
let catalogExercises = [];
let catalogTotal = 0;
let catalogSkip = 0;
const CATALOG_PAGE_SIZE = 48;
let catalogBodyParts = [];
let activeCatalogPart = 'All';

let activeEquipment = 'All';
let searchQuery = '';

const PLAN_GROUPS = [
  'All',
  'Chest',
  'Shoulders',
  'Back',
  'Arms',
  'Legs & Glutes',
  'Core & Conditioning',
  'Warm-Up & Mobility',
  'Cardio',
  'Cool-Down Stretches'
];

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadInitialData();
});

function setupEventListeners() {
  const searchInput = document.getElementById('exercise-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = e.target.value.toLowerCase().trim();
        const clearBtn = document.getElementById('search-clear-btn');
        if (clearBtn) {
          if (searchQuery) clearBtn.classList.remove('hidden');
          else clearBtn.classList.add('hidden');
        }
        if (currentMode === 'plan') {
          applyPlanFilters();
        } else {
          catalogSkip = 0;
          catalogExercises = [];
          loadCatalogExercises();
        }
      }, 250);
    });
  }

  const equipSelect = document.getElementById('equipment-filter-select');
  if (equipSelect) {
    equipSelect.addEventListener('change', (e) => {
      activeEquipment = e.target.value;
      if (currentMode === 'plan') {
        applyPlanFilters();
      } else {
        catalogSkip = 0;
        catalogExercises = [];
        loadCatalogExercises();
      }
    });
  }
}

function clearSearch() {
  const searchInput = document.getElementById('exercise-search-input');
  if (searchInput) searchInput.value = '';
  searchQuery = '';
  document.getElementById('search-clear-btn').classList.add('hidden');
  if (currentMode === 'plan') {
    applyPlanFilters();
  } else {
    catalogSkip = 0;
    catalogExercises = [];
    loadCatalogExercises();
  }
}

async function loadInitialData() {
  await Promise.all([
    loadPlanExercises(),
    loadCatalogMetadata()
  ]);
}

// -------------------------------------------------------------
// MODE SWITCHER: 'plan' vs 'catalog'
// -------------------------------------------------------------
function switchLibraryMode(mode) {
  if (currentMode === mode) return;
  currentMode = mode;

  const btnPlan = document.getElementById('btn-mode-plan');
  const btnCatalog = document.getElementById('btn-mode-catalog');

  if (mode === 'plan') {
    btnPlan.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 bg-indigo-600 text-white shadow-md shadow-indigo-600/30";
    btnCatalog.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 text-slate-400 hover:text-white";
    
    renderPlanCategoryTabs();
    populatePlanEquipment();
    applyPlanFilters();
  } else {
    btnCatalog.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 bg-cyan-600 text-white shadow-md shadow-cyan-600/30";
    btnPlan.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 text-slate-400 hover:text-white";

    renderCatalogCategoryTabs();
    populateCatalogEquipment();
    if (catalogExercises.length === 0) {
      catalogSkip = 0;
      loadCatalogExercises();
    } else {
      renderCatalogGrid();
    }
  }
}

// -------------------------------------------------------------
// 1. 90-DAY PLAN ROUTINE (64 EXERCISES WITH 2-PHOTO DEMOS)
// -------------------------------------------------------------
async function loadPlanExercises() {
  try {
    const res = await fetch('/api/exercises');
    const data = await res.json();
    planExercises = data.exercises || [];
    if (currentMode === 'plan') {
      renderPlanCategoryTabs();
      populatePlanEquipment();
      applyPlanFilters();
    }
  } catch (err) {
    console.error("Error loading plan exercises:", err);
  }
}

function renderPlanCategoryTabs() {
  const container = document.getElementById('category-tabs-container');
  if (!container) return;

  const counts = { 'All': planExercises.length };
  planExercises.forEach(ex => {
    const bg = ex.body_group || 'Other';
    counts[bg] = (counts[bg] || 0) + 1;
  });

  container.innerHTML = PLAN_GROUPS.map(g => {
    const count = counts[g] || 0;
    const isActive = activePlanGroup === g;
    return `
      <button 
        type="button" 
        onclick="setPlanGroupFilter('${g}')"
        class="tab-btn px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 shrink-0 ${
          isActive 
            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25' 
            : 'bg-dark-900/90 text-slate-300 hover:text-white border border-slate-800'
        }">
        <span>${g}</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] ${
          isActive ? 'bg-dark-950/40 text-white font-black' : 'bg-dark-800 text-slate-400'
        }">${count}</span>
      </button>
    `;
  }).join('');
}

function setPlanGroupFilter(group) {
  activePlanGroup = group;
  renderPlanCategoryTabs();
  applyPlanFilters();
}

function populatePlanEquipment() {
  const equipSelect = document.getElementById('equipment-filter-select');
  if (!equipSelect) return;

  const equipSet = new Set();
  planExercises.forEach(ex => {
    if (ex.equipment) {
      ex.equipment.split(/[/,&]/).forEach(e => {
        const clean = e.trim();
        if (clean && clean.length > 2) equipSet.add(clean);
      });
    }
  });

  const sorted = Array.from(equipSet).sort();
  equipSelect.innerHTML = `<option value="All">All Equipment (${planExercises.length})</option>` + 
    sorted.map(eq => `<option value="${eq}">${eq}</option>`).join('');
}

function applyPlanFilters() {
  filteredPlanExercises = planExercises.filter(ex => {
    if (activePlanGroup !== 'All') {
      if ((ex.body_group || '').toLowerCase() !== activePlanGroup.toLowerCase()) {
        return false;
      }
    }
    if (activeEquipment !== 'All') {
      if (!ex.equipment || !ex.equipment.toLowerCase().includes(activeEquipment.toLowerCase())) {
        return false;
      }
    }
    if (searchQuery) {
      const name = (ex.display_name || '').toLowerCase();
      const cat = (ex.category || '').toLowerCase();
      const equip = (ex.equipment || '').toLowerCase();
      const pMuscles = (ex.primary_muscles || []).map(m => m.toLowerCase()).join(' ');
      const sMuscles = (ex.secondary_muscles || []).map(m => m.toLowerCase()).join(' ');
      const cues = (ex.form_cues || []).join(' ').toLowerCase();

      return name.includes(searchQuery) ||
        cat.includes(searchQuery) ||
        equip.includes(searchQuery) ||
        pMuscles.includes(searchQuery) ||
        sMuscles.includes(searchQuery) ||
        cues.includes(searchQuery);
    }
    return true;
  });

  renderPlanGrid();
}

function renderPlanGrid() {
  const container = document.getElementById('exercises-grid');
  const countBadge = document.getElementById('result-count-badge');
  if (countBadge) {
    countBadge.innerText = `Showing ${filteredPlanExercises.length} of ${planExercises.length} plan exercises`;
  }

  if (filteredPlanExercises.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-14 text-center text-slate-400 bg-dark-850/60 rounded-2xl border border-slate-800 p-8">
        <i data-lucide="search-x" class="w-12 h-12 mx-auto mb-3 text-slate-600"></i>
        <h3 class="text-base font-bold text-white mb-1">No plan exercises match your filter</h3>
        <p class="text-xs text-slate-400 mb-4">Try clearing your search keyword or switching category tab.</p>
        <button onclick="clearSearch(); setPlanGroupFilter('All');" class="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500">
          Reset Filters
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = filteredPlanExercises.map(ex => {
    const images = ex.images || [];
    const cues = ex.form_cues || [];
    const firstCue = cues.length > 0 ? cues[0] : 'Perform with strict form and full control.';

    return `
      <div class="glass-panel bg-dark-850 rounded-2xl border border-slate-800 hover:border-slate-700 p-3.5 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-indigo-950/20">
        <div>
          <!-- Badges -->
          <div class="flex items-center justify-between gap-1.5 mb-2.5">
            <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border bg-indigo-950/40 text-indigo-300 border-indigo-500/30">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              <span>${ex.body_group || ex.category}</span>
            </span>
            <span class="text-[10px] text-slate-400 truncate max-w-[130px]" title="${ex.equipment || 'Gym Equipment'}">
              ${ex.equipment || 'Gym Equipment'}
            </span>
          </div>

          <!-- 2-Position Photos -->
          <div class="grid grid-cols-2 gap-1.5 mb-3 rounded-xl overflow-hidden bg-dark-900 border border-slate-800/80 p-1">
            ${images.map((img, idx) => `
              <div class="relative h-28 sm:h-32 rounded-lg overflow-hidden bg-dark-950 cursor-pointer group/img" onclick="openExerciseGuideModal('${ex.display_name || ex.key}')">
                <img src="${img}" alt="${ex.display_name} position ${idx+1}" 
                  class="w-full h-full object-cover object-center group-hover/img:scale-105 transition duration-300"
                  loading="lazy">
                <span class="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-dark-950/80 text-cyan-300 border border-slate-700">
                  ${idx === 0 ? '1. Start' : '2. Peak'}
                </span>
              </div>
            `).join('')}
          </div>

          <!-- Title -->
          <h3 class="text-sm sm:text-base font-bold text-white font-heading group-hover:text-indigo-300 transition mb-1 leading-snug">
            ${ex.display_name || ex.key}
          </h3>

          <!-- Muscles -->
          <div class="flex flex-wrap gap-1 mb-2.5">
            ${(ex.primary_muscles || []).slice(0, 2).map(m => `
              <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                ${m}
              </span>
            `).join('')}
            ${(ex.secondary_muscles || []).slice(0, 1).map(m => `
              <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-dark-800 text-slate-400 border border-slate-700">
                ${m}
              </span>
            `).join('')}
          </div>

          <!-- Cue Snippet -->
          <p class="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-dark-900/60 p-2 rounded-lg border border-slate-800/60 mb-3">
            ${firstCue}
          </p>
        </div>

        <!-- Buttons -->
        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <button 
            type="button" 
            onclick="openExerciseGuideModal('${ex.display_name || ex.key}')" 
            class="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 flex items-center justify-center space-x-1.5 transition active:scale-95">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            <span>Photos & Form</span>
          </button>

          <a 
            href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.video_query || `how to do ${ex.display_name} exercise form`)}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 flex items-center justify-center space-x-1 transition active:scale-95">
            <i data-lucide="play" class="w-3.5 h-3.5 fill-rose-300"></i>
            <span class="hidden sm:inline">Video</span>
          </a>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// -------------------------------------------------------------
// 2. EXERCISEDB GLOBAL (1,324 ANIMATED GIFS & INSTRUCTIONS)
// -------------------------------------------------------------
async function loadCatalogMetadata() {
  try {
    const res = await fetch('/api/catalog/filters');
    const data = await res.json();
    catalogBodyParts = ['All', ...(data.body_parts || [])];
    catalogTotal = data.total_exercises || 1324;
  } catch (err) {
    console.error("Error loading catalog metadata:", err);
  }
}

function renderCatalogCategoryTabs() {
  const container = document.getElementById('category-tabs-container');
  if (!container) return;

  container.innerHTML = catalogBodyParts.map(part => {
    const isActive = activeCatalogPart.toLowerCase() === part.toLowerCase();
    return `
      <button 
        type="button" 
        onclick="setCatalogPartFilter('${part}')"
        class="tab-btn px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 shrink-0 ${
          isActive 
            ? 'bg-cyan-500 text-dark-900 shadow-md shadow-cyan-500/25 font-extrabold' 
            : 'bg-dark-900/90 text-slate-300 hover:text-white border border-slate-800'
        }">
        <span>${part}</span>
      </button>
    `;
  }).join('');
}

function setCatalogPartFilter(part) {
  activeCatalogPart = part;
  renderCatalogCategoryTabs();
  catalogSkip = 0;
  catalogExercises = [];
  loadCatalogExercises();
}

async function populateCatalogEquipment() {
  const equipSelect = document.getElementById('equipment-filter-select');
  if (!equipSelect) return;

  try {
    const res = await fetch('/api/catalog/filters');
    const data = await res.json();
    const sorted = data.equipment || [];
    equipSelect.innerHTML = `<option value="All">All Equipment (1,324)</option>` + 
      sorted.map(eq => `<option value="${eq}">${eq}</option>`).join('');
  } catch (err) {
    console.error("Error populating catalog equipment:", err);
  }
}

async function loadCatalogExercises(append = false) {
  const container = document.getElementById('exercises-grid');
  const countBadge = document.getElementById('result-count-badge');

  if (!append) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400"></i>
        <p class="text-sm font-semibold">Querying MongoDB Atlas ExerciseDB Collection (1,324 exercises)...</p>
      </div>
    `;
    lucide.createIcons();
  }

  try {
    const params = new URLSearchParams({
      limit: CATALOG_PAGE_SIZE,
      skip: catalogSkip
    });

    if (activeCatalogPart !== 'All') params.set('body_part', activeCatalogPart);
    if (activeEquipment !== 'All') params.set('equipment', activeEquipment);
    if (searchQuery) params.set('search', searchQuery);

    const res = await fetch(`/api/catalog?${params.toString()}`);
    const data = await res.json();
    
    catalogTotal = data.total || 0;
    const newItems = data.exercises || [];

    if (append) {
      catalogExercises = [...catalogExercises, ...newItems];
    } else {
      catalogExercises = newItems;
    }

    renderCatalogGrid();
  } catch (err) {
    console.error("Error querying ExerciseDB catalog:", err);
  }
}

function renderCatalogGrid() {
  const container = document.getElementById('exercises-grid');
  const countBadge = document.getElementById('result-count-badge');
  if (countBadge) {
    countBadge.innerText = `Showing ${catalogExercises.length} of ${catalogTotal} global exercises (ExerciseDB)`;
  }

  if (catalogExercises.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-14 text-center text-slate-400 bg-dark-850/60 rounded-2xl border border-slate-800 p-8">
        <i data-lucide="search-x" class="w-12 h-12 mx-auto mb-3 text-slate-600"></i>
        <h3 class="text-base font-bold text-white mb-1">No exercises found in ExerciseDB</h3>
        <p class="text-xs text-slate-400 mb-4">Try a different search term or reset filters.</p>
        <button onclick="clearSearch(); setCatalogPartFilter('All');" class="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-dark-900 hover:bg-cyan-400">
          Reset Filters
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = catalogExercises.map((ex, idx) => {
    const gifUrl = ex.gif_url || '';
    const inst = ex.instructions || 'Perform with controlled form and full range of motion.';

    return `
      <div class="glass-panel bg-dark-850 rounded-2xl border border-slate-800 hover:border-slate-700 p-3.5 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-cyan-950/20">
        <div>
          <!-- Header Badges -->
          <div class="flex items-center justify-between gap-1.5 mb-2.5">
            <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border bg-cyan-950/40 text-cyan-300 border-cyan-500/30">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>${ex.body_part || 'Exercise'}</span>
            </span>
            <span class="text-[10px] text-slate-400 truncate max-w-[130px] font-medium" title="${ex.equipment}">
              ${ex.equipment || 'Gym'}
            </span>
          </div>

          <!-- Animated GIF Container -->
          <div class="relative h-44 sm:h-48 mb-3 rounded-xl overflow-hidden bg-dark-900 border border-slate-800 p-1 flex items-center justify-center cursor-pointer" onclick="openCatalogModal(${idx})">
            ${gifUrl ? `
              <img src="${gifUrl}" alt="${ex.name}" class="w-full h-full object-contain" loading="lazy">
              <span class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-dark-950/80 text-cyan-400 border border-slate-700 flex items-center space-x-1">
                <i data-lucide="video" class="w-3 h-3"></i>
                <span>GIF</span>
              </span>
            ` : `
              <div class="text-xs text-slate-500">No animation preview</div>
            `}
          </div>

          <!-- Title -->
          <h3 class="text-sm sm:text-base font-bold text-white font-heading group-hover:text-cyan-300 transition mb-1 leading-snug">
            ${ex.name}
          </h3>

          <!-- Target & Secondary Muscles -->
          <div class="flex flex-wrap gap-1 mb-2.5">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              ${ex.target_muscle || 'Target Muscle'}
            </span>
            ${(ex.secondary_muscles || []).slice(0, 2).map(m => `
              <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-dark-800 text-slate-400 border border-slate-700">
                ${m}
              </span>
            `).join('')}
          </div>

          <!-- Instructions Snippet -->
          <p class="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-dark-900/60 p-2 rounded-lg border border-slate-800/60 mb-3">
            ${inst}
          </p>
        </div>

        <!-- Buttons -->
        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <button 
            type="button" 
            onclick="openCatalogModal(${idx})" 
            class="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center justify-center space-x-1.5 transition active:scale-95">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            <span>View Full GIF & Guide</span>
          </button>

          <a 
            href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.video_query || `how to do ${ex.name} exercise form`)}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 flex items-center justify-center space-x-1 transition active:scale-95">
            <i data-lucide="play" class="w-3.5 h-3.5 fill-rose-300"></i>
            <span class="hidden sm:inline">Video</span>
          </a>
        </div>
      </div>
    `;
  }).join('');

  // Add "Load More" button if more items remain
  if (catalogExercises.length < catalogTotal) {
    const loadMoreHtml = `
      <div class="col-span-full py-6 text-center">
        <button 
          type="button" 
          onclick="loadMoreCatalog()" 
          class="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-dark-900 shadow-lg shadow-cyan-500/20 active:scale-95 transition">
          Load More Exercises (${catalogExercises.length} / ${catalogTotal})
        </button>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', loadMoreHtml);
  }

  lucide.createIcons();
}

function loadMoreCatalog() {
  catalogSkip += CATALOG_PAGE_SIZE;
  loadCatalogExercises(true);
}

// Modal View for Catalog Item
function openCatalogModal(idx) {
  const ex = catalogExercises[idx];
  if (!ex) return;

  document.getElementById('guide-modal-title').innerText = ex.name;
  document.getElementById('guide-modal-equipment').innerText = ex.equipment || 'Gym Equipment';
  document.getElementById('guide-modal-muscles').innerText = `${ex.body_part} • ${ex.target_muscle}`;

  const photosContainer = document.getElementById('guide-modal-photos-grid');
  if (ex.gif_url) {
    photosContainer.innerHTML = `
      <div class="col-span-2 rounded-xl overflow-hidden bg-dark-950 border border-slate-700 flex items-center justify-center p-2 relative max-h-72 sm:max-h-80">
        <img src="${ex.gif_url}" alt="${ex.name}" class="max-h-64 sm:max-h-72 object-contain mx-auto">
        <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-dark-950/90 text-cyan-300 border border-slate-700">
          Animated Demonstration GIF
        </span>
      </div>
    `;
  } else {
    photosContainer.innerHTML = `
      <div class="col-span-2 py-8 text-center text-slate-500 bg-dark-900/60 rounded-xl border border-slate-800">
        <p class="text-xs">Visual demonstration available in video guide.</p>
      </div>
    `;
  }

  const videoBtn = document.getElementById('guide-modal-video-link');
  const query = encodeURIComponent(ex.video_query || `how to do ${ex.name} exercise proper form`);
  videoBtn.href = `https://www.youtube.com/results?search_query=${query}`;

  const musclesContainer = document.getElementById('guide-modal-muscles-tags');
  const allMuscles = [ex.target_muscle, ...(ex.secondary_muscles || [])].filter(Boolean);
  musclesContainer.innerHTML = allMuscles.map(m => `
    <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
      ${m}
    </span>
  `).join('');

  const cuesContainer = document.getElementById('guide-modal-cues-list');
  const inst = ex.instructions || 'Perform with strict form and full control.';
  cuesContainer.innerHTML = `
    <div class="bg-dark-900/70 p-3 rounded-xl border border-slate-800 leading-relaxed text-slate-200 text-xs">
      ${inst}
    </div>
  `;

  document.getElementById('exercise-guide-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

// Modal View for Plan Item
async function openExerciseGuideModal(exerciseName) {
  try {
    const res = await fetch(`/api/exercises/media?name=${encodeURIComponent(exerciseName)}`);
    const media = await res.json();
    
    document.getElementById('guide-modal-title').innerText = media.display_name || exerciseName;
    document.getElementById('guide-modal-equipment').innerText = media.equipment || 'Gym Equipment';
    
    const muscles = (media.primary_muscles || []).join(', ');
    document.getElementById('guide-modal-muscles').innerText = muscles || 'Target Muscles';

    const photosContainer = document.getElementById('guide-modal-photos-grid');
    if (media.images && media.images.length > 0) {
      photosContainer.innerHTML = media.images.map((imgUrl, i) => `
        <div class="rounded-xl overflow-hidden bg-dark-900 border border-slate-700 relative group">
          <img src="${imgUrl}" alt="${media.display_name} Position ${i+1}" class="w-full h-44 sm:h-56 object-cover object-center">
          <div class="absolute bottom-2 left-2 bg-dark-900/90 px-2 py-0.5 rounded text-[10px] font-bold text-cyan-300 border border-slate-700">
            ${i === 0 ? '1. Starting Position' : '2. Peak Contraction'}
          </div>
        </div>
      `).join('');
    } else {
      photosContainer.innerHTML = `
        <div class="col-span-2 py-8 text-center text-slate-500 bg-dark-900/60 rounded-xl border border-slate-800">
          <p class="text-xs">Visual demonstration available in video guide.</p>
        </div>
      `;
    }

    const videoBtn = document.getElementById('guide-modal-video-link');
    const query = encodeURIComponent(media.video_query || `how to do ${exerciseName} exercise proper form`);
    videoBtn.href = `https://www.youtube.com/results?search_query=${query}`;

    const musclesContainer = document.getElementById('guide-modal-muscles-tags');
    const allMuscles = [...(media.primary_muscles || []), ...(media.secondary_muscles || [])];
    musclesContainer.innerHTML = allMuscles.map(m => `
      <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
        ${m}
      </span>
    `).join('');

    const cuesContainer = document.getElementById('guide-modal-cues-list');
    const cues = media.form_cues || [];
    cuesContainer.innerHTML = cues.map((cue, idx) => `
      <div class="bg-dark-900/70 p-2.5 rounded-xl border border-slate-800 flex items-start space-x-2.5">
        <span class="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center shrink-0 text-[10px]">
          ${idx + 1}
        </span>
        <p class="leading-relaxed text-slate-200">${cue}</p>
      </div>
    `).join('');

    document.getElementById('exercise-guide-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
  } catch (err) {
    console.error("Error opening exercise guide:", err);
  }
}

function closeExerciseGuideModal() {
  document.getElementById('exercise-guide-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function handleBackdropClick(event, modalId) {
  if (event.target.id === modalId) {
    if (modalId === 'exercise-guide-modal') closeExerciseGuideModal();
  }
}
