
// -------------------------------------------------------------
// REVERSE SELECTION & EXERCISE TARGET 3D MAPPING
// -------------------------------------------------------------
function extractMuscleKeys(primaryMuscles = [], secondaryMuscles = [], fallbackText = '') {
  const allPrimaries = (Array.isArray(primaryMuscles) ? primaryMuscles : [primaryMuscles]).map(m => String(m).toLowerCase());
  const allSecondaries = (Array.isArray(secondaryMuscles) ? secondaryMuscles : [secondaryMuscles]).map(m => String(m).toLowerCase());
  const fallback = String(fallbackText || '').toLowerCase();

  const primaryKeys = [];
  const secondaryKeys = [];

  Object.keys(MUSCLE_MAP).forEach(key => {
    const kws = MUSCLE_MAP[key].keywords;
    const isPrim = allPrimaries.some(pm => kws.some(k => pm.includes(k))) || (primaryKeys.length === 0 && kws.some(k => fallback.includes(k)));
    if (isPrim) {
      if (!primaryKeys.includes(key)) primaryKeys.push(key);
   else {
      const isSec = allSecondaries.some(sm => kws.some(k => sm.includes(k)));
      if (isSec && !secondaryKeys.includes(key)) secondaryKeys.push(key);
  
);

  return { primaryKeys, secondaryKeys };
}

function previewExerciseOnAvatar(name, pMuscles = [], sMuscles = [], category = '') {
  const { primaryKeys, secondaryKeys } = extractMuscleKeys(pMuscles, sMuscles, `${name} ${category}`);
  if (window.avatar3D && typeof window.avatar3D.highlightExerciseMuscles === 'function') {
    window.avatar3D.highlightExerciseMuscles(primaryKeys, secondaryKeys, name);

}

// -------------------------------------------------------------
// SMART MULTI-FILTER CONTROLLERS (EQUIPMENT & PATTERN)
// -------------------------------------------------------------
function setEquipmentFilter(eq) {
  activeEquipment = eq;
  document.querySelectorAll('.eq-chip').forEach(c => {
    if (c.getAttribute('data-eq') === eq) {
      c.className = "eq-chip px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500 text-dark-900 border border-cyan-400 shadow-sm transition";
   else {
      c.className = "eq-chip px-2.5 py-1 rounded-lg text-xs font-semibold bg-dark-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition";
  
);
  applyActiveModeFilters();
}

function setPatternFilter(pat) {
  activePattern = pat;
  document.querySelectorAll('.pat-chip').forEach(c => {
    if (c.getAttribute('data-pat') === pat) {
      c.className = "pat-chip px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white border border-indigo-500 shadow-sm transition";
   else {
      c.className = "pat-chip px-2.5 py-1 rounded-lg text-xs font-semibold bg-dark-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition";
  
);
  applyActiveModeFilters();
}

function applyActiveModeFilters() {
  if (currentMode === 'plan') {
    applyPlanFilters();
 else if (currentMode === '876') {
    fedbSkip = 0;
    fedbExercises = [];
    loadFedbExercises();
 else {
    catalogSkip = 0;
    catalogExercises = [];
    loadCatalogExercises();

}

// -------------------------------------------------------------
// CUSTOM ROUTINE BUILDER & WORKOUT TRAY
// -------------------------------------------------------------
function addToRoutine(item) {
  const exists = customRoutine.some(r => r.name === item.name);
  if (exists) {
    showToast(`"${item.name}" is already in your routine!`);
    return;

  customRoutine.push(item);
  saveRoutine();
  updateRoutineBadge();
  showToast(`Added "${item.name}" to custom routine!`);
  highlightRoutineOnAvatar();
}

function removeFromRoutine(idx) {
  customRoutine.splice(idx, 1);
  saveRoutine();
  updateRoutineBadge();
  renderRoutineDrawer();
  highlightRoutineOnAvatar();
}

function clearRoutine() {
  customRoutine = [];
  saveRoutine();
  updateRoutineBadge();
  renderRoutineDrawer();
  if (window.avatar3D) window.avatar3D.clearSelection();
  showToast('Routine cleared');
}

function saveRoutine() {
  localStorage.setItem('user_custom_routine', JSON.stringify(customRoutine));
}

function updateRoutineBadge() {
  const pill = document.getElementById('routine-tray-pill');
  const badge = document.getElementById('routine-count-badge');
  const count = customRoutine.length;

  if (pill) {
    if (count > 0) {
      pill.classList.remove('hidden');
      pill.classList.add('flex');
   else {
      pill.classList.add('hidden');
      pill.classList.remove('flex');
  

  if (badge) badge.innerText = count;
}

function openRoutineDrawer() {
  const modal = document.getElementById('routine-drawer-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    renderRoutineDrawer();
    if (window.lucide) window.lucide.createIcons();

}

function closeRoutineDrawer() {
  const modal = document.getElementById('routine-drawer-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    document.body.style.overflow = '';

}

function renderRoutineDrawer() {
  const container = document.getElementById('routine-items-list');
  const subtitle = document.getElementById('routine-drawer-subtitle');
  if (!container) return;

  if (subtitle) {
    subtitle.innerText = `${customRoutine.length} exercise${customRoutine.length === 1 ? '' : 's'} in workout routine`;


  if (customRoutine.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-slate-400">
        <i data-lucide="clipboard-x" class="w-10 h-10 mx-auto mb-2 text-slate-600"></i>
        <p class="text-xs font-semibold text-slate-300">Your custom routine is currently empty.</p>
        <p class="text-[10px] text-slate-500 mt-1">Click "+ Routine" on any exercise card to build your workout!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;


  container.innerHTML = customRoutine.map((item, idx) => `
    <div class="p-3 rounded-xl bg-dark-950 border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition">
      <div class="flex items-center space-x-2.5 overflow-hidden">
        <span class="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 text-xs font-black flex items-center justify-center shrink-0">
          ${idx + 1}
        </span>
        <div class="truncate">
          <h4 class="text-xs font-bold text-white truncate">${escapeHtml(item.name)}</h4>
          <p class="text-[10px] text-slate-400 truncate">${escapeHtml(item.category)} • ${escapeHtml(item.equipment || 'Equipment')}</p>
        </div>
      </div>
      <div class="flex items-center space-x-1 shrink-0">
        <button type="button" onclick="previewExerciseOnAvatar('${escapeHtml(item.name)}', ${JSON.stringify(item.primary || [])}, ${JSON.stringify(item.secondary || [])}, '${escapeHtml(item.category || '')}')" class="p-1.5 rounded-lg hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition" title="Preview on 3D Body">
          <i data-lucide="crosshair" class="w-3.5 h-3.5"></i>
        </button>
        <button type="button" onclick="removeFromRoutine(${idx})" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition" title="Remove">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function highlightRoutineOnAvatar() {
  if (customRoutine.length === 0) return;
  const allPrimaries = new Set();
  const allSecondaries = new Set();

  customRoutine.forEach(item => {
    const { primaryKeys, secondaryKeys } = extractMuscleKeys(item.primary, item.secondary, `${item.name} ${item.category}`);
    primaryKeys.forEach(k => allPrimaries.add(k));
    secondaryKeys.forEach(k => allSecondaries.add(k));
);

  if (window.avatar3D && typeof window.avatar3D.highlightExerciseMuscles === 'function') {
    window.avatar3D.highlightExerciseMuscles(Array.from(allPrimaries), Array.from(allSecondaries), `Routine (${customRoutine.length} exercises)`);
    showToast(`Visualizing recruitment heatmap for all ${customRoutine.length} exercises!`);

}

function exportRoutineMarkdown() {
  if (customRoutine.length === 0) {
    showToast('Add exercises first to export!');
    return;

  let md = `# Custom Workout Routine (${customRoutine.length} Exercises)\n\n`;
  md += `| # | Exercise | Target Group | Equipment |\n`;
  md += `|---|---|---|---|\n`;
  customRoutine.forEach((ex, i) => {
    md += `| ${i+1} | ${ex.name} | ${ex.category} | ${ex.equipment || 'Gym'} |\n`;
);
  md += `\n*Generated via 90Days 3D Muscular Anatomy Platform*`;

  navigator.clipboard.writeText(md).then(() => {
    showToast('Workout routine copied to clipboard in Markdown format!');
);
}

function showToast(msg) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-dark-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold shadow-2xl transition-all duration-300 pointer-events-none opacity-0';
    document.body.appendChild(toast);

  toast.innerText = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translate(-50%, -10px)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 0)';
, 2500);
}

// Tri-Mode Exercise Library Client Script with Interactive Front & Back Muscle Avatar:
// 1. 90-Day Plan Routine (64 Moves)
// 2. Free-Exercise-DB (876 Photos, Mechanics & Levels)
// 3. ExerciseDB Global (1,324 Animated GIFs & Instructions)

let currentMode = 'plan'; // 'plan', '876', or 'catalog'
let selectedMuscle = null;
let isAvatarVisible = true;

// State for 90-Day Plan Mode
let planExercises = [];
let filteredPlanExercises = [];
let activePlanGroup = 'All';

// State for 876 Free-Exercise-DB Mode
let fedbExercises = [];
let fedbTotal = 876;
let fedbSkip = 0;
const FEDB_PAGE_SIZE = 48;
let fedbCategories = [];
let activeFedbCategory = 'All';

// State for ExerciseDB Catalog Mode (1,324 exercises)
let catalogExercises = [];
let catalogTotal = 1324;
let catalogSkip = 0;
const CATALOG_PAGE_SIZE = 48;
let catalogBodyParts = [];
let activeCatalogPart = 'All';

let activeEquipment = 'All';
let activePattern = 'All';

// Validated MET Reference Constants (Compendium of Physical Activities)
function getExerciseMet(name) {
  if (!name) return 3.8;
  const lower = name.toLowerCase();
  if (lower.includes('burpee') || lower.includes('jumping jack') || lower.includes('mountain climber') || lower.includes('high knee') || lower.includes('skipping')) {
    return 7.5;
  }
  if (lower.includes('plank') || lower.includes('deadbug') || lower.includes('bird dog') || lower.includes('bird-dog') || lower.includes('hollow')) {
    return 4.0;
  }
  const heavy = [
    'squat', 'deadlift', 'bench press', 'incline bench', 'barbell row', 
    'overhead press', 'military press', 'shoulder press', 'pull-up', 
    'pull up', 'chin-up', 'chin up', 'dip', 'leg press', 'hack squat', 
    'romanian deadlift', 'rdl', 'hip thrust', 'clean'
  ];
  if (heavy.some(k => lower.includes(k))) return 6.0;

  const mod = [
    'lat pulldown', 'pulldown', 'cable row', 't-bar', 'chest press', 
    'dumbbell press', 'incline dumbbell', 'lunge', 'split squat', 
    'push-up', 'push up', 'pec deck', 'cable crossover'
  ];
  if (mod.some(k => lower.includes(k))) return 5.0;

  return 3.8;
}

function calculateSetCalories(name, weightKg = 90.0) {
  const met = getExerciseMet(name);
  const ratePerMin = (met * 3.5 * weightKg) / 200.0;
  const effectiveMins = met >= 5.0 ? 1.0 : 0.8;
  return Math.round(ratePerMin * effectiveMins * 10) / 10;
}
let customRoutine = JSON.parse(localStorage.getItem('user_custom_routine') || '[]');
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

// Interactive Muscle Anatomy Map Dictionary
const MUSCLE_MAP = {
  chest: {
    label: 'Chest (Pectorals)',
    keywords: ['chest', 'pectoral', 'pec'],
    fedbCategory: 'Chest',
    catalogTarget: 'Pectorals',
    catalogBodyPart: 'Chest'
,
  shoulders: {
    label: 'Shoulders (Deltoids)',
    keywords: ['delt', 'shoulder', 'rotator'],
    fedbCategory: 'Shoulders',
    catalogTarget: 'Delts',
    catalogBodyPart: 'Shoulders'
,
  biceps: {
    label: 'Biceps (Arms)',
    keywords: ['bicep', 'brachii', 'brachialis'],
    fedbCategory: 'Biceps',
    catalogTarget: 'Biceps',
    catalogBodyPart: 'Upper Arms'
,
  triceps: {
    label: 'Triceps (Arms)',
    keywords: ['tricep'],
    fedbCategory: 'Triceps',
    catalogTarget: 'Triceps',
    catalogBodyPart: 'Upper Arms'
,
  forearms: {
    label: 'Forearms & Grip',
    keywords: ['forearm', 'wrist'],
    fedbCategory: 'Forearms',
    catalogTarget: 'Forearms',
    catalogBodyPart: 'Lower Arms'
,
  abs: {
    label: 'Abs & Core',
    keywords: ['abdomin', 'core', 'waist', 'transverse', 'oblique', 'sit-up'],
    fedbCategory: 'Abdominals',
    catalogTarget: 'Abs',
    catalogBodyPart: 'Waist'
,
  obliques: {
    label: 'External Obliques (Side Core)',
    keywords: ['oblique', 'side', 'twist', 'rotational', 'core', 'waist'],
    fedbCategory: 'Abdominals',
    catalogTarget: 'Abs',
    catalogBodyPart: 'Waist'
,
  quads: {
    label: 'Quadriceps (Quads)',
    keywords: ['quad', 'quadriceps', 'squat', 'leg press'],
    fedbCategory: 'Quadriceps',
    catalogTarget: 'Quads',
    catalogBodyPart: 'Upper Legs'
,
  hamstrings: {
    label: 'Hamstrings',
    keywords: ['hamstring', 'rdl', 'deadlift', 'leg curl'],
    fedbCategory: 'Hamstrings',
    catalogTarget: 'Hamstrings',
    catalogBodyPart: 'Upper Legs'
,
  glutes: {
    label: 'Glutes (Hips)',
    keywords: ['glute', 'thrust', 'hip'],
    fedbCategory: 'Glutes',
    catalogTarget: 'Glutes',
    catalogBodyPart: 'Upper Legs'
,
  calves: {
    label: 'Calves',
    keywords: ['calf', 'calves', 'gastrocnemius', 'soleus'],
    fedbCategory: 'Calves',
    catalogTarget: 'Calves',
    catalogBodyPart: 'Lower Legs'
,
  lats: {
    label: 'Lats / Back',
    keywords: ['lat', 'back', 'row', 'pulldown', 'rhomboid'],
    fedbCategory: 'Lats',
    catalogTarget: 'Lats',
    catalogBodyPart: 'Back'
,
  traps: {
    label: 'Traps (Upper Back/Neck)',
    keywords: ['trapezius', 'trap', 'shrug'],
    fedbCategory: 'Traps',
    catalogTarget: 'Traps',
    catalogBodyPart: 'Back'
,
  lowerback: {
    label: 'Lower Back',
    keywords: ['lower back', 'erector', 'spine', 'hyperextension'],
    fedbCategory: 'Lower Back',
    catalogTarget: 'Spine',
    catalogBodyPart: 'Back'

};

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  setupMuscleAvatarListeners();

  // Initialize Ultra-Realistic 3D Muscular Anatomy Avatar
  if (window.avatar3D && typeof window.avatar3D.init === 'function') {
    try {
      window.avatar3D.init('avatar-3d-viewport');
   catch (err) {
      console.warn("Could not initialize 3D avatar viewport:", err);
  


  await loadInitialData();

  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get('mode');
  if (modeParam === '876' || modeParam === 'catalog') {
    switchLibraryMode(modeParam);


  const muscleParam = urlParams.get('muscle');
  if (muscleParam && MUSCLE_MAP[muscleParam.toLowerCase()]) {
    selectMuscle(muscleParam.toLowerCase());


  lucide.createIcons();
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
      
        
        if (currentMode === 'plan') {
          applyPlanFilters();
       else if (currentMode === '876') {
          fedbSkip = 0;
          fedbExercises = [];
          loadFedbExercises();
       else {
          catalogSkip = 0;
          catalogExercises = [];
          loadCatalogExercises();
      
    , 250);
  );


  const equipSelect = document.getElementById('equipment-filter-select');
  if (equipSelect) {
    equipSelect.addEventListener('change', (e) => {
      activeEquipment = e.target.value;
      if (currentMode === 'plan') {
        applyPlanFilters();
     else if (currentMode === '876') {
        fedbSkip = 0;
        fedbExercises = [];
        loadFedbExercises();
     else {
        catalogSkip = 0;
        catalogExercises = [];
        loadCatalogExercises();
    
  );

}

function clearSearch() {
  const searchInput = document.getElementById('exercise-search-input');
  if (searchInput) searchInput.value = '';
  searchQuery = '';
  document.getElementById('search-clear-btn').classList.add('hidden');
  
  if (currentMode === 'plan') {
    applyPlanFilters();
 else if (currentMode === '876') {
    fedbSkip = 0;
    fedbExercises = [];
    loadFedbExercises();
 else {
    catalogSkip = 0;
    catalogExercises = [];
    loadCatalogExercises();

}

// -------------------------------------------------------------
// INTERACTIVE MUSCLE AVATAR (FRONT & BACK HEATMAP LOGIC)
// -------------------------------------------------------------
function setupMuscleAvatarListeners() {
  const paths = document.querySelectorAll('.muscle-path');
  const tooltip = document.getElementById('svg-muscle-tooltip');

  paths.forEach(p => {
    p.addEventListener('mouseenter', () => {
      const title = p.getAttribute('data-title') || p.getAttribute('data-muscle');
      if (tooltip) tooltip.textContent = `Muscle: ${title}`;
  );

    p.addEventListener('mouseleave', () => {
      if (tooltip) {
        if (selectedMuscle && MUSCLE_MAP[selectedMuscle]) {
          tooltip.textContent = `Active: ${MUSCLE_MAP[selectedMuscle].label}`;
       else {
          tooltip.textContent = '';
      
    
  );

    p.addEventListener('click', () => {
      const muscleKey = p.getAttribute('data-muscle');
      selectMuscle(muscleKey);
  );
);
}

function selectMuscle(muscleKey) {
  if (selectedMuscle === muscleKey) {
    clearMuscleFilter();
    return;


  selectedMuscle = muscleKey;
  const mInfo = MUSCLE_MAP[muscleKey];
  if (!mInfo) return;

  // Sync with 3D Realistic Anatomy Avatar & HUD Card
  if (window.avatar3D) {
    if (window.avatar3D.selectedMuscleKey !== muscleKey) {
      window.avatar3D.selectMuscle(muscleKey, false);
   else if (typeof window.avatar3D.renderAnatomicalCard === 'function') {
      window.avatar3D.renderAnatomicalCard(muscleKey);
  


  // Update SVG active paths on both front and back
  document.querySelectorAll('.muscle-path').forEach(p => {
    if (p.getAttribute('data-muscle') === muscleKey) {
      p.classList.add('active');
   else {
      p.classList.remove('active');
  
);

  // Highlight quick chip button
  document.querySelectorAll('.muscle-chip').forEach(c => {
    if (c.getAttribute('data-chip') === muscleKey) {
      c.className = "muscle-chip px-2.5 py-1 rounded-lg bg-cyan-500 text-dark-900 font-black border border-cyan-400 shadow-md shadow-cyan-500/30 transition";
   else {
      c.className = "muscle-chip px-2.5 py-1 rounded-lg bg-dark-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition";
  
);

  // Show active indicator badge
  const badge = document.getElementById('active-muscle-badge');
  const text = document.getElementById('active-muscle-text');
  if (badge && text) {
    text.innerText = mInfo.label;
    badge.classList.remove('hidden');
    badge.classList.add('flex');


  const tooltip = document.getElementById('svg-muscle-tooltip');
  if (tooltip) tooltip.textContent = `Active: ${mInfo.label}`;

  // Apply to current mode
  if (currentMode === 'plan') {
    applyPlanFilters();
 else if (currentMode === '876') {
    fedbSkip = 0;
    fedbExercises = [];
    loadFedbExercises();
 else {
    catalogSkip = 0;
    catalogExercises = [];
    loadCatalogExercises();

}

function clearMuscleFilter() {
  selectedMuscle = null;

  // Sync with 3D avatar & HUD Card
  if (window.avatar3D) {
    if (window.avatar3D.selectedMuscleKey !== null) {
      window.avatar3D.clearSelection(false);
  
    if (typeof window.avatar3D.hideAnatomicalCard === 'function') {
      window.avatar3D.hideAnatomicalCard();
  


  document.querySelectorAll('.muscle-path').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.muscle-chip').forEach(c => {
    c.className = "muscle-chip px-2.5 py-1 rounded-lg bg-dark-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition";
);

  const badge = document.getElementById('active-muscle-badge');
  if (badge) {
    badge.classList.add('hidden');
    badge.classList.remove('flex');


  const tooltip = document.getElementById('svg-muscle-tooltip');
  if (tooltip) tooltip.textContent = '';

  if (currentMode === 'plan') {
    applyPlanFilters();
 else if (currentMode === '876') {
    fedbSkip = 0;
    fedbExercises = [];
    loadFedbExercises();
 else {
    catalogSkip = 0;
    catalogExercises = [];
    loadCatalogExercises();

}

// Expose muscle filters globally for 3D avatar two-way interaction
window.selectMuscle = selectMuscle;
window.clearMuscleFilter = clearMuscleFilter;
window.filterByAvatarMuscle = selectMuscle;

function toggleAvatarVisibility() {
  isAvatarVisible = !isAvatarVisible;
  const wrapper = document.getElementById('avatar-interactive-wrapper');
  const label = document.getElementById('avatar-toggle-label');
  const icon = document.getElementById('avatar-toggle-icon');

  if (isAvatarVisible) {
    wrapper.classList.remove('hidden');
    label.innerText = 'Hide';
    if (icon) icon.setAttribute('data-lucide', 'chevron-up');
    if (window.avatar3D) window.avatar3D.onResize();
 else {
    wrapper.classList.add('hidden');
    label.innerText = 'Show Avatar';
    if (icon) icon.setAttribute('data-lucide', 'chevron-down');

  lucide.createIcons();
}

function switchAvatarView(viewType) {
  const wrapper3D = document.getElementById('avatar-3d-wrapper');
  const wrapper2D = document.getElementById('avatar-2d-wrapper');
  const btn3D = document.getElementById('btn-avatar-mode-3d');
  const btn2D = document.getElementById('btn-avatar-mode-2d');

  if (viewType === '3d') {
    if (wrapper3D) wrapper3D.classList.remove('hidden');
    if (wrapper2D) wrapper2D.classList.add('hidden');
    if (btn3D) btn3D.className = "px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-500 text-dark-900 border border-cyan-400 shadow-sm transition";
    if (btn2D) btn2D.className = "px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-400 hover:text-white bg-transparent transition";
    if (window.avatar3D) {
      setTimeout(() => window.avatar3D.onResize(), 60);
  
 else {
    if (wrapper3D) wrapper3D.classList.add('hidden');
    if (wrapper2D) wrapper2D.classList.remove('hidden');
    if (btn2D) btn2D.className = "px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-500 text-dark-900 border border-cyan-400 shadow-sm transition";
    if (btn3D) btn3D.className = "px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-400 hover:text-white bg-transparent transition";

}

async function loadInitialData() {
  await Promise.all([
    loadPlanExercises(),
    loadFedbMetadata(),
    loadCatalogMetadata()
  ]);
}

// -------------------------------------------------------------
// 3-WAY MODE SWITCHER: 'plan' | '876' | 'catalog'
// -------------------------------------------------------------
function switchLibraryMode(mode) {
  if (currentMode === mode) return;
  currentMode = mode;

  const btnPlan = document.getElementById('btn-mode-plan');
  const btn876 = document.getElementById('btn-mode-876');
  const btnCatalog = document.getElementById('btn-mode-catalog');

  const defaultBtn = "py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 text-slate-400 hover:text-white";

  btnPlan.className = defaultBtn;
  btn876.className = defaultBtn;
  btnCatalog.className = defaultBtn;

  if (mode === 'plan') {
    btnPlan.className = "py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center space-x-1.5 bg-[#CCFF00] text-[#09090D] shadow-sm";
    renderPlanCategoryTabs();
    populatePlanEquipment();
    applyPlanFilters();
  } else if (mode === '876') {
    btn876.className = "py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center space-x-1.5 bg-[#CCFF00] text-[#09090D] shadow-sm";
    renderFedbCategoryTabs();
    populateFedbEquipment();
    fedbSkip = 0;
    fedbExercises = [];
    loadFedbExercises();
  } else if (mode === 'catalog') {
    btnCatalog.className = "py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center space-x-1.5 bg-[#CCFF00] text-[#09090D] shadow-sm";
    renderCatalogCategoryTabs();
    populateCatalogEquipment();
    catalogSkip = 0;
    catalogExercises = [];
    loadCatalogExercises();

}

// -------------------------------------------------------------
// 1. 90-DAY PLAN ROUTINE (64 EXERCISES)
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
  
 catch (err) {
    console.error("Error loading plan exercises:", err);

}

function renderPlanCategoryTabs() {
  const container = document.getElementById('category-tabs-container');
  if (!container) return;

  const counts = { 'All': planExercises.length };
  planExercises.forEach(ex => {
    const bg = ex.body_group || 'Other';
    counts[bg] = (counts[bg] || 0) + 1;
);

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
      ">
        <span>${g}</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] ${
          isActive ? 'bg-dark-950/40 text-white font-black' : 'bg-dark-800 text-slate-400'
      ">${count}</span>
      </button>
    `;
).join('');
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
    );
  
);

  const sorted = Array.from(equipSet).sort();
  equipSelect.innerHTML = `<option value="All">All Equipment (${planExercises.length})</option>` + 
    sorted.map(eq => `<option value="${eq}">${eq}</option>`).join('');
}

function applyPlanFilters() {
  filteredPlanExercises = planExercises.filter(ex => {
    // 1. Muscle Avatar Filter
    if (selectedMuscle && MUSCLE_MAP[selectedMuscle]) {
      const mInfo = MUSCLE_MAP[selectedMuscle];
      const allText = `${ex.name} ${ex.display_name} ${(ex.primary_muscles || []).join(' ')} ${(ex.secondary_muscles || []).join(' ')} ${ex.category} ${ex.body_group}`.toLowerCase();
      const matches = mInfo.keywords.some(k => allText.includes(k));
      if (!matches) return false;
  

    // 2. Category Tab Filter
    if (activePlanGroup !== 'All') {
      if ((ex.body_group || '').toLowerCase() !== activePlanGroup.toLowerCase()) {
        return false;
    
  

    // 3. Equipment Filter
    if (activeEquipment !== 'All') {
      if (!ex.equipment || !ex.equipment.toLowerCase().includes(activeEquipment.toLowerCase())) {
        return false;
    
  

    // 4. Movement Pattern Filter (Push / Pull / Legs / Core)
    if (activePattern !== 'All') {
      const allText = `${ex.category} ${ex.body_group} ${(ex.primary_muscles || []).join(' ')} ${ex.name}`.toLowerCase();
      if (activePattern === 'Push' && !['chest', 'shoulder', 'tricep', 'push'].some(k => allText.includes(k))) return false;
      if (activePattern === 'Pull' && !['back', 'lat', 'bicep', 'pull', 'row'].some(k => allText.includes(k))) return false;
      if (activePattern === 'Legs' && !['leg', 'quad', 'hamstring', 'glute', 'calf', 'squat', 'lunge'].some(k => allText.includes(k))) return false;
      if (activePattern === 'Core' && !['core', 'ab', 'plank', 'crunch'].some(k => allText.includes(k))) return false;
  

    // 4. Search Filter
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
  
    return true;
);

  renderPlanGrid();
}

function renderPlanGrid() {
  const container = document.getElementById('exercises-grid');
  const countBadge = document.getElementById('result-count-badge');
  const musclePrefix = selectedMuscle && MUSCLE_MAP[selectedMuscle] ? `[${MUSCLE_MAP[selectedMuscle].label}] ` : '';

  if (countBadge) {
    countBadge.innerText = `${musclePrefix}Showing ${filteredPlanExercises.length} of ${planExercises.length} plan exercises`;


  if (filteredPlanExercises.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-14 text-center text-slate-400 bg-dark-850/60 rounded-2xl border border-slate-800 p-8">
        <i data-lucide="search-x" class="w-12 h-12 mx-auto mb-3 text-slate-600"></i>
        <h3 class="text-base font-bold text-white mb-1">No plan exercises match ${selectedMuscle ? 'selected muscle' : 'your filter'}</h3>
        <p class="text-xs text-slate-400 mb-4">Try clearing your selection or switching to the 876 / 1,324 dataset tabs.</p>
        <button onclick="clearSearch(); clearMuscleFilter(); setPlanGroupFilter('All');" class="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500">
          Reset All Filters
        </button>
      </div>
    `;
    lucide.createIcons();
    return;


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
            <span class="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20" title="Estimated scientific calorie burn per set">
              <i data-lucide="flame" class="w-3 h-3 text-amber-400 fill-amber-400 inline"></i>
              <span>~${calculateSetCalories(ex.display_name || ex.name || ex.key)}k/set</span>
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
            class="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 flex items-center justify-center space-x-1 transition active:scale-95">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            <span>Guide</span>
          </button>

          <button 
            type="button" 
            onclick="previewExerciseOnAvatar('${(ex.display_name || ex.name || '').replace(/'/g, "\\'")}', ${JSON.stringify(ex.primary_muscles || [])}, ${JSON.stringify(ex.secondary_muscles || [])}, '${(ex.category || '').replace(/'/g, "\\'")}')" 
            class="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center justify-center space-x-1 transition active:scale-95" 
            title="Highlight Muscles on 3D Body">
            <i data-lucide="crosshair" class="w-3.5 h-3.5"></i>
            <span class="hidden sm:inline">3D</span>
          </button>

          <button 
            type="button" 
            onclick="addToRoutine({ id: '${ex.key}', name: '${(ex.display_name || ex.name || '').replace(/'/g, "\\'")}', category: '${(ex.body_group || ex.category || '').replace(/'/g, "\\'")}', equipment: '${(ex.equipment || 'Gym').replace(/'/g, "\\'")}', primary: ${JSON.stringify(ex.primary_muscles || [])}, secondary: ${JSON.stringify(ex.secondary_muscles || [])} })" 
            class="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center justify-center space-x-1 transition active:scale-95" 
            title="Add to Custom Routine">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
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
).join('');

  lucide.createIcons();
}

// -------------------------------------------------------------
// 2. FREE-EXERCISE-DB (876 EXERCISES WITH 2-PHOTO START & PEAK)
// -------------------------------------------------------------
async function loadFedbMetadata() {
  try {
    const res = await fetch('/api/catalog-876/filters');
    const data = await res.json();
    fedbCategories = ['All', ...(data.categories || [])];
    fedbTotal = data.total_exercises || 876;
 catch (err) {
    console.error("Error loading 876 metadata:", err);

}

function renderFedbCategoryTabs() {
  const container = document.getElementById('category-tabs-container');
  if (!container) return;

  container.innerHTML = fedbCategories.map(cat => {
    const isActive = activeFedbCategory.toLowerCase() === cat.toLowerCase();
    return `
      <button 
        type="button" 
        onclick="setFedbCategoryFilter('${cat}')"
        class="tab-btn px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 shrink-0 ${
          isActive 
            ? 'bg-emerald-500 text-dark-900 shadow-md shadow-emerald-500/25 font-extrabold' 
            : 'bg-dark-900/90 text-slate-300 hover:text-white border border-slate-800'
      ">
        <span>${cat}</span>
      </button>
    `;
).join('');
}

function setFedbCategoryFilter(cat) {
  activeFedbCategory = cat;
  renderFedbCategoryTabs();
  fedbSkip = 0;
  fedbExercises = [];
  loadFedbExercises();
}

async function populateFedbEquipment() {
  const equipSelect = document.getElementById('equipment-filter-select');
  if (!equipSelect) return;

  try {
    const res = await fetch('/api/catalog-876/filters');
    const data = await res.json();
    const sorted = data.equipment || [];
    equipSelect.innerHTML = `<option value="All">All Equipment (876)</option>` + 
      sorted.map(eq => `<option value="${eq}">${eq}</option>`).join('');
 catch (err) {
    console.error("Error populating 876 equipment:", err);

}

async function loadFedbExercises(append = false) {
  const container = document.getElementById('exercises-grid');

  if (!append) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-400"></i>
        <p class="text-sm font-semibold">Querying Atlas Free-Exercise-DB (876 exercises)...</p>
      </div>
    `;
    lucide.createIcons();


  try {
    const params = new URLSearchParams({
      limit: FEDB_PAGE_SIZE,
      skip: fedbSkip
  );

    if (activeFedbCategory !== 'All') params.set('category', activeFedbCategory);
    if (activeEquipment !== 'All') params.set('equipment', activeEquipment);
    
    // Muscle Avatar filter
    if (selectedMuscle && MUSCLE_MAP[selectedMuscle]) {
      params.set('muscle', MUSCLE_MAP[selectedMuscle].fedbCategory);
  
    if (searchQuery) {
      params.set('search', searchQuery);
  

    const res = await fetch(`/api/catalog-876?${params.toString()}`);
    const data = await res.json();
    
    fedbTotal = data.total || 0;
    const newItems = data.exercises || [];

    if (append) {
      fedbExercises = [...fedbExercises, ...newItems];
   else {
      fedbExercises = newItems;
  

    renderFedbGrid();
 catch (err) {
    console.error("Error querying 876 dataset:", err);

}

function renderFedbGrid() {
  const container = document.getElementById('exercises-grid');
  const countBadge = document.getElementById('result-count-badge');
  const musclePrefix = selectedMuscle && MUSCLE_MAP[selectedMuscle] ? `[${MUSCLE_MAP[selectedMuscle].label}] ` : '';

  if (countBadge) {
    countBadge.innerText = `${musclePrefix}Showing ${fedbExercises.length} of ${fedbTotal} exercises (Free-Exercise-DB 876)`;


  if (fedbExercises.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-14 text-center text-slate-400 bg-dark-850/60 rounded-2xl border border-slate-800 p-8">
        <i data-lucide="search-x" class="w-12 h-12 mx-auto mb-3 text-slate-600"></i>
        <h3 class="text-base font-bold text-white mb-1">No exercises found in Free-Exercise-DB</h3>
        <p class="text-xs text-slate-400 mb-4">Try clearing your selection or changing category.</p>
        <button onclick="clearSearch(); clearMuscleFilter(); setFedbCategoryFilter('All');" class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-dark-900 hover:bg-emerald-400">
          Reset Filters
        </button>
      </div>
    `;
    lucide.createIcons();
    return;


  container.innerHTML = fedbExercises.map((ex, idx) => {
    const images = ex.images || [];
    const cues = ex.instructions || [];
    const firstCue = cues.length > 0 ? cues[0] : 'Perform with strict form and full control.';

    return `
      <div class="glass-panel bg-dark-850 rounded-2xl border border-slate-800 hover:border-slate-700 p-3.5 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-emerald-950/20">
        <div>
          <!-- Badges -->
          <div class="flex items-center justify-between gap-1.5 mb-2.5">
            <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border bg-emerald-950/40 text-emerald-300 border-emerald-500/30">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>${ex.category || 'Strength'}</span>
            </span>
            <div class="flex items-center space-x-1 text-[10px] text-slate-400">
              <span class="px-1.5 py-0.2 rounded bg-dark-800 border border-slate-700 text-slate-300 font-semibold">${ex.level || 'Beginner'}</span>
              <span class="truncate max-w-[80px]">${ex.equipment || 'Gym'}</span>
            </div>
          </div>

          <!-- 2-Position Photos -->
          <div class="grid grid-cols-2 gap-1.5 mb-3 rounded-xl overflow-hidden bg-dark-900 border border-slate-800/80 p-1">
            ${images.map((img, i) => `
              <div class="relative h-28 sm:h-32 rounded-lg overflow-hidden bg-dark-950 cursor-pointer group/img" onclick="openFedbModal(${idx})">
                <img src="${img}" alt="${ex.name} position ${i+1}" 
                  class="w-full h-full object-cover object-center group-hover/img:scale-105 transition duration-300"
                  loading="lazy">
                <span class="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-dark-950/80 text-emerald-300 border border-slate-700">
                  ${i === 0 ? '1. Start' : '2. Peak'}
                </span>
              </div>
            `).join('')}
          </div>

          <!-- Title -->
          <h3 class="text-sm sm:text-base font-bold text-white font-heading group-hover:text-emerald-300 transition mb-1 leading-snug">
            ${ex.name}
          </h3>

          <!-- Muscles -->
          <div class="flex flex-wrap gap-1 mb-2.5">
            ${(ex.primary_muscles || []).slice(0, 2).map(m => `
              <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
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
            onclick="openFedbModal(${idx})" 
            class="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center justify-center space-x-1 transition active:scale-95">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            <span>Guide</span>
          </button>

          <button 
            type="button" 
            onclick="previewExerciseOnAvatar('${(ex.name || '').replace(/'/g, "\\'")}', ${JSON.stringify(ex.primary_muscles || [])}, ${JSON.stringify(ex.secondary_muscles || [])}, '${(ex.category || '').replace(/'/g, "\\'")}')" 
            class="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center justify-center space-x-1 transition active:scale-95" 
            title="Highlight Muscles on 3D Body">
            <i data-lucide="crosshair" class="w-3.5 h-3.5"></i>
            <span class="hidden sm:inline">3D</span>
          </button>

          <button 
            type="button" 
            onclick="addToRoutine({ id: '${ex.id || idx}', name: '${(ex.name || '').replace(/'/g, "\\'")}', category: '${(ex.category || '').replace(/'/g, "\\'")}', equipment: '${(ex.equipment || 'Gym').replace(/'/g, "\\'")}', primary: ${JSON.stringify(ex.primary_muscles || [])}, secondary: ${JSON.stringify(ex.secondary_muscles || [])} })" 
            class="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 flex items-center justify-center space-x-1 transition active:scale-95" 
            title="Add to Custom Routine">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
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
).join('');

  if (fedbExercises.length < fedbTotal) {
    const loadMoreHtml = `
      <div class="col-span-full py-6 text-center">
        <button 
          type="button" 
          onclick="loadMoreFedb()" 
          class="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-dark-900 shadow-lg shadow-emerald-500/20 active:scale-95 transition">
          Load More 876 Exercises (${fedbExercises.length} / ${fedbTotal})
        </button>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', loadMoreHtml);


  lucide.createIcons();
}

function loadMoreFedb() {
  fedbSkip += FEDB_PAGE_SIZE;
  loadFedbExercises(true);
}

function openFedbModal(idx) {
  const ex = fedbExercises[idx];
  if (!ex) return;

  document.getElementById('guide-modal-title').innerText = ex.name;
  document.getElementById('guide-modal-equipment').innerText = `${ex.equipment || 'Gym'} • ${ex.level || 'Beginner'} • ${ex.mechanic || 'Compound'}`;
  
  const muscles = (ex.primary_muscles || []).join(', ');
  document.getElementById('guide-modal-muscles').innerText = muscles || 'Target Muscles';

  const photosContainer = document.getElementById('guide-modal-photos-grid');
  if (ex.images && ex.images.length > 0) {
    photosContainer.innerHTML = ex.images.map((imgUrl, i) => `
      <div class="rounded-xl overflow-hidden bg-dark-900 border border-slate-700 relative group">
        <img src="${imgUrl}" alt="${ex.name} Position ${i+1}" class="w-full h-44 sm:h-56 object-cover object-center">
        <div class="absolute bottom-2 left-2 bg-dark-900/90 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-300 border border-slate-700">
          ${i === 0 ? '1. Starting Position' : '2. Peak Contraction'}
        </div>
      </div>
    `).join('');


  const videoBtn = document.getElementById('guide-modal-video-link');
  const query = encodeURIComponent(ex.video_query || `how to do ${ex.name} exercise proper form`);
  videoBtn.href = `https://www.youtube.com/results?search_query=${query}`;

  const musclesContainer = document.getElementById('guide-modal-muscles-tags');
  const allMuscles = [...(ex.primary_muscles || []), ...(ex.secondary_muscles || [])];
  musclesContainer.innerHTML = allMuscles.map(m => `
    <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
      ${m}
    </span>
  `).join('');

  const cuesContainer = document.getElementById('guide-modal-cues-list');
  const cues = ex.instructions || [];
  cuesContainer.innerHTML = cues.map((cue, i) => `
    <div class="bg-dark-900/70 p-2.5 rounded-xl border border-slate-800 flex items-start space-x-2.5">
      <span class="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center shrink-0 text-[10px]">
        ${i + 1}
      </span>
      <p class="leading-relaxed text-slate-200 text-xs">${cue}</p>
    </div>
  `).join('');

  document.getElementById('exercise-guide-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

// -------------------------------------------------------------
// 3. EXERCISEDB GLOBAL (1,324 ANIMATED GIFS & INSTRUCTIONS)
// -------------------------------------------------------------
async function loadCatalogMetadata() {
  try {
    const res = await fetch('/api/catalog/filters');
    const data = await res.json();
    catalogBodyParts = ['All', ...(data.body_parts || [])];
    catalogTotal = data.total_exercises || 1324;
 catch (err) {
    console.error("Error loading catalog metadata:", err);

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
      ">
        <span>${part}</span>
      </button>
    `;
).join('');
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
 catch (err) {
    console.error("Error populating catalog equipment:", err);

}

async function loadCatalogExercises(append = false) {
  const container = document.getElementById('exercises-grid');

  if (!append) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400"></i>
        <p class="text-sm font-semibold">Querying Atlas ExerciseDB Collection (1,324 exercises)...</p>
      </div>
    `;
    lucide.createIcons();


  try {
    const params = new URLSearchParams({
      limit: CATALOG_PAGE_SIZE,
      skip: catalogSkip
  );

    if (activeCatalogPart !== 'All') params.set('body_part', activeCatalogPart);
    if (activeEquipment !== 'All') params.set('equipment', activeEquipment);
    
    // Muscle Avatar Filter
    if (selectedMuscle && MUSCLE_MAP[selectedMuscle]) {
      const mInfo = MUSCLE_MAP[selectedMuscle];
      if (mInfo.catalogTarget) params.set('target', mInfo.catalogTarget);
      if (mInfo.catalogBodyPart) params.set('body_part', mInfo.catalogBodyPart);
  
    if (searchQuery) {
      params.set('search', searchQuery);
  

    const res = await fetch(`/api/catalog?${params.toString()}`);
    const data = await res.json();
    
    catalogTotal = data.total || 0;
    const newItems = data.exercises || [];

    if (append) {
      catalogExercises = [...catalogExercises, ...newItems];
   else {
      catalogExercises = newItems;
  

    renderCatalogGrid();
 catch (err) {
    console.error("Error querying ExerciseDB catalog:", err);

}

function renderCatalogGrid() {
  const container = document.getElementById('exercises-grid');
  const countBadge = document.getElementById('result-count-badge');
  const musclePrefix = selectedMuscle && MUSCLE_MAP[selectedMuscle] ? `[${MUSCLE_MAP[selectedMuscle].label}] ` : '';

  if (countBadge) {
    countBadge.innerText = `${musclePrefix}Showing ${catalogExercises.length} of ${catalogTotal} global exercises (ExerciseDB)`;


  if (catalogExercises.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-14 text-center text-slate-400 bg-dark-850/60 rounded-2xl border border-slate-800 p-8">
        <i data-lucide="search-x" class="w-12 h-12 mx-auto mb-3 text-slate-600"></i>
        <h3 class="text-base font-bold text-white mb-1">No exercises found in ExerciseDB</h3>
        <p class="text-xs text-slate-400 mb-4">Try a different search term or reset filters.</p>
        <button onclick="clearSearch(); clearMuscleFilter(); setCatalogPartFilter('All');" class="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-dark-900 hover:bg-cyan-400">
          Reset Filters
        </button>
      </div>
    `;
    lucide.createIcons();
    return;


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
            class="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center justify-center space-x-1 transition active:scale-95">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            <span>GIF</span>
          </button>

          <button 
            type="button" 
            onclick="previewExerciseOnAvatar('${(ex.name || '').replace(/'/g, "\\'")}', ['${(ex.target_muscle || '').replace(/'/g, "\\'")}'], ${JSON.stringify(ex.secondary_muscles || [])}, '${(ex.body_part || '').replace(/'/g, "\\'")}')" 
            class="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center justify-center space-x-1 transition active:scale-95" 
            title="Highlight Muscles on 3D Body">
            <i data-lucide="crosshair" class="w-3.5 h-3.5"></i>
            <span class="hidden sm:inline">3D</span>
          </button>

          <button 
            type="button" 
            onclick="addToRoutine({ id: '${ex.id || idx}', name: '${(ex.name || '').replace(/'/g, "\\'")}', category: '${(ex.body_part || '').replace(/'/g, "\\'")}', equipment: '${(ex.equipment || 'Gym').replace(/'/g, "\\'")}', primary: ['${(ex.target_muscle || '').replace(/'/g, "\\'")}'], secondary: ${JSON.stringify(ex.secondary_muscles || [])} })" 
            class="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center justify-center space-x-1 transition active:scale-95" 
            title="Add to Custom Routine">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
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
).join('');

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
  document.getElementById('guide-modal-equipment').innerText = `${ex.body_part} • ${ex.equipment || 'Gym Equipment'}`;
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
 else {
    photosContainer.innerHTML = `
      <div class="col-span-2 py-8 text-center text-slate-500 bg-dark-900/60 rounded-xl border border-slate-800">
        <p class="text-xs">Visual demonstration available in video guide.</p>
      </div>
    `;


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

    const calBadge = document.getElementById('guide-modal-calories');
    if (calBadge) {
      const met = getExerciseMet(exerciseName);
      const setBurn = calculateSetCalories(exerciseName);
      calBadge.innerHTML = `<span class="flex items-center space-x-1 text-amber-400 font-bold"><i data-lucide="flame" class="w-3.5 h-3.5 text-amber-400 fill-amber-400 inline"></i><span>MET ${met} • ~${setBurn} kcal/set</span></span>`;
    }

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
   else {
      photosContainer.innerHTML = `
        <div class="col-span-2 py-8 text-center text-slate-500 bg-dark-900/60 rounded-xl border border-slate-800">
          <p class="text-xs">Visual demonstration available in video guide.</p>
        </div>
      `;
  

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
 catch (err) {
    console.error("Error opening exercise guide:", err);

}

function closeExerciseGuideModal() {
  document.getElementById('exercise-guide-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function handleBackdropClick(event, modalId) {
  if (event.target.id === modalId) {
    if (modalId === 'exercise-guide-modal') closeExerciseGuideModal();
    else if (modalId === 'routine-drawer-modal') closeRoutineDrawer();
    else if (modalId === 'routine-drawer-modal') closeRoutineDrawer();

}

// Global Escape Key to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeExerciseGuideModal();
    closeRoutineDrawer();
  }
});

// Global Escape Key to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeExerciseGuideModal();
    closeRoutineDrawer();

});


}
