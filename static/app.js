// 90-Day Fat-Loss + Strength Workout Application Logic
// Complete Session Flow: Dynamic Warm-Up -> Strength Lifting -> Conditioning -> Cardio -> Post-Workout Static Cool-Down

let allDays = [];
let profileData = null;
let statsData = null;
let coachingNotes = [];
let currentFilter = 'all';
let currentWeek = '';
let searchQuery = '';
let currentModalDay = null;

// Rest Timer State
let timerSeconds = 90;
let timerInitial = 90;
let timerInterval = null;
let isTimerRunning = false;
let weightChartInstance = null;

// Audio alert using Web Audio API
let audioCtx = null;
function playTimerAlert() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    console.warn("Audio alert failed:", e);
  }
}

// Show Toast
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const borderCol = type === 'success' ? 'border-emerald-500' : (type === 'error' ? 'border-rose-500' : 'border-cyan-500');
  const textCol = type === 'success' ? 'text-emerald-400' : (type === 'error' ? 'text-rose-400' : 'text-cyan-400');
  
  toast.className = `glass-panel ${borderCol} p-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs text-white max-w-sm pointer-events-auto transition transform translate-y-2 opacity-0 duration-300 mx-auto`;
  toast.innerHTML = `
    <span class="${textCol} font-black text-sm">•</span>
    <span class="flex-1">${message}</span>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);
  
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Copy Mobile IP Address
function copyMobileUrl() {
  const ip = document.getElementById('mobile-ip-display').innerText.trim();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(ip).then(() => {
      showToast(`Copied ${ip} to clipboard! Open on your mobile browser.`, 'success');
    });
  } else {
    showToast(`URL: ${ip}`, 'info');
  }
}

// Backdrop click handler for modals
function handleBackdropClick(event, modalId) {
  if (event.target.id === modalId) {
    if (modalId === 'workout-modal') closeWorkoutModal();
    else if (modalId === 'weight-modal') closeWeightModal();
    else if (modalId === 'rules-modal') closeCoachingModal();
    else if (modalId === 'exercise-guide-modal') closeExerciseGuideModal();
  }
}

// Global Escape Key to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeWorkoutModal();
    closeWeightModal();
    closeCoachingModal();
    closeExerciseGuideModal();
  }
});

// 1. Initial Load & Setup
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await refreshAllData();
  lucide.createIcons();
});

async function refreshAllData() {
  await Promise.all([
    loadHealth(),
    loadProfile(),
    loadStats(),
    loadDays(),
    loadCoachingNotes()
  ]);
  lucide.createIcons();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('jump') === 'today') {
    setTimeout(jumpToToday, 200);
  }
}

// Load Health & MongoDB connection
async function loadHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    const statusText = document.getElementById('db-status-text');
    if (data.status === 'connected') {
      statusText.innerHTML = `Atlas: <span class="text-emerald-400 font-bold">Connected (${data.counts.days} Days)</span>`;
    } else {
      statusText.innerHTML = `Atlas: <span class="text-rose-400 font-bold">Offline</span>`;
    }
  } catch (err) {
    console.error("Health check error:", err);
  }
}

// Load Profile
async function loadProfile() {
  try {
    const res = await fetch('/api/profile');
    profileData = await res.json();
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

// Load Stats
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    statsData = await res.json();
    renderStats(statsData);
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

function renderStats(s) {
  if (!s) return;
  document.getElementById('hero-days-completed').innerText = s.completed_days;
  document.getElementById('hero-streak-count').innerText = s.current_streak;
  
  if (s.weight_stats) {
    document.getElementById('hero-current-weight').innerText = s.weight_stats.current_weight_kg;
  }
  
  document.getElementById('overall-progress-pct').innerText = `${s.completion_percentage}%`;
  document.getElementById('overall-progress-bar').style.width = `${s.completion_percentage}%`;
  
  if (s.phases && s.phases.phase1) {
    document.getElementById('p1-count').innerText = `${s.phases.phase1.completed}/${s.phases.phase1.total} Done`;
  }
  if (s.phases && s.phases.phase2) {
    document.getElementById('p2-count').innerText = `${s.phases.phase2.completed}/${s.phases.phase2.total} Done`;
  }
  if (s.phases && s.phases.phase3) {
    document.getElementById('p3-count').innerText = `${s.phases.phase3.completed}/${s.phases.phase3.total} Done`;
  }
}

// Load Days
async function loadDays() {
  try {
    const res = await fetch('/api/days');
    if (!res.ok) {
      let msg = "Failed to load workout days from MongoDB.";
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) msg = errJson.detail;
      } catch (e) {}
      throw new Error(msg);
    }
    const data = await res.json();
    allDays = data.days || [];
    renderWorkoutGrid();
  } catch (err) {
    console.error("Error loading days:", err);
    document.getElementById('workout-grid').innerHTML = `
      <div class="col-span-full py-10 px-4 text-center bg-dark-900/80 rounded-2xl border border-rose-500/30 max-w-xl mx-auto my-6">
        <i data-lucide="alert-triangle" class="w-10 h-10 text-rose-500 mx-auto mb-3"></i>
        <h3 class="text-base font-bold text-white mb-2">MongoDB Connection Required</h3>
        <p class="text-xs text-rose-300 mb-4 leading-relaxed">${err.message || 'Unable to connect to MongoDB Atlas.'}</p>
        <div class="bg-dark-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 text-left mb-4 space-y-1">
          <p class="font-bold text-amber-400">💡 If hosted on Vercel:</p>
          <p>1. Open <a href="https://cloud.mongodb.com" target="_blank" class="text-cyan-400 underline font-semibold">MongoDB Atlas</a> &gt; Security &gt; <b>Network Access</b>.</p>
          <p>2. Click <b>+ Add IP Address</b> and choose <b>Allow Access from Anywhere (0.0.0.0/0)</b>.</p>
          <p>3. Wait 30 seconds for it to become Active, then tap Retry below.</p>
        </div>
        <button onclick="loadDays()" class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20">
          Retry Connection
        </button>
      </div>
    `;
    lucide.createIcons();
  }
}

// Filter and render workout grid
function renderWorkoutGrid() {
  const grid = document.getElementById('workout-grid');
  let filtered = allDays.filter(day => {
    // 1. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inType = day.day_type.toLowerCase().includes(q);
      const inStrength = (day.strength_workout || '').toLowerCase().includes(q);
      const inCardio = (day.cardio || '').toLowerCase().includes(q);
      const inDate = (day.date_display || '').toLowerCase().includes(q);
      const inWarmup = (day.warmup_stretches || []).some(s => s.name.toLowerCase().includes(q) || (s.focus || '').toLowerCase().includes(q));
      const inCooldown = (day.cooldown_stretches || []).some(s => s.name.toLowerCase().includes(q) || (s.focus || '').toLowerCase().includes(q));
      if (!inType && !inStrength && !inCardio && !inDate && !inWarmup && !inCooldown) return false;
    }

    // 2. Week Select
    if (currentWeek && day.week_number !== parseInt(currentWeek)) {
      return false;
    }

    // 3. Filter Pills
    if (currentFilter === 'push' && !day.day_type.toLowerCase().includes('push')) return false;
    if (currentFilter === 'pull' && !day.day_type.toLowerCase().includes('pull')) return false;
    if (currentFilter === 'legs' && !day.day_type.toLowerCase().includes('legs')) return false;
    if (currentFilter === 'recovery' && !day.day_type.toLowerCase().includes('recovery')) return false;
    if (currentFilter === 'pending' && day.completed) return false;
    if (currentFilter === 'completed' && !day.completed) return false;

    return true;
  });

  document.getElementById('filtered-count').innerText = `Showing ${filtered.length} of ${allDays.length} days`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-10 text-center text-slate-500 bg-dark-850/60 rounded-2xl border border-slate-800">
        <i data-lucide="search-x" class="w-7 h-7 mx-auto mb-2 text-slate-600"></i>
        <p class="text-xs">No workout days match your selected filters.</p>
        <button onclick="resetFilters()" class="mt-2.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300">
          Reset Filters
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  grid.innerHTML = filtered.map(day => {
    const isCompleted = day.completed;
    const isRecovery = day.day_type.toLowerCase().includes('recovery');
    const isDeload = day.is_deload;

    let badgeClass = 'badge-push';
    if (day.day_type.toLowerCase().includes('pull')) badgeClass = 'badge-pull';
    else if (day.day_type.toLowerCase().includes('legs')) badgeClass = 'badge-legs';
    else if (isRecovery) badgeClass = 'badge-recovery';

    const cardBorder = isCompleted ? 'border-emerald-500/40 bg-emerald-950/15' : (isDeload ? 'border-amber-500/35 bg-amber-950/10' : 'border-slate-800 bg-dark-850');
    const warmupCount = (day.warmup_stretches || []).length || 5;
    const cooldownCount = (day.cooldown_stretches || []).length || 5;

    return `
      <div id="day-card-${day.day_number}" class="glass-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between border ${cardBorder} relative active:border-cyan-500/50" onclick="handleCardClick(${day.day_number}, event)">
        
        <div>
          <!-- Top Row: Day #, Date, Phase, Deload Tag, Checkbox -->
          <div class="flex items-center justify-between gap-1.5 mb-2">
            <div class="flex items-center space-x-1.5">
              <span class="px-2 py-0.5 rounded-md text-[11px] font-black font-heading tracking-wide ${isCompleted ? 'bg-emerald-500 text-dark-900' : 'bg-dark-900 text-cyan-400 border border-slate-700'}">
                DAY ${day.day_number}
              </span>
              <span class="text-xs font-semibold text-slate-200">${day.date_display}</span>
              <span class="text-[10px] text-slate-500 font-medium">W${day.week_number}</span>
            </div>

            <!-- Deload & Touch Checkbox -->
            <div class="flex items-center space-x-2" onclick="event.stopPropagation()">
              ${isDeload ? `<span class="badge-deload px-1.5 py-0.2 rounded text-[9px] font-black">DELOAD</span>` : ''}
              <label class="flex items-center cursor-pointer p-0.5" title="Tap to Toggle Completed">
                <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleDayCompletionDirect(${day.day_number}, event)" class="custom-checkbox">
              </label>
            </div>
          </div>

          <!-- Day Type Badge -->
          <div class="mb-2">
            <span class="${badgeClass} px-2 py-0.5 rounded-md text-xs font-bold inline-block">
              ${day.day_type.split('\n')[0]}
            </span>
          </div>

          <!-- Strength Lifts Preview -->
          <div class="text-xs text-slate-300 bg-dark-900/70 p-2.5 rounded-xl border border-slate-800/80 mb-2 min-h-[48px] line-clamp-2">
            ${day.strength_workout}
          </div>

          <!-- Stretches & Protocol Chips -->
          <div class="flex items-center justify-between text-[10px] text-slate-400 bg-dark-900/40 p-2 rounded-lg border border-slate-800/60 mb-2.5">
            <span class="flex items-center space-x-1 text-cyan-400 font-semibold">
              <i data-lucide="wind" class="w-3 h-3"></i>
              <span>${warmupCount} Dynamic Stretches</span>
            </span>
            <span class="text-slate-600">•</span>
            <span class="flex items-center space-x-1 text-indigo-400 font-semibold">
              <i data-lucide="heart-pulse" class="w-3 h-3"></i>
              <span>${cooldownCount} Static Stretches</span>
            </span>
          </div>

          <!-- Quick Meta Chips: Time, Steps, Effort -->
          <div class="grid grid-cols-3 gap-1 text-[10px] text-slate-400 mb-2.5">
            <div class="bg-dark-900/60 px-1.5 py-1 rounded border border-slate-800 text-center truncate" title="Duration">
              ⏱️ ${day.target_duration}
            </div>
            <div class="bg-dark-900/60 px-1.5 py-1 rounded border border-slate-800 text-center truncate" title="Daily Steps">
              👟 ${day.daily_steps_target}
            </div>
            <div class="bg-dark-900/60 px-1.5 py-1 rounded border border-slate-800 text-center truncate" title="Effort">
              ⚡ ${day.effort_target.replace('RPE ', '')}
            </div>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div class="text-[11px]">
            ${day.actual_weight_kg 
              ? `<span class="text-emerald-400 font-bold">⚖️ ${day.actual_weight_kg} kg</span>` 
              : (day.completed ? '<span class="text-emerald-400 font-semibold">✓ Completed</span>' : '<span class="text-slate-500">Not logged</span>')
            }
          </div>
          <button type="button" class="px-2.5 py-1 rounded-lg text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-dark-900 hover:bg-slate-800 border border-slate-700 flex items-center space-x-1">
            <span>View Full Plan</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>

      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function handleCardClick(dayNumber, event) {
  if (event.target.tagName !== 'INPUT') {
    openWorkoutModal(dayNumber);
  }
}

// 2. Direct Toggle from Card Checkbox
async function toggleDayCompletionDirect(dayNumber, event) {
  event.stopPropagation();
  try {
    const res = await fetch(`/api/days/${dayNumber}/toggle`, { method: 'POST' });
    const data = await res.json();
    
    const d = allDays.find(x => x.day_number === dayNumber);
    if (d) {
      d.completed = data.completed;
      d.completed_at = data.completed_at;
    }
    
    await loadStats();
    renderWorkoutGrid();
    
    if (data.completed) {
      showToast(`Day ${dayNumber} completed! Keep going Kush 🔥`, 'success');
    } else {
      showToast(`Day ${dayNumber} set to pending`, 'info');
    }
  } catch (err) {
    console.error("Error toggling completion:", err);
    showToast("Failed to sync to MongoDB Atlas", "error");
  }
}

// 3. Workout Modal (Mobile Sheet) Management
function openWorkoutModal(dayNumber) {
  const day = allDays.find(d => d.day_number === dayNumber);
  if (!day) return;
  currentModalDay = JSON.parse(JSON.stringify(day)); // clone

  // Set modal text & badges
  document.getElementById('modal-day-badge').innerText = `DAY ${day.day_number}`;
  document.getElementById('modal-date-badge').innerText = day.date_display;
  document.getElementById('modal-week-badge').innerText = `Week ${day.week_number}`;
  
  const deloadBadge = document.getElementById('modal-deload-badge');
  if (day.is_deload) deloadBadge.classList.remove('hidden');
  else deloadBadge.classList.add('hidden');

  document.getElementById('modal-workout-title').innerText = day.day_type.split('\n')[0];
  document.getElementById('modal-duration-target').innerText = day.target_duration;
  document.getElementById('modal-effort-target').innerText = day.effort_target;
  document.getElementById('modal-steps-target').innerText = day.daily_steps_target;

  // Render Stage 1: Warmup Stretches
  renderModalWarmupStretches(currentModalDay);

  // Render Stage 2: Main Strength Exercises
  renderModalExercises(currentModalDay);

  // Render Stage 3: Bodyweight & Conditioning (with Photos & Video)
  renderModalConditioning(currentModalDay);

  // Render Stage 4: Cardio Protocol (with Photos & Video)
  renderModalCardio(currentModalDay);

  // Render Stage 5: Cooldown Stretches
  renderModalCooldownStretches(currentModalDay);

  // Stage 6: Form Inputs
  document.getElementById('input-modal-weight').value = day.actual_weight_kg || '';
  document.getElementById('input-modal-steps').value = day.actual_steps || '';
  document.getElementById('input-modal-duration').value = day.actual_duration_min || '';
  document.getElementById('input-modal-notes').value = day.user_notes || '';
  
  const rpeVal = day.rpe_rating || 7;
  document.getElementById('input-modal-rpe').value = rpeVal;
  updateRpeLabel(rpeVal);

  document.getElementById('modal-completed-checkbox').checked = !!day.completed;

  // Show Modal
  document.getElementById('workout-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeWorkoutModal() {
  document.getElementById('workout-modal').classList.add('hidden');
  document.body.style.overflow = '';
  currentModalDay = null;
}

// Stage 1: Render Dynamic Warm-up & Stretches (with Photos & Video)
function renderModalWarmupStretches(day) {
  const container = document.getElementById('modal-warmup-stretches-list');
  const stretches = day.warmup_stretches || [];
  document.getElementById('warmup-count-badge').innerText = `${stretches.length} Stretches`;

  if (stretches.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400">${day.warmup_cooldown}</p>`;
    return;
  }

  container.innerHTML = stretches.map((s, idx) => {
    const thumbUrl = (s.media && s.media.images && s.media.images.length > 0) ? s.media.images[0] : '';
    return `
      <div class="bg-dark-900/90 p-2.5 rounded-xl border border-cyan-500/20 flex items-center justify-between gap-2">
        <div class="flex items-center space-x-2.5 flex-1 min-w-0">
          <input type="checkbox" ${s.completed ? 'checked' : ''} 
            onchange="toggleWarmupStretch(${idx}, this.checked)"
            class="custom-checkbox-sm shrink-0">
          
          ${thumbUrl ? `
            <div class="w-10 h-10 rounded-lg overflow-hidden bg-dark-800 border border-slate-700 shrink-0 cursor-pointer" onclick="openExerciseGuideModal('${s.name}')" title="View demonstration photos & video">
              <img src="${thumbUrl}" alt="${s.name}" class="w-full h-full object-cover">
            </div>
          ` : ''}

          <div class="min-w-0 flex-1">
            <span class="text-xs font-bold text-white block truncate ${s.completed ? 'line-through text-slate-500' : ''}">${s.name}</span>
            <div class="flex items-center space-x-2 text-[11px]">
              <span class="text-cyan-400 font-semibold">${s.reps_or_time}</span>
              <span class="text-slate-600">•</span>
              <button type="button" onclick="openExerciseGuideModal('${s.name}')" class="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center space-x-0.5">
                <i data-lucide="image" class="w-3 h-3 inline"></i>
                <span>Photos & Video</span>
              </button>
            </div>
          </div>
        </div>

        <button type="button" onclick="startStretchTimer('${s.reps_or_time}')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 shrink-0 transition flex items-center space-x-1">
          <i data-lucide="timer" class="w-3 h-3"></i>
          <span>Timer</span>
        </button>
      </div>
    `;
  }).join('');
}

function toggleWarmupStretch(idx, checked) {
  if (!currentModalDay || !currentModalDay.warmup_stretches) return;
  currentModalDay.warmup_stretches[idx].completed = checked;
  renderModalWarmupStretches(currentModalDay);
}

// Stage 5: Render Post-Workout Cool-Down & Static Stretches (with Photos & Video)
function renderModalCooldownStretches(day) {
  const container = document.getElementById('modal-cooldown-stretches-list');
  const stretches = day.cooldown_stretches || [];
  document.getElementById('cooldown-count-badge').innerText = `${stretches.length} Stretches`;

  if (stretches.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400">Finish with 3–5 min slow walk and gentle stretches.</p>`;
    return;
  }

  container.innerHTML = stretches.map((s, idx) => {
    const thumbUrl = (s.media && s.media.images && s.media.images.length > 0) ? s.media.images[0] : '';
    return `
      <div class="bg-dark-900/90 p-2.5 rounded-xl border border-indigo-500/20 flex items-center justify-between gap-2">
        <div class="flex items-center space-x-2.5 flex-1 min-w-0">
          <input type="checkbox" ${s.completed ? 'checked' : ''} 
            onchange="toggleCooldownStretch(${idx}, this.checked)"
            class="custom-checkbox-sm shrink-0">
          
          ${thumbUrl ? `
            <div class="w-10 h-10 rounded-lg overflow-hidden bg-dark-800 border border-slate-700 shrink-0 cursor-pointer" onclick="openExerciseGuideModal('${s.name}')" title="View demonstration photos & video">
              <img src="${thumbUrl}" alt="${s.name}" class="w-full h-full object-cover">
            </div>
          ` : ''}

          <div class="min-w-0 flex-1">
            <span class="text-xs font-bold text-white block truncate ${s.completed ? 'line-through text-slate-500' : ''}">${s.name}</span>
            <div class="flex items-center space-x-2 text-[11px]">
              <span class="text-indigo-400 font-semibold">${s.reps_or_time}</span>
              <span class="text-slate-600">•</span>
              <button type="button" onclick="openExerciseGuideModal('${s.name}')" class="text-indigo-400 hover:text-indigo-300 font-bold underline flex items-center space-x-0.5">
                <i data-lucide="image" class="w-3 h-3 inline"></i>
                <span>Photos & Video</span>
              </button>
            </div>
          </div>
        </div>

        <button type="button" onclick="startStretchTimer('${s.reps_or_time}')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 shrink-0 transition flex items-center space-x-1">
          <i data-lucide="timer" class="w-3 h-3"></i>
          <span>Timer</span>
        </button>
      </div>
    `;
  }).join('');
}

function toggleCooldownStretch(idx, checked) {
  if (!currentModalDay || !currentModalDay.cooldown_stretches) return;
  currentModalDay.cooldown_stretches[idx].completed = checked;
  renderModalCooldownStretches(currentModalDay);
}

// Quick timer trigger for stretches
function startStretchTimer(repsOrTime) {
  let seconds = 30;
  if (repsOrTime.includes('45')) seconds = 45;
  else if (repsOrTime.includes('60') || repsOrTime.includes('1 min')) seconds = 60;
  else if (repsOrTime.includes('3–5 min') || repsOrTime.includes('3 min')) seconds = 180;
  else if (repsOrTime.includes('30')) seconds = 30;

  setTimerSeconds(seconds);
  toggleTimer();
  showToast(`Timer set for ${seconds}s stretch!`, 'info');
}

// Stage 2: Mobile-Optimized Set Logger with Exercise Thumbnails & Form Guide
function renderModalExercises(day) {
  const container = document.getElementById('modal-exercises-list');
  const exercises = day.parsed_exercises || [];

  if (exercises.length === 0) {
    container.innerHTML = `
      <div class="p-3 bg-dark-900 rounded-xl text-slate-400 text-xs">
        ${day.strength_workout || 'No strength training scheduled for recovery day.'}
      </div>
    `;
    return;
  }

  container.innerHTML = exercises.map((ex, exIdx) => {
    const sets = (ex.logged_sets && ex.logged_sets.length > 0) ? ex.logged_sets : [
      { set_num: 1, weight_kg: '', reps: '', completed: false },
      { set_num: 2, weight_kg: '', reps: '', completed: false },
      { set_num: 3, weight_kg: '', reps: '', completed: false }
    ];

    const thumbUrl = (ex.media && ex.media.images && ex.media.images.length > 0) ? ex.media.images[0] : '';

    return `
      <div class="bg-dark-900 border border-slate-800 rounded-xl p-3 space-y-2.5">
        <div class="flex items-center justify-between gap-2">
          
          <!-- Exercise Thumbnail & Name -->
          <div class="flex items-center space-x-2.5 flex-1 min-w-0">
            ${thumbUrl ? `
              <div class="w-11 h-11 rounded-lg overflow-hidden bg-dark-800 border border-slate-700 shrink-0 cursor-pointer" onclick="openExerciseGuideModal('${ex.name}')" title="Click for photos & video">
                <img src="${thumbUrl}" alt="${ex.name}" class="w-full h-full object-cover">
              </div>
            ` : `
              <div class="w-11 h-11 rounded-lg bg-dark-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                <i data-lucide="dumbbell" class="w-5 h-5"></i>
              </div>
            `}
            <div class="min-w-0">
              <span class="text-xs sm:text-sm font-extrabold text-white block truncate">${ex.name}</span>
              <div class="flex items-center space-x-1.5 text-xs">
                <span class="text-emerald-400 font-bold">${ex.target}</span>
                <span class="text-slate-600">•</span>
                <button type="button" onclick="openExerciseGuideModal('${ex.name}')" class="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center space-x-0.5">
                  <i data-lucide="image" class="w-3 h-3 inline"></i>
                  <span>Photos & Video</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Add Set Button -->
          <button type="button" onclick="addSetToExercise(${exIdx})" class="text-[11px] font-bold text-emerald-400 bg-dark-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center space-x-1 shrink-0 transition">
            <i data-lucide="plus" class="w-3 h-3"></i>
            <span>Set</span>
          </button>
        </div>

        <!-- Touch Set Rows -->
        <div class="space-y-1.5 pt-1">
          ${sets.map((s, sIdx) => `
            <div class="bg-dark-850 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between gap-1.5">
              
              <!-- Set Pill -->
              <span class="w-7 text-center text-xs font-mono font-bold text-slate-400">
                S${s.set_num || (sIdx + 1)}
              </span>

              <!-- Weight (kg) with Stepper -->
              <div class="flex items-center space-x-1">
                <button type="button" onclick="adjustSetField(${exIdx}, ${sIdx}, 'weight_kg', -2.5)" class="w-6 h-6 rounded bg-dark-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700 active:bg-slate-600">-</button>
                <div class="relative w-16">
                  <input type="number" step="0.5" value="${s.weight_kg !== undefined ? s.weight_kg : ''}" 
                    id="set-weight-${exIdx}-${sIdx}"
                    onchange="updateExerciseSet(${exIdx}, ${sIdx}, 'weight_kg', this.value)"
                    placeholder="kg" 
                    class="w-full bg-dark-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-center text-white focus:outline-none focus:border-cyan-500 font-bold">
                </div>
                <button type="button" onclick="adjustSetField(${exIdx}, ${sIdx}, 'weight_kg', 2.5)" class="w-6 h-6 rounded bg-dark-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700 active:bg-slate-600">+</button>
              </div>

              <!-- Reps with Stepper -->
              <div class="flex items-center space-x-1">
                <button type="button" onclick="adjustSetField(${exIdx}, ${sIdx}, 'reps', -1)" class="w-6 h-6 rounded bg-dark-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700 active:bg-slate-600">-</button>
                <div class="relative w-14">
                  <input type="number" value="${s.reps !== undefined ? s.reps : ''}" 
                    id="set-reps-${exIdx}-${sIdx}"
                    onchange="updateExerciseSet(${exIdx}, ${sIdx}, 'reps', this.value)"
                    placeholder="reps" 
                    class="w-full bg-dark-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-center text-white focus:outline-none focus:border-cyan-500 font-bold">
                </div>
                <button type="button" onclick="adjustSetField(${exIdx}, ${sIdx}, 'reps', 1)" class="w-6 h-6 rounded bg-dark-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700 active:bg-slate-600">+</button>
              </div>

              <!-- Done Checkbox -->
              <div class="pl-1">
                <input type="checkbox" ${s.completed ? 'checked' : ''} 
                  onchange="updateExerciseSet(${exIdx}, ${sIdx}, 'completed', this.checked)"
                  class="custom-checkbox-sm">
              </div>

            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function adjustSetField(exIdx, setIdx, field, delta) {
  if (!currentModalDay || !currentModalDay.parsed_exercises) return;
  const ex = currentModalDay.parsed_exercises[exIdx];
  if (!ex.logged_sets) ex.logged_sets = [];
  while (ex.logged_sets.length <= setIdx) {
    ex.logged_sets.push({ set_num: ex.logged_sets.length + 1, weight_kg: '', reps: '', completed: false });
  }

  let curr = parseFloat(ex.logged_sets[setIdx][field]) || 0;
  let nextVal = Math.max(0, +(curr + delta).toFixed(1));
  ex.logged_sets[setIdx][field] = nextVal;

  const inputEl = document.getElementById(`set-${field === 'weight_kg' ? 'weight' : 'reps'}-${exIdx}-${setIdx}`);
  if (inputEl) inputEl.value = nextVal;
}

function addSetToExercise(exIdx) {
  if (!currentModalDay || !currentModalDay.parsed_exercises) return;
  const ex = currentModalDay.parsed_exercises[exIdx];
  if (!ex.logged_sets) ex.logged_sets = [];
  const nextSetNum = ex.logged_sets.length + 1;
  ex.logged_sets.push({ set_num: nextSetNum, weight_kg: '', reps: '', completed: false });
  renderModalExercises(currentModalDay);
}

function updateExerciseSet(exIdx, setIdx, field, val) {
  if (!currentModalDay || !currentModalDay.parsed_exercises) return;
  const ex = currentModalDay.parsed_exercises[exIdx];
  if (!ex.logged_sets) ex.logged_sets = [];
  while (ex.logged_sets.length <= setIdx) {
    ex.logged_sets.push({ set_num: ex.logged_sets.length + 1, weight_kg: '', reps: '', completed: false });
  }
  if (field === 'completed') {
    ex.logged_sets[setIdx][field] = !!val;
    if (val) {
      showToast("Set complete! Starting rest timer...", 'info');
      setTimerSeconds(90);
      toggleTimer();
    }
  } else {
    ex.logged_sets[setIdx][field] = val ? parseFloat(val) : '';
  }
}

function updateRpeLabel(val) {
  const label = document.getElementById('modal-rpe-value');
  let desc = "Target Effort";
  if (val <= 4) desc = "Warmup / Easy";
  else if (val <= 6) desc = "Conversational";
  else if (val == 7) desc = "3 reps in reserve";
  else if (val == 8) desc = "2 reps in reserve";
  else if (val >= 9) desc = "Max / High fatigue";
  label.innerText = `RPE ${val} (${desc})`;
}

// Thumbnail mapping for conditioning and cardio
const CONDITIONING_THUMBS = {
  'push-up': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pushups/0.jpg',
  'plank': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Plank/0.jpg',
  'mountain climber': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Mountain_Climbers/0.jpg',
  'jumping jack': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Box_Skip/0.jpg',
  'high knee': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Step-up_with_Knee_Raise/0.jpg',
  'stepper': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Step-up_with_Knee_Raise/0.jpg',
  'squat': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bodyweight_Squat/0.jpg',
  'skipping': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Fast_Skipping/0.jpg',
  'treadmill': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Walking_Treadmill/0.jpg',
  'cross trainer': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Elliptical_Trainer/0.jpg',
  'elliptical': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Elliptical_Trainer/0.jpg',
  'cycle': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Recumbent_Bike/0.jpg',
  'bike': 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Recumbent_Bike/0.jpg'
};

// Stage 3: Render Bodyweight & Conditioning (with Photos & Video)
function renderModalConditioning(day) {
  const container = document.getElementById('modal-conditioning-content');
  const rawText = day.bodyweight_conditioning || '';
  if (!rawText || rawText.toLowerCase().includes('optional relaxed walk') || rawText.toLowerCase().includes('no conditioning circuit')) {
    container.innerHTML = `<p class="text-xs text-slate-400 italic">${rawText || 'No conditioning circuit scheduled today.'}</p>`;
    return;
  }

  // Parse items split by semicolon
  const parts = rawText.split(';').map(p => p.trim()).filter(Boolean);
  if (!currentModalDay._conditioning_items) {
    currentModalDay._conditioning_items = parts.map(p => ({ raw: p, completed: !!currentModalDay.conditioning_completed }));
  }

  container.innerHTML = `
    <div class="space-y-2">
      ${currentModalDay._conditioning_items.map((item, idx) => {
        let name = item.raw;
        let target = '';
        const match = item.raw.match(/^([^0-9]+)\s*([\d\w\s\-–—\(\)]+.*)$/);
        if (match) {
          name = match[1].trim();
          target = match[2].trim();
        }

        let thumbUrl = '';
        const lower = name.toLowerCase();
        for (const [k, url] of Object.entries(CONDITIONING_THUMBS)) {
          if (lower.includes(k)) {
            thumbUrl = url;
            break;
          }
        }
        if (!thumbUrl) {
          thumbUrl = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pushups/0.jpg';
        }

        return `
          <div class="bg-dark-900/90 p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between gap-2">
            <div class="flex items-center space-x-2.5 flex-1 min-w-0">
              <input type="checkbox" ${item.completed ? 'checked' : ''} 
                onchange="toggleConditioningItem(${idx}, this.checked)"
                class="custom-checkbox-sm shrink-0">

              <div class="w-10 h-10 rounded-lg overflow-hidden bg-dark-800 border border-slate-700 shrink-0 cursor-pointer" onclick="openExerciseGuideModal('${name}')" title="View demonstration photos & video">
                <img src="${thumbUrl}" alt="${name}" class="w-full h-full object-cover">
              </div>

              <div class="min-w-0 flex-1">
                <span class="text-xs font-bold text-white block truncate ${item.completed ? 'line-through text-slate-500' : ''}">${name}</span>
                <div class="flex items-center space-x-2 text-[11px]">
                  ${target ? `<span class="text-amber-400 font-semibold">${target}</span><span class="text-slate-600">•</span>` : ''}
                  <button type="button" onclick="openExerciseGuideModal('${name}')" class="text-amber-400 hover:text-amber-300 font-bold underline flex items-center space-x-0.5">
                    <i data-lucide="image" class="w-3 h-3 inline"></i>
                    <span>Photos & Video</span>
                  </button>
                </div>
              </div>
            </div>

            ${(target.includes('sec') || target.includes('min')) ? `
              <button type="button" onclick="startStretchTimer('${target}')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 shrink-0 transition flex items-center space-x-1">
                <i data-lucide="timer" class="w-3 h-3"></i>
                <span>Timer</span>
              </button>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function toggleConditioningItem(idx, checked) {
  if (!currentModalDay || !currentModalDay._conditioning_items) return;
  currentModalDay._conditioning_items[idx].completed = checked;
  const allDone = currentModalDay._conditioning_items.every(i => i.completed);
  currentModalDay.conditioning_completed = allDone;
  renderModalConditioning(currentModalDay);
}

// Stage 4: Render Cardio Protocol (with Photos & Video)
function renderModalCardio(day) {
  const container = document.getElementById('modal-cardio-content');
  const rawText = day.cardio || '';
  if (!rawText || rawText.toLowerCase().includes('none') || rawText.toLowerCase().includes('optional relaxed walk')) {
    container.innerHTML = `<p class="text-xs text-slate-400 italic">${rawText || 'No specific machine cardio scheduled today. Focus on conversational daily steps.'}</p>`;
    return;
  }

  const lower = rawText.toLowerCase();
  let cardioKey = 'Treadmill Incline / Brisk Walk';
  let cardioThumb = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Walking_Treadmill/0.jpg';
  let lookupQuery = 'treadmill';

  if (lower.includes('cross trainer') || lower.includes('elliptical')) {
    cardioKey = 'Cross Trainer / Elliptical';
    cardioThumb = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Elliptical_Trainer/0.jpg';
    lookupQuery = 'cross trainer';
  } else if (lower.includes('cycle') || lower.includes('bike')) {
    cardioKey = 'Stationary Cycle / Recumbent Bike';
    cardioThumb = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Recumbent_Bike/0.jpg';
    lookupQuery = 'cycle';
  }

  let durationMins = 20;
  const numMatch = rawText.match(/(\d+)\s*[-–]\s*(\d+)\s*min/);
  if (numMatch) {
    durationMins = parseInt(numMatch[1]);
  } else {
    const singleMatch = rawText.match(/(\d+)\s*min/);
    if (singleMatch) durationMins = parseInt(singleMatch[1]);
  }

  const isChecked = !!(currentModalDay && currentModalDay.cardio_completed);

  container.innerHTML = `
    <div class="bg-dark-900/90 p-3 rounded-xl border border-rose-500/20 flex items-center justify-between gap-3">
      <div class="flex items-center space-x-3 flex-1 min-w-0">
        <input type="checkbox" ${isChecked ? 'checked' : ''} 
          onchange="toggleCardioComplete(this.checked)"
          class="custom-checkbox-sm shrink-0">

        <div class="w-12 h-12 rounded-lg overflow-hidden bg-dark-800 border border-slate-700 shrink-0 cursor-pointer" onclick="openExerciseGuideModal('${lookupQuery}')" title="View demonstration photos & video">
          <img src="${cardioThumb}" alt="${cardioKey}" class="w-full h-full object-cover">
        </div>

        <div class="min-w-0 flex-1">
          <span class="text-xs sm:text-sm font-bold text-white block truncate ${isChecked ? 'line-through text-slate-500' : ''}">${cardioKey}</span>
          <p class="text-[11px] text-slate-300 truncate">${rawText}</p>
          <div class="flex items-center space-x-2 text-[11px] pt-0.5">
            <button type="button" onclick="openExerciseGuideModal('${lookupQuery}')" class="text-rose-400 hover:text-rose-300 font-bold underline flex items-center space-x-0.5">
              <i data-lucide="image" class="w-3 h-3 inline"></i>
              <span>Photos & Video</span>
            </button>
          </div>
        </div>
      </div>

      <button type="button" onclick="startCardioTimer(${durationMins})" class="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 shrink-0 transition flex items-center space-x-1">
        <i data-lucide="timer" class="w-3.5 h-3.5"></i>
        <span>${durationMins}m Timer</span>
      </button>
    </div>
  `;
}

function toggleCardioComplete(checked) {
  if (!currentModalDay) return;
  currentModalDay.cardio_completed = checked;
  renderModalCardio(currentModalDay);
}

function startCardioTimer(mins) {
  setTimerSeconds(mins * 60);
  toggleTimer();
  showToast(`Cardio timer started for ${mins} minutes!`, 'info');
}

// 4. Save Modal Data to Backend (MongoDB Atlas)
async function saveWorkoutModalData() {
  if (!currentModalDay) return;
  const dayNumber = currentModalDay.day_number;
  const saveBtn = document.getElementById('modal-save-btn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<span>Saving...</span>`;

  try {
    const isCompleted = document.getElementById('modal-completed-checkbox').checked;
    const weightVal = document.getElementById('input-modal-weight').value;
    const stepsVal = document.getElementById('input-modal-steps').value;
    const durationVal = document.getElementById('input-modal-duration').value;
    const rpeVal = document.getElementById('input-modal-rpe').value;
    const notesVal = document.getElementById('input-modal-notes').value;

    const payload = {
      completed: isCompleted,
      actual_weight_kg: weightVal ? parseFloat(weightVal) : null,
      actual_steps: stepsVal ? parseInt(stepsVal) : null,
      actual_duration_min: durationVal ? parseInt(durationVal) : null,
      rpe_rating: rpeVal ? parseFloat(rpeVal) : null,
      user_notes: notesVal || "",
      parsed_exercises: currentModalDay.parsed_exercises || [],
      warmup_stretches: currentModalDay.warmup_stretches || [],
      cooldown_stretches: currentModalDay.cooldown_stretches || [],
      conditioning_completed: !!(currentModalDay.conditioning_completed),
      cardio_completed: !!(currentModalDay.cardio_completed)
    };

    const res = await fetch(`/api/days/${dayNumber}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Failed to save to backend");
    const data = await res.json();

    const idx = allDays.findIndex(d => d.day_number === dayNumber);
    if (idx !== -1) {
      allDays[idx] = data.day;
    }

    await loadStats();
    renderWorkoutGrid();
    closeWorkoutModal();
    showToast(`Day ${dayNumber} saved to MongoDB Atlas!`, 'success');
  } catch (err) {
    console.error("Save error:", err);
    showToast("Failed to save changes to MongoDB Atlas", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i><span>Save to Atlas</span>`;
    lucide.createIcons();
  }
}

// 5. Weight Tracker Modal & Chart.js
async function openWeightModal() {
  document.getElementById('weight-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  try {
    const res = await fetch('/api/weight-history');
    const data = await res.json();
    renderWeightChart(data);
    renderWeightHistoryList(data.logs || []);
  } catch (err) {
    console.error("Error loading weight history:", err);
  }
}

function closeWeightModal() {
  document.getElementById('weight-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function renderWeightChart(data) {
  const ctx = document.getElementById('weightChart').getContext('2d');
  if (weightChartInstance) {
    weightChartInstance.destroy();
  }

  const daysLabels = [];
  for (let i = 1; i <= 90; i++) daysLabels.push(`D${i}`);

  const idealData = new Array(90).fill(null);
  for (let i = 1; i <= 90; i++) {
    const p = (i - 1) / 89.0;
    idealData[i - 1] = +(data.start_weight - p * (data.start_weight - data.target_weight)).toFixed(2);
  }

  const actualData = new Array(90).fill(null);
  if (data.logs) {
    data.logs.forEach(l => {
      if (l.day_number >= 1 && l.day_number <= 90) {
        actualData[l.day_number - 1] = l.weight_kg;
      }
    });
  }

  weightChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: daysLabels,
      datasets: [
        {
          label: 'Goal (➔ 82 kg)',
          data: idealData,
          borderColor: 'rgba(6, 182, 212, 0.4)',
          borderDash: [4, 4],
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
          tension: 0.1
        },
        {
          label: 'Recorded Weight (kg)',
          data: actualData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointRadius: 3,
          borderWidth: 2.5,
          spanGaps: true,
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 10 } }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b', maxTicksLimit: 9, font: { size: 9 } }
        },
        y: {
          min: 80,
          max: 95,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b', font: { size: 9 } }
        }
      }
    }
  });
}

function renderWeightHistoryList(logs) {
  const container = document.getElementById('weight-history-list');
  if (!logs || logs.length === 0) {
    container.innerHTML = `<p class="text-slate-500 py-1">No weigh-ins logged yet.</p>`;
    return;
  }

  const sorted = [...logs].reverse();
  container.innerHTML = sorted.map(l => `
    <div class="bg-dark-850 p-2 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
      <div class="flex items-center space-x-1.5">
        <span class="font-extrabold text-cyan-400">D${l.day_number}</span>
        <span class="text-slate-400">(${l.date_display || 'Weigh-in'})</span>
        ${l.notes ? `<span class="text-slate-500 italic truncate max-w-[120px]">${l.notes}</span>` : ''}
      </div>
      <span class="font-bold text-emerald-400">${l.weight_kg} kg</span>
    </div>
  `).join('');
}

async function submitQuickWeight() {
  const day = document.getElementById('quick-weight-day').value;
  const weight = document.getElementById('quick-weight-value').value;
  const note = document.getElementById('quick-weight-note').value;

  if (!weight || !day) {
    alert("Please enter day and weight");
    return;
  }

  try {
    const res = await fetch('/api/weight-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_number: parseInt(day),
        weight_kg: parseFloat(weight),
        notes: note
      })
    });
    if (!res.ok) throw new Error("Failed to log weight");
    
    showToast(`Logged ${weight} kg for Day ${day}!`, 'success');
    document.getElementById('quick-weight-value').value = '';
    document.getElementById('quick-weight-note').value = '';
    
    await openWeightModal();
    await loadStats();
    await loadDays();
  } catch (err) {
    console.error("Error logging weight:", err);
    showToast("Failed to record weight in Atlas", "error");
  }
}

// Exercise Form, Photos & Video Demonstration Modal
async function openExerciseGuideModal(exerciseName) {
  try {
    const res = await fetch(`/api/exercises/media?name=${encodeURIComponent(exerciseName)}`);
    const media = await res.json();
    
    document.getElementById('guide-modal-title').innerText = media.display_name || exerciseName;
    document.getElementById('guide-modal-equipment').innerText = media.equipment || 'Gym Equipment';
    
    const muscles = (media.primary_muscles || []).join(', ');
    document.getElementById('guide-modal-muscles').innerText = muscles || 'Target Muscles';

    // Photos Grid (Start vs Peak Contraction)
    const photosContainer = document.getElementById('guide-modal-photos-grid');
    if (media.images && media.images.length > 0) {
      photosContainer.innerHTML = media.images.map((imgUrl, i) => `
        <div class="rounded-xl overflow-hidden bg-dark-900 border border-slate-700 relative group">
          <img src="${imgUrl}" alt="${media.display_name} Position ${i+1}" class="w-full h-40 sm:h-52 object-cover object-center">
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

    // Video Link
    const videoBtn = document.getElementById('guide-modal-video-link');
    const query = encodeURIComponent(media.video_query || `how to do ${exerciseName} exercise proper form`);
    videoBtn.href = `https://www.youtube.com/results?search_query=${query}`;

    // Target Muscles Badges
    const musclesContainer = document.getElementById('guide-modal-muscles-tags');
    const allMuscles = [...(media.primary_muscles || []), ...(media.secondary_muscles || [])];
    musclesContainer.innerHTML = allMuscles.map(m => `
      <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
        ${m}
      </span>
    `).join('');

    // Step-by-Step Form Cues
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
    lucide.createIcons();
  } catch (err) {
    console.error("Error opening exercise guide:", err);
    showToast("Could not load exercise demonstration", "error");
  }
}

function closeExerciseGuideModal() {
  document.getElementById('exercise-guide-modal').classList.add('hidden');
}

// 6. Coaching Rules Modal
async function loadCoachingNotes() {
  try {
    const res = await fetch('/api/coaching-notes');
    const data = await res.json();
    coachingNotes = data.notes || [];
  } catch (err) {
    console.error("Error loading coaching notes:", err);
  }
}

function openCoachingModal() {
  const container = document.getElementById('coaching-notes-container');
  container.innerHTML = coachingNotes.map(n => `
    <div class="bg-dark-900 border border-slate-800 p-3 rounded-xl flex items-start space-x-2.5">
      <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-extrabold flex items-center justify-center shrink-0 text-[11px]">
        ${n.rule_number}
      </span>
      <p class="text-slate-200 leading-relaxed text-xs sm:text-sm">
        ${n.text}
      </p>
    </div>
  `).join('');

  document.getElementById('rules-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeCoachingModal() {
  document.getElementById('rules-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// 7. Rest Timer Logic
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerDisplays() {
  const formatted = formatTime(timerSeconds);
  const mEl = document.getElementById('modal-timer-digits');
  const fEl = document.getElementById('floating-timer-display');
  if (mEl) mEl.innerText = formatted;
  if (fEl) fEl.innerText = formatted;
}

function setTimerSeconds(sec) {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerSeconds = sec;
  timerInitial = sec;
  updateTimerDisplays();
  updateTimerButtons(false);
}

function toggleTimer() {
  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    updateTimerButtons(false);
  } else {
    isTimerRunning = true;
    updateTimerButtons(true);
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        updateTimerDisplays();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        updateTimerButtons(false);
        playTimerAlert();
        showToast("Rest interval complete! Time for your next set ⚡", 'info');
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerSeconds = timerInitial;
  updateTimerDisplays();
  updateTimerButtons(false);
}

function updateTimerButtons(running) {
  const mBtn = document.getElementById('modal-timer-start-btn');
  const fBtn = document.getElementById('floating-timer-btn');
  const text = running ? 'Pause' : 'Start';
  const bgClass = running ? 'bg-amber-500' : 'bg-emerald-500';
  
  if (mBtn) {
    mBtn.innerText = text;
    mBtn.className = `px-3 py-1 text-xs rounded-lg font-bold ${bgClass} text-dark-900 transition`;
  }
  if (fBtn) {
    fBtn.innerText = text;
    fBtn.className = `flex-1 py-1.5 rounded-xl text-xs font-bold ${bgClass} text-dark-900 transition`;
  }
}

function toggleFloatingTimer() {
  const fTimer = document.getElementById('floating-timer');
  fTimer.classList.toggle('hidden');
  lucide.createIcons();
}

// 8. Navigation & Jump to Today
function jumpToToday() {
  const pending = allDays.find(d => !d.completed);
  const targetDay = pending ? pending.day_number : 1;
  
  const el = document.getElementById(`day-card-${targetDay}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-cyan-400');
    setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-400'), 2500);
    showToast(`Navigated to Day ${targetDay}`, 'info');
  } else {
    resetFilters();
    setTimeout(() => jumpToToday(), 200);
  }
}

function navToSchedule() {
  window.scrollTo({ top: 350, behavior: 'smooth' });
}

function clearSearch() {
  searchQuery = '';
  document.getElementById('search-input').value = '';
  document.getElementById('search-clear-btn').classList.add('hidden');
  renderWorkoutGrid();
}

function resetFilters() {
  searchQuery = '';
  currentWeek = '';
  currentFilter = 'all';

  document.getElementById('search-input').value = '';
  document.getElementById('search-clear-btn').classList.add('hidden');

  document.querySelectorAll('.week-pill').forEach(btn => {
    const isAll = btn.dataset.week === '';
    btn.classList.toggle('active', isAll);
    btn.classList.toggle('bg-cyan-500', isAll);
    btn.classList.toggle('text-dark-900', isAll);
    btn.classList.toggle('border-cyan-400', isAll);
    if (!isAll) {
      btn.className = `week-pill px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 bg-dark-800 text-slate-300 border border-slate-700/80 hover:bg-slate-700`;
    }
  });

  document.querySelectorAll('.filter-pill').forEach(btn => {
    const isAll = btn.dataset.filter === 'all';
    btn.classList.toggle('active', isAll);
    btn.classList.toggle('bg-cyan-500/20', isAll);
    btn.classList.toggle('text-cyan-300', isAll);
    btn.classList.toggle('border-cyan-500/40', isAll);
  });

  renderWorkoutGrid();
}

// Setup Event Listeners
function setupEventListeners() {
  // Search
  const sInput = document.getElementById('search-input');
  const sClear = document.getElementById('search-clear-btn');
  sInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    if (searchQuery) sClear.classList.remove('hidden');
    else sClear.classList.add('hidden');
    renderWorkoutGrid();
  });

  // Week Pills
  document.querySelectorAll('.week-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.week-pill').forEach(b => {
        b.classList.remove('active', 'bg-cyan-500', 'text-dark-900', 'border-cyan-400');
        b.classList.add('bg-dark-800', 'text-slate-300', 'border-slate-700/80');
      });
      btn.classList.add('active', 'bg-cyan-500', 'text-dark-900', 'border-cyan-400');
      btn.classList.remove('bg-dark-800', 'text-slate-300', 'border-slate-700/80');
      currentWeek = btn.dataset.week;
      renderWorkoutGrid();
    });
  });

  // Filter Pills
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b => {
        b.classList.remove('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
        b.classList.add('bg-dark-800', 'text-slate-400', 'border-slate-700');
      });
      btn.classList.add('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
      btn.classList.remove('bg-dark-800', 'text-slate-400', 'border-slate-700');
      currentFilter = btn.dataset.filter;
      renderWorkoutGrid();
    });
  });

  // Header Buttons
  const btnJump = document.getElementById('btn-jump-today');
  if (btnJump) btnJump.addEventListener('click', jumpToToday);

  const btnWeight = document.getElementById('btn-open-weight');
  if (btnWeight) btnWeight.addEventListener('click', openWeightModal);

  const btnTimer = document.getElementById('btn-toggle-timer');
  if (btnTimer) btnTimer.addEventListener('click', toggleFloatingTimer);

  const btnRules = document.getElementById('btn-open-rules');
  if (btnRules) btnRules.addEventListener('click', openCoachingModal);

  const btnExport = document.getElementById('btn-export-json');
  if (btnExport) btnExport.addEventListener('click', () => {
    window.location.href = '/api/export';
  });

  // RPE Slider
  document.getElementById('input-modal-rpe').addEventListener('input', (e) => {
    updateRpeLabel(e.target.value);
  });
}
