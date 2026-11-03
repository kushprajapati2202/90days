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

// Validated MET Reference Constants (Compendium of Physical Activities / ACSM)
const MET_COMPOUND_HEAVY = 6.0;      // Squat, Deadlift, Bench Press, Barbell Row, Overhead Press
const MET_COMPOUND_MODERATE = 5.0;   // Lat pulldowns, Cable rows, Dumbbell presses, Leg press
const MET_ISOLATION = 3.8;           // Bicep curls, Lateral raises, Tricep pushdowns, Leg curls
const MET_BODYWEIGHT_HIIT = 7.5;     // Burpees, Mountain climbers, Jump jacks, High knees
const MET_CORE_HOLDS = 4.0;          // Planks, Deadbugs, Bird dogs
const MET_CARDIO_INCLINE_WALK = 5.3; // Treadmill incline brisk walk (4.5–5.5 km/h @ 3-5%)
const MET_CARDIO_ELLIPTICAL = 6.8;   // Cross trainer / elliptical
const MET_CARDIO_BIKE = 6.5;         // Stationary cycle
const MET_CARDIO_SKIP = 9.0;         // Fast skipping
const MET_WARMUP_DYNAMIC = 3.2;      // Dynamic mobility & activation
const MET_COOLDOWN_STATIC = 2.5;     // Static cool-down stretching
const MET_RECOVERY_WALK = 3.5;       // Relaxed recovery walk

function getUserWeightKg() {
  if (currentModalDay && currentModalDay.actual_weight_kg) {
    return parseFloat(currentModalDay.actual_weight_kg);
  }
  if (allDays && allDays.length > 0) {
    for (let i = allDays.length - 1; i >= 0; i--) {
      if (allDays[i].actual_weight_kg) return parseFloat(allDays[i].actual_weight_kg);
    }
  }
  return 92.5; // Athlete starting weight
}

function getExerciseMet(name) {
  if (!name) return MET_ISOLATION;
  const lower = name.toLowerCase();

  if (lower.includes('burpee') || lower.includes('jumping jack') || lower.includes('mountain climber') || lower.includes('high knee') || lower.includes('skipping')) {
    return MET_BODYWEIGHT_HIIT;
  }
  if (lower.includes('plank') || lower.includes('deadbug') || lower.includes('bird dog') || lower.includes('bird-dog') || lower.includes('hollow')) {
    return MET_CORE_HOLDS;
  }
  const heavy = [
    'squat', 'deadlift', 'bench press', 'incline bench', 'barbell row', 
    'overhead press', 'military press', 'shoulder press', 'pull-up', 
    'pull up', 'chin-up', 'chin up', 'dip', 'leg press', 'hack squat', 
    'romanian deadlift', 'rdl', 'hip thrust', 'clean'
  ];
  if (heavy.some(k => lower.includes(k))) return MET_COMPOUND_HEAVY;

  const mod = [
    'lat pulldown', 'pulldown', 'cable row', 't-bar', 'chest press', 
    'dumbbell press', 'incline dumbbell', 'lunge', 'split squat', 
    'push-up', 'push up', 'pec deck', 'cable crossover'
  ];
  if (mod.some(k => lower.includes(k))) return MET_COMPOUND_MODERATE;

  return MET_ISOLATION;
}

function calculateSetCalories(name, weightKg = getUserWeightKg()) {
  const met = getExerciseMet(name);
  const ratePerMin = (met * 3.5 * weightKg) / 200.0;
  const effectiveMins = met >= 5.0 ? 1.0 : 0.8;
  return Math.round(ratePerMin * effectiveMins * 10) / 10;
}

function calculateDayCaloriesClient(day, weightKg = getUserWeightKg()) {
  if (!day) return { total_estimated_kcal: 0, total_completed_kcal: 0 };

  // 1. Warm-up
  const warmups = day.warmup_stretches || [];
  const warmupCount = warmups.length || 5;
  const warmupPer = (MET_WARMUP_DYNAMIC * 3.5 * weightKg / 200.0) * 1.0;
  const warmupTotal = Math.round(warmupPer * warmupCount);
  const warmupDoneCount = warmups.filter(s => s.completed).length;
  const warmupDone = Math.round(warmupPer * warmupDoneCount);

  // 2. Strength Lifts
  const exercises = day.parsed_exercises || [];
  let strengthTotal = 0;
  let strengthDone = 0;
  exercises.forEach(ex => {
    const sets = ex.logged_sets || [];
    let planned = sets.length;
    if (!planned) {
      const m = (ex.target || '').match(/^(\d+)/);
      planned = m ? parseInt(m[1]) : 3;
    }
    const setBurn = calculateSetCalories(ex.name, weightKg);
    strengthTotal += Math.round(setBurn * planned);
    const doneSets = sets.filter(s => s.completed).length;
    strengthDone += Math.round(setBurn * doneSets);
  });

  // 3. Conditioning
  const condText = (day.bodyweight_conditioning || '').toLowerCase();
  let condTotal = 0;
  let condDone = 0;
  if (condText && !condText.includes('optional') && !condText.includes('no conditioning')) {
    const items = condText.split(';').map(p => p.trim()).filter(Boolean);
    const duration = Math.max(5, Math.min(15, items.length * 2)) || 7;
    const rate = (MET_BODYWEIGHT_HIIT * 3.5 * weightKg) / 200.0;
    condTotal = Math.round(rate * duration);
    condDone = day.conditioning_completed ? condTotal : 0;
  }

  // 4. Cardio
  const cardioText = (day.cardio || '').toLowerCase();
  let cardioTotal = 0;
  let cardioDone = 0;
  if (cardioText && !cardioText.includes('none') && !cardioText.includes('optional')) {
    let met = MET_CARDIO_INCLINE_WALK;
    if (cardioText.includes('cross trainer') || cardioText.includes('elliptical')) met = MET_CARDIO_ELLIPTICAL;
    else if (cardioText.includes('cycle') || cardioText.includes('bike')) met = MET_CARDIO_BIKE;
    else if (cardioText.includes('skip') || cardioText.includes('jump rope')) met = MET_CARDIO_SKIP;

    let duration = 20;
    const mRange = cardioText.match(/(\d+)\s*[-–]\s*(\d+)\s*min/);
    if (mRange) duration = parseInt(mRange[1]);
    else {
      const mSingle = cardioText.match(/(\d+)\s*min/);
      if (mSingle) duration = parseInt(mSingle[1]);
    }
    const rate = (met * 3.5 * weightKg) / 200.0;
    cardioTotal = Math.round(rate * duration);
    cardioDone = day.cardio_completed ? cardioTotal : 0;
  }

  // 5. Cool-down
  const cooldowns = day.cooldown_stretches || [];
  const cooldownCount = cooldowns.length || 5;
  const cooldownPer = (MET_COOLDOWN_STATIC * 3.5 * weightKg / 200.0) * 0.8;
  const cooldownTotal = Math.round(cooldownPer * cooldownCount);
  const cooldownDoneCount = cooldowns.filter(s => s.completed).length;
  const cooldownDone = Math.round(cooldownPer * cooldownDoneCount);

  let totalEst = warmupTotal + strengthTotal + condTotal + cardioTotal + cooldownTotal;
  let totalDone = warmupDone + strengthDone + condDone + cardioDone + cooldownDone;

  if (totalEst === 0 && (day.day_type || '').toLowerCase().includes('recovery')) {
    totalEst = Math.round((MET_RECOVERY_WALK * 3.5 * weightKg / 200.0) * 30);
    totalDone = day.completed ? totalEst : 0;
  }

  return {
    total_estimated_kcal: totalEst,
    total_completed_kcal: totalDone
  };
}

// Calculate granular day progress percentage and breakdown
function getDayCompletionStats(day) {
  if (!day) return { percentage: 0, completedItems: 0, totalItems: 0, isCompleted: false };

  const isCompleted = !!day.completed;

  // 1. Warmup Stretches
  const warmups = day.warmup_stretches || [];
  const warmupTotal = warmups.length;
  const warmupDone = warmups.filter(s => s.completed).length;

  // 2. Strength Sets
  const exercises = day.parsed_exercises || [];
  let setsTotal = 0;
  let setsDone = 0;
  exercises.forEach(ex => {
    const sets = ex.logged_sets || [];
    if (sets.length > 0) {
      setsTotal += sets.length;
      setsDone += sets.filter(s => s.completed).length;
    } else {
      let planned = 3;
      if (ex.target) {
        const m = ex.target.match(/^(\d+)/);
        if (m) planned = parseInt(m[1]);
      }
      setsTotal += planned;
    }
  });

  // 3. Conditioning
  const condText = (day.bodyweight_conditioning || '').toLowerCase();
  const hasCond = condText && !condText.includes('optional') && !condText.includes('no conditioning');
  let condTotal = hasCond ? 1 : 0;
  let condDone = 0;
  if (hasCond) {
    if (day._conditioning_items && day._conditioning_items.length > 0) {
      condTotal = day._conditioning_items.length;
      condDone = day._conditioning_items.filter(i => i.completed).length;
    } else {
      condDone = day.conditioning_completed ? 1 : 0;
    }
  }

  // 4. Cardio
  const cardioText = (day.cardio || '').toLowerCase();
  const hasCardio = cardioText && !cardioText.includes('none') && !cardioText.includes('optional');
  const cardioTotal = hasCardio ? 1 : 0;
  const cardioDone = (hasCardio && day.cardio_completed) ? 1 : 0;

  // 5. Cooldown Stretches
  const cooldowns = day.cooldown_stretches || [];
  const cooldownTotal = cooldowns.length;
  const cooldownDone = cooldowns.filter(s => s.completed).length;

  const totalItems = warmupTotal + setsTotal + condTotal + cardioTotal + cooldownTotal;
  const completedItems = warmupDone + setsDone + condDone + cardioDone + cooldownDone;

  let percentage = 0;
  if (totalItems === 0) {
    percentage = isCompleted ? 100 : 0;
  } else {
    percentage = Math.round((completedItems / totalItems) * 100);
    // If any item is marked not done, ensure it reduces from 100% and cannot be 100%
    if (completedItems < totalItems && percentage >= 100) {
      percentage = 99;
    }
  }

  return {
    percentage,
    completedItems,
    totalItems,
    isCompleted,
    breakdown: {
      warmup: { done: warmupDone, total: warmupTotal },
      sets: { done: setsDone, total: setsTotal },
      conditioning: { done: condDone, total: condTotal },
      cardio: { done: cardioDone, total: cardioTotal },
      cooldown: { done: cooldownDone, total: cooldownTotal }
    }
  };
}

function updateWeekPillsProgress(s) {
  const allPill = document.querySelector('.week-pill[data-week=""]');
  if (allPill && s) {
    allPill.innerText = `All (90 Days • ${s.completion_percentage}%)`;
  }

  if (s && s.weeks) {
    for (let w = 1; w <= 13; w++) {
      const pill = document.querySelector(`.week-pill[data-week="${w}"]`);
      const wData = s.weeks[String(w)];
      if (pill && wData) {
        let label = `W${w}`;
        if (w === 4 || w === 8 || w === 12) {
          label += ` ⚡ DELOAD`;
        } else if (w === 5) {
          label += ` (Progress)`;
        } else if (w === 10) {
          label += ` (Consolidate)`;
        } else if (w === 13) {
          label += ` (Peak)`;
        }
        if (wData.pct > 0) {
          label += ` • ${wData.pct}%`;
        }
        pill.innerText = label;
      }
    }
  }

  // Update filter pill counts
  const compFilter = document.querySelector('.filter-pill[data-filter="completed"]');
  if (compFilter && s) compFilter.innerText = `Completed (${s.completed_days})`;
  const pendFilter = document.querySelector('.filter-pill[data-filter="pending"]');
  if (pendFilter && s) pendFilter.innerText = `Pending (${s.remaining_days})`;
}

function renderStats(s) {
  if (!s) return;
  document.getElementById('hero-days-completed').innerText = s.completed_days;
  document.getElementById('hero-streak-count').innerText = s.current_streak;
  
  if (s.weight_stats) {
    document.getElementById('hero-current-weight').innerText = s.weight_stats.current_weight_kg;
  }
  if (s.total_calories_burned !== undefined) {
    const heroCalEl = document.getElementById('hero-total-calories');
    if (heroCalEl) heroCalEl.innerText = Number(s.total_calories_burned).toLocaleString();
  }
  
  document.getElementById('overall-progress-pct').innerText = `${s.completion_percentage}%`;
  document.getElementById('overall-progress-bar').style.width = `${s.completion_percentage}%`;
  
  if (s.phases && s.phases.phase1) {
    document.getElementById('p1-count').innerText = `${s.phases.phase1.completed}/${s.phases.phase1.total} Done (${s.phases.phase1.pct}%)`;
    const p1Bar = document.getElementById('p1-bar');
    if (p1Bar) p1Bar.style.width = `${s.phases.phase1.pct}%`;
  }
  if (s.phases && s.phases.phase2) {
    document.getElementById('p2-count').innerText = `${s.phases.phase2.completed}/${s.phases.phase2.total} Done (${s.phases.phase2.pct}%)`;
    const p2Bar = document.getElementById('p2-bar');
    if (p2Bar) p2Bar.style.width = `${s.phases.phase2.pct}%`;
  }
  if (s.phases && s.phases.phase3) {
    document.getElementById('p3-count').innerText = `${s.phases.phase3.completed}/${s.phases.phase3.total} Done (${s.phases.phase3.pct}%)`;
    const p3Bar = document.getElementById('p3-bar');
    if (p3Bar) p3Bar.style.width = `${s.phases.phase3.pct}%`;
  }

  updateWeekPillsProgress(s);
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

// Helper: Build single day card HTML
function buildDayCardHTML(day) {
  const isCompleted = !!day.completed;
  const isRecovery = day.day_type.toLowerCase().includes('recovery');
  const isDeload = day.is_deload;

  const stats = getDayCompletionStats(day);
  const pct = stats.percentage;
  const dayCal = calculateDayCaloriesClient(day);

  let badgeClass = 'badge-push';
  if (day.day_type.toLowerCase().includes('pull')) badgeClass = 'badge-pull';
  else if (day.day_type.toLowerCase().includes('legs')) badgeClass = 'badge-legs';
  else if (isRecovery) badgeClass = 'badge-recovery';

  let cardBorder = 'border-slate-800 bg-dark-850';
  if (pct === 100) {
    cardBorder = 'border-emerald-500/40 bg-emerald-950/15 shadow-[0_0_15px_-4px_rgba(16,185,129,0.2)]';
  } else if (pct > 0) {
    cardBorder = 'border-cyan-500/40 bg-cyan-950/15 shadow-[0_0_15px_-4px_rgba(6,182,212,0.2)]';
  } else if (isDeload) {
    cardBorder = 'border-amber-500/35 bg-amber-950/10';
  }

  const warmupCount = (day.warmup_stretches || []).length || 5;
  const cooldownCount = (day.cooldown_stretches || []).length || 5;

  let pctBadgeClass = 'bg-dark-900 text-slate-500 border border-slate-700/80';
  if (pct === 100) {
    pctBadgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black';
  } else if (pct > 0) {
    pctBadgeClass = 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-black';
  }

  return `
    <div id="day-card-${day.day_number}" class="glass-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between border ${cardBorder} relative active:border-cyan-500/50 transition-all duration-200" onclick="handleCardClick(${day.day_number}, event)">
      
      <div>
        <!-- Top Row: Day #, Date, Phase, Deload Tag, Progress %, Checkbox -->
        <div class="flex items-center justify-between gap-1.5 mb-2">
          <div class="flex items-center space-x-1.5">
            <span class="px-2 py-0.5 rounded-md text-[11px] font-black font-heading tracking-wide ${isCompleted ? 'bg-emerald-500 text-dark-900' : 'bg-dark-900 text-cyan-400 border border-slate-700'}">
              DAY ${day.day_number}
            </span>
            <span class="text-xs font-semibold text-slate-200">${day.date_display}</span>
            <span class="text-[10px] text-slate-500 font-medium">W${day.week_number}</span>
          </div>

          <!-- Deload & Completion Badge & Checkbox -->
          <div class="flex items-center space-x-2" onclick="event.stopPropagation()">
            ${isDeload ? `<span class="badge-deload px-1.5 py-0.2 rounded text-[9px] font-black">DELOAD</span>` : ''}
            
            <span class="px-2 py-0.5 rounded-md text-[11px] font-mono ${pctBadgeClass}" title="Day completion progress">
              ${pct}%
            </span>

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

        <!-- Day Completion Progress Bar -->
        <div class="mb-2.5 bg-dark-900/60 p-2 rounded-xl border border-slate-800/80">
          <div class="flex items-center justify-between text-[11px] mb-1 font-semibold">
            <span class="text-slate-400 flex items-center space-x-1">
              <i data-lucide="${pct === 100 ? 'check-circle-2' : (pct > 0 ? 'clock' : 'circle')}" class="w-3 h-3 ${pct === 100 ? 'text-emerald-400' : (pct > 0 ? 'text-cyan-400' : 'text-slate-500')}"></i>
              <span class="${pct === 100 ? 'text-emerald-300 font-bold' : (pct > 0 ? 'text-cyan-300 font-semibold' : 'text-slate-400')}">
                ${pct === 100 ? 'Completed (100%)' : (isCompleted ? `Logged (${pct}%)` : (pct > 0 ? 'In Progress' : 'Pending'))}
              </span>
            </span>
            <span class="font-black font-mono text-xs ${pct === 100 ? 'text-emerald-400' : (pct > 0 ? 'text-cyan-400' : 'text-slate-500')}">
              ${pct}%
            </span>
          </div>
          <div class="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/50">
            <div class="h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : (pct > 0 ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-transparent')}" style="width: ${pct}%"></div>
          </div>
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

        <!-- Quick Meta Chips: Time, Steps, Effort, Validated Calories -->
        <div class="grid grid-cols-4 gap-1 text-[10px] text-slate-400 mb-2.5">
          <div class="bg-dark-900/60 px-1.5 py-1 rounded border border-slate-800 text-center truncate" title="Duration">
            ⏱️ ${day.target_duration.replace(' min', 'm')}
          </div>
          <div class="bg-dark-900/60 px-1.5 py-1 rounded border border-slate-800 text-center truncate" title="Daily Steps">
            👟 ${day.daily_steps_target}
          </div>
          <div class="bg-dark-900/60 px-1.5 py-1 rounded border border-slate-800 text-center truncate" title="Effort">
            ⚡ ${day.effort_target.replace('RPE ', '')}
          </div>
          <div class="bg-dark-900/60 px-1.5 py-1 rounded border border-slate-800 text-center truncate text-amber-400 font-bold" title="Scientifically estimated calorie burn">
            🔥 ${dayCal.total_estimated_kcal}k
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <div class="text-[11px]">
          ${day.actual_weight_kg 
            ? `<span class="text-emerald-400 font-bold">⚖️ ${day.actual_weight_kg} kg • ${pct}% • 🔥 ${dayCal.total_completed_kcal} kcal</span>` 
            : (pct === 100 
                ? `<span class="text-emerald-400 font-semibold flex items-center space-x-1"><i data-lucide="check" class="w-3.5 h-3.5 inline"></i><span>100% Done • 🔥 ${dayCal.total_completed_kcal} kcal</span></span>` 
                : (pct > 0 ? `<span class="text-cyan-400 font-semibold">${pct}% Done • 🔥 ${dayCal.total_completed_kcal} kcal</span>` : `<span class="text-slate-500">🔥 ~${dayCal.total_estimated_kcal} kcal plan</span>`)
              )
          }
        </div>
        <button type="button" class="px-2.5 py-1 rounded-lg text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-dark-900 hover:bg-slate-800 border border-slate-700 flex items-center space-x-1">
          <span>View Full Plan</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>

    </div>
  `;
}

// Update single card in DOM dynamically without touching other cards
function renderSingleCard(dayNumber) {
  const cardEl = document.getElementById(`day-card-${dayNumber}`);
  const day = allDays.find(d => d.day_number === dayNumber);
  if (!cardEl || !day) return;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = buildDayCardHTML(day);
  const newCardEl = tempDiv.firstElementChild;
  if (newCardEl) {
    cardEl.replaceWith(newCardEl);
    lucide.createIcons();
  }
}

// Recalculate stats dynamically on the fly without network request
function recalculateStatsOnTheFly() {
  if (!allDays || allDays.length === 0) return;

  const totalDays = allDays.length;
  const completedDays = allDays.filter(d => d.completed).length;
  const remainingDays = totalDays - completedDays;
  const overallPct = Math.round((completedDays / totalDays) * 100 * 10) / 10;

  // Streak calculation (backwards from latest completed day)
  let currentStreak = 0;
  for (let i = allDays.length - 1; i >= 0; i--) {
    if (allDays[i].completed) {
      currentStreak++;
    } else if (currentStreak > 0) {
      break;
    }
  }

  // Weight tracking: latest logged weight
  let currentWeight = null;
  for (let i = allDays.length - 1; i >= 0; i--) {
    if (allDays[i].actual_weight_kg) {
      currentWeight = allDays[i].actual_weight_kg;
      break;
    }
  }

  // Phase breakdowns
  const p1Days = allDays.filter(d => (d.phase || '').toLowerCase().includes('phase 1'));
  const p1Total = p1Days.length || 28;
  const p1Done = p1Days.filter(d => d.completed).length;
  const p1Pct = p1Total ? Math.round((p1Done / p1Total) * 100 * 10) / 10 : 0;

  const p2Days = allDays.filter(d => (d.phase || '').toLowerCase().includes('phase 2'));
  const p2Total = p2Days.length || 35;
  const p2Done = p2Days.filter(d => d.completed).length;
  const p2Pct = p2Total ? Math.round((p2Done / p2Total) * 100 * 10) / 10 : 0;

  const p3Days = allDays.filter(d => (d.phase || '').toLowerCase().includes('phase 3'));
  const p3Total = p3Days.length || 27;
  const p3Done = p3Days.filter(d => d.completed).length;
  const p3Pct = p3Total ? Math.round((p3Done / p3Total) * 100 * 10) / 10 : 0;

  // Weeks breakdown
  const weeks = {};
  for (let w = 1; w <= 13; w++) {
    const wDays = allDays.filter(d => d.week_number === w);
    const wTotal = wDays.length;
    const wDone = wDays.filter(d => d.completed).length;
    const wPct = wTotal ? Math.round((wDone / wTotal) * 100 * 10) / 10 : 0;
    weeks[String(w)] = { week_number: w, total: wTotal, completed: wDone, pct: wPct };
  }

  let totalCaloriesBurned = 0;
  allDays.forEach(d => {
    if (d.completed) {
      const c = calculateDayCaloriesClient(d);
      totalCaloriesBurned += c.total_completed_kcal;
    }
  });

  const simulatedStats = {
    total_days: totalDays,
    completed_days: completedDays,
    total_calories_burned: totalCaloriesBurned,
    remaining_days: remainingDays,
    completion_percentage: overallPct,
    current_streak: currentStreak,
    phases: {
      phase1: { total: p1Total, completed: p1Done, pct: p1Pct },
      phase2: { total: p2Total, completed: p2Done, pct: p2Pct },
      phase3: { total: p3Total, completed: p3Done, pct: p3Pct }
    },
    weeks: weeks,
    weight_stats: currentWeight ? { current_weight_kg: currentWeight } : (statsData ? statsData.weight_stats : null)
  };

  renderStats(simulatedStats);

  const countEl = document.getElementById('filtered-count');
  if (countEl) {
    const currentRenderedCards = document.querySelectorAll('#workout-grid > div[id^="day-card-"]').length;
    countEl.innerText = `Showing ${currentRenderedCards} of ${allDays.length} days • ${completedDays} completed (${overallPct}%)`;
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

  const completedCount = allDays.filter(d => d.completed).length;
  const overallPct = allDays.length > 0 ? ((completedCount / allDays.length) * 100).toFixed(1) : 0;
  document.getElementById('filtered-count').innerText = `Showing ${filtered.length} of ${allDays.length} days • ${completedCount} completed (${overallPct}%)`;

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

  grid.innerHTML = filtered.map(day => buildDayCardHTML(day)).join('');
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
      if (data.completion_percentage !== undefined) {
        d.completion_percentage = data.completion_percentage;
      }
      if (data.day) {
        d.warmup_stretches = data.day.warmup_stretches;
        d.parsed_exercises = data.day.parsed_exercises;
        d.cooldown_stretches = data.day.cooldown_stretches;
        d.conditioning_completed = data.day.conditioning_completed;
        d.cardio_completed = data.day.cardio_completed;
      }
    }
    
    renderSingleCard(dayNumber);
    recalculateStatsOnTheFly();
    
    if (data.completed) {
      showToast(`Day ${dayNumber} 100% completed! Keep going Kush 🔥`, 'success');
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

  const initialStats = getDayCompletionStats(currentModalDay);
  if (initialStats.percentage === 100) {
    currentModalDay.completed = true;
    document.getElementById('modal-completed-checkbox').checked = true;
  } else {
    document.getElementById('modal-completed-checkbox').checked = !!day.completed;
  }

  // Initialize auto-save indicator
  const indicator = document.getElementById('modal-autosave-indicator');
  if (indicator) {
    indicator.innerHTML = `<span class="text-emerald-400 flex items-center space-x-1"><i data-lucide="cloud-check" class="w-3.5 h-3.5 text-emerald-400"></i><span>Auto-saved</span></span>`;
  }

  // Update live session progress
  updateModalProgress();

  // Show Modal
  document.getElementById('workout-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

let modalAutoSaveTimer = null;
let isModalSaving = false;
let hasPendingModalSave = false;

function triggerModalAutoSave(immediate = false) {
  if (!currentModalDay) return;

  // 1. Calculate granular completion percentage from exercises/stretches
  const stats = getDayCompletionStats(currentModalDay);
  const wasCompleted = !!currentModalDay.completed;
  const chk = document.getElementById('modal-completed-checkbox');

  // AUTO-COMPLETION RULE:
  // If exercises reach 100%, automatically consider the day as completed!
  // If exercises are below 100% and there are items, mark as incomplete.
  if (stats.percentage === 100) {
    currentModalDay.completed = true;
    if (chk) chk.checked = true;
    if (!wasCompleted) {
      showToast(`🎉 100% Completed! Day ${currentModalDay.day_number} marked as Completed!`, 'success');
    }
  } else if (stats.totalItems > 0) {
    currentModalDay.completed = false;
    if (chk) chk.checked = false;
  } else if (chk) {
    // Pure rest day with 0 items: defer to checkbox
    currentModalDay.completed = chk.checked;
  }

  // 2. Synchronize form inputs into currentModalDay
  const wInput = document.getElementById('input-modal-weight');
  if (wInput) currentModalDay.actual_weight_kg = wInput.value ? parseFloat(wInput.value) : null;

  const sInput = document.getElementById('input-modal-steps');
  if (sInput) currentModalDay.actual_steps = sInput.value ? parseInt(sInput.value) : null;

  const dInput = document.getElementById('input-modal-duration');
  if (dInput) currentModalDay.actual_duration_min = dInput.value ? parseInt(dInput.value) : null;

  const rInput = document.getElementById('input-modal-rpe');
  if (rInput) currentModalDay.rpe_rating = rInput.value ? parseFloat(rInput.value) : null;

  const nInput = document.getElementById('input-modal-notes');
  if (nInput) currentModalDay.user_notes = nInput.value || '';

  // 3. Synchronize to allDays in memory
  const day = allDays.find(d => d.day_number === currentModalDay.day_number);
  if (day) {
    day.completed = currentModalDay.completed;
    day.actual_weight_kg = currentModalDay.actual_weight_kg;
    day.actual_steps = currentModalDay.actual_steps;
    day.actual_duration_min = currentModalDay.actual_duration_min;
    day.rpe_rating = currentModalDay.rpe_rating;
    day.user_notes = currentModalDay.user_notes;
    day.parsed_exercises = currentModalDay.parsed_exercises;
    day.warmup_stretches = currentModalDay.warmup_stretches;
    day.cooldown_stretches = currentModalDay.cooldown_stretches;
    day.conditioning_completed = currentModalDay.conditioning_completed;
    day.cardio_completed = currentModalDay.cardio_completed;
    day._conditioning_items = currentModalDay._conditioning_items;
    day.completion_percentage = stats.percentage;
  }

  // 4. Update UI on the fly
  updateModalProgress();
  renderSingleCard(currentModalDay.day_number);
  recalculateStatsOnTheFly();

  // 5. Update status indicator
  const indicator = document.getElementById('modal-autosave-indicator');
  if (indicator) {
    indicator.innerHTML = `<span class="text-amber-400 flex items-center space-x-1"><svg class="animate-spin w-3 h-3 text-amber-400 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg><span>Saving...</span></span>`;
  }

  // 6. Debounce or execute save
  if (modalAutoSaveTimer) {
    clearTimeout(modalAutoSaveTimer);
    modalAutoSaveTimer = null;
  }

  if (immediate) {
    performModalSave();
  } else {
    modalAutoSaveTimer = setTimeout(() => {
      performModalSave();
    }, 400);
  }
}

async function performModalSave() {
  if (!currentModalDay) return;
  if (modalAutoSaveTimer) {
    clearTimeout(modalAutoSaveTimer);
    modalAutoSaveTimer = null;
  }

  if (isModalSaving) {
    hasPendingModalSave = true;
    return;
  }

  isModalSaving = true;
  const dayNumber = currentModalDay.day_number;
  const indicator = document.getElementById('modal-autosave-indicator');

  try {
    const isCompleted = !!currentModalDay.completed;
    const weightVal = document.getElementById('input-modal-weight')?.value;
    const stepsVal = document.getElementById('input-modal-steps')?.value;
    const durationVal = document.getElementById('input-modal-duration')?.value;
    const rpeVal = document.getElementById('input-modal-rpe')?.value;
    const notesVal = document.getElementById('input-modal-notes')?.value;

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
    if (idx !== -1 && data.day) {
      allDays[idx] = data.day;
      if (currentModalDay && currentModalDay.day_number === dayNumber) {
        currentModalDay.completed = data.day.completed;
      }
    }
    renderSingleCard(dayNumber);
    recalculateStatsOnTheFly();

    if (indicator) {
      indicator.innerHTML = `<span class="text-emerald-400 flex items-center space-x-1"><i data-lucide="cloud-check" class="w-3.5 h-3.5 text-emerald-400"></i><span>Auto-saved</span></span>`;
      lucide.createIcons();
    }
  } catch (err) {
    console.error("Auto-save error:", err);
    if (indicator) {
      indicator.innerHTML = `<span class="text-rose-400 text-[11px]">Save error</span>`;
    }
  } finally {
    isModalSaving = false;
    if (hasPendingModalSave) {
      hasPendingModalSave = false;
      performModalSave();
    }
  }
}

function closeWorkoutModal() {
  if (modalAutoSaveTimer) {
    clearTimeout(modalAutoSaveTimer);
    modalAutoSaveTimer = null;
    performModalSave();
  }
  document.getElementById('workout-modal').classList.add('hidden');
  document.body.style.overflow = '';
  currentModalDay = null;
}

// Live Session Progress inside Workout Modal
function updateModalProgress() {
  if (!currentModalDay) return;

  const stats = getDayCompletionStats(currentModalDay);
  const pct = stats.percentage;

  const pctEl = document.getElementById('modal-progress-pct');
  const barEl = document.getElementById('modal-progress-bar');
  const bdownEl = document.getElementById('modal-progress-breakdown');

  if (pctEl) {
    pctEl.innerText = `${pct}%`;
    pctEl.className = `font-black font-mono text-sm ${pct === 100 ? 'text-emerald-400' : (pct > 0 ? 'text-cyan-400' : 'text-slate-400')}`;
  }

  if (barEl) {
    barEl.style.width = `${pct}%`;
    if (pct === 100) {
      barEl.className = 'h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    } else {
      barEl.className = 'h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-300';
    }
  }

  if (bdownEl) {
    const b = stats.breakdown;
    const items = [];
    if (b.warmup.total > 0) items.push(`Warmups: ${b.warmup.done}/${b.warmup.total}`);
    if (b.sets.total > 0) items.push(`Sets: ${b.sets.done}/${b.sets.total}`);
    if (b.conditioning.total > 0) items.push(`Cond: ${b.conditioning.done}/${b.conditioning.total}`);
    if (b.cardio.total > 0) items.push(`Cardio: ${b.cardio.done ? '✓' : '—'}`);
    if (b.cooldown.total > 0) items.push(`Cooldown: ${b.cooldown.done}/${b.cooldown.total}`);
    bdownEl.innerText = items.join(' • ');
  }

  const cal = calculateDayCaloriesClient(currentModalDay);
  const calEl = document.getElementById('modal-calories-display');
  if (calEl) {
    calEl.innerText = `${cal.total_completed_kcal} / ${cal.total_estimated_kcal} kcal`;
  }
}

function handleModalCompletedToggle(checked) {
  if (!currentModalDay) return;

  // When manually toggling completed:
  // If checked = true: mark all warmups, sets, conditioning, cardio, cooldowns as completed (100%)
  // If checked = false: mark all items as incomplete (0%)
  if (currentModalDay.warmup_stretches) {
    currentModalDay.warmup_stretches.forEach(s => { s.completed = checked; });
  }

  if (currentModalDay.parsed_exercises) {
    currentModalDay.parsed_exercises.forEach(ex => {
      if (!ex.logged_sets || ex.logged_sets.length === 0) {
        let planned = 3;
        if (ex.target) {
          const m = ex.target.match(/^(\d+)/);
          if (m) planned = parseInt(m[1]);
        }
        ex.logged_sets = Array.from({ length: planned }, (_, i) => ({
          set_num: i + 1,
          weight_kg: '',
          reps: '',
          completed: checked
        }));
      } else {
        ex.logged_sets.forEach(s => { s.completed = checked; });
      }
    });
  }

  if (currentModalDay._conditioning_items) {
    currentModalDay._conditioning_items.forEach(i => { i.completed = checked; });
  }
  currentModalDay.conditioning_completed = checked;
  currentModalDay.cardio_completed = checked;

  if (currentModalDay.cooldown_stretches) {
    currentModalDay.cooldown_stretches.forEach(c => { c.completed = checked; });
  }

  currentModalDay.completed = checked;

  // Re-render modal sections to reflect the new state immediately
  renderModalWarmupStretches(currentModalDay);
  renderModalExercises(currentModalDay);
  renderModalConditioning(currentModalDay);
  renderModalCardio(currentModalDay);
  renderModalCooldownStretches(currentModalDay);

  if (checked) {
    showToast(`Day ${currentModalDay.day_number} 100% completed! Keep it up Kush 🔥`, 'success');
  } else {
    showToast(`Day ${currentModalDay.day_number} reset to pending`, 'info');
  }

  triggerModalAutoSave(true);
}

// Stage 1: Render Dynamic Warm-up & Stretches (with Photos & Video)
function renderModalWarmupStretches(day) {
  const container = document.getElementById('modal-warmup-stretches-list');
  const stretches = day.warmup_stretches || [];
  const warmupCal = Math.round((MET_WARMUP_DYNAMIC * 3.5 * getUserWeightKg() / 200.0) * stretches.length);
  document.getElementById('warmup-count-badge').innerHTML = `${stretches.length} Stretches <span class="text-amber-400 font-semibold">• 🔥 ~${warmupCal} kcal</span>`;

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
  triggerModalAutoSave(true);
}

// Stage 5: Render Post-Workout Cool-Down & Static Stretches (with Photos & Video)
function renderModalCooldownStretches(day) {
  const container = document.getElementById('modal-cooldown-stretches-list');
  const stretches = day.cooldown_stretches || [];
  const cooldownCal = Math.round((MET_COOLDOWN_STATIC * 3.5 * getUserWeightKg() / 200.0) * 0.8 * stretches.length);
  document.getElementById('cooldown-count-badge').innerHTML = `${stretches.length} Stretches <span class="text-amber-400 font-semibold">• 🔥 ~${cooldownCal} kcal</span>`;

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
  triggerModalAutoSave(true);
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
              <div class="flex items-center space-x-1.5 text-xs flex-wrap gap-y-0.5">
                <span class="text-emerald-400 font-bold">${ex.target}</span>
                <span class="text-slate-600">•</span>
                <span class="text-amber-400 font-bold text-[11px] flex items-center space-x-0.5" title="Scientific MET: ${getExerciseMet(ex.name)} • ~${calculateSetCalories(ex.name)} kcal/set">
                  <i data-lucide="flame" class="w-3 h-3 text-amber-400 fill-amber-400 inline"></i>
                  <span>~${Math.round(calculateSetCalories(ex.name) * (sets.length || 3))} kcal</span>
                </span>
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
                    oninput="updateExerciseSet(${exIdx}, ${sIdx}, 'weight_kg', this.value)"
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
                    oninput="updateExerciseSet(${exIdx}, ${sIdx}, 'reps', this.value)"
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
  triggerModalAutoSave(false);
}

function addSetToExercise(exIdx) {
  if (!currentModalDay || !currentModalDay.parsed_exercises) return;
  const ex = currentModalDay.parsed_exercises[exIdx];
  if (!ex.logged_sets) ex.logged_sets = [];
  const nextSetNum = ex.logged_sets.length + 1;
  ex.logged_sets.push({ set_num: nextSetNum, weight_kg: '', reps: '', completed: false });
  renderModalExercises(currentModalDay);
  triggerModalAutoSave(true);
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
    triggerModalAutoSave(true);
  } else {
    ex.logged_sets[setIdx][field] = (val !== '' && val !== null && !isNaN(val)) ? parseFloat(val) : '';
    triggerModalAutoSave(false);
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
  triggerModalAutoSave(true);
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
  triggerModalAutoSave(true);
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
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>Saving...</span>`;
  }

  await performModalSave();

  showToast(`Day ${dayNumber} saved to MongoDB Atlas!`, 'success');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i><span>Save to Atlas</span>`;
    lucide.createIcons();
  }
}

// 5. Weight Tracker Modal & Chart.js
let activeWeightScope = 'all';
let lastWeightData = null;

function setWeightChartScope(scope) {
  activeWeightScope = scope;
  document.querySelectorAll('.weight-scope-btn').forEach(btn => {
    if (btn.getAttribute('data-scope') === scope) {
      btn.className = 'weight-scope-btn active px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-dark-900 shadow-md shadow-emerald-500/20';
    } else {
      btn.className = 'weight-scope-btn px-3 py-1 rounded-lg text-xs font-bold bg-dark-800 text-slate-300 hover:bg-slate-700';
    }
  });
  if (lastWeightData) {
    renderWeightChart(lastWeightData, scope);
  }
}

async function openWeightModal() {
  const pending = allDays.find(d => !d.completed);
  const targetDay = pending ? pending.day_number : 1;
  const dayInput = document.getElementById('quick-weight-day');
  if (dayInput) dayInput.value = targetDay;

  document.getElementById('weight-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
  try {
    const res = await fetch('/api/weight-history');
    const data = await res.json();
    requestAnimationFrame(() => {
      renderWeightChart(data, activeWeightScope);
    });
    renderWeightHistoryList(data.logs || []);
  } catch (err) {
    console.error("Error loading weight history:", err);
  }
}

function closeWeightModal() {
  document.getElementById('weight-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function renderWeightChart(data, scope = activeWeightScope) {
  if (!data) return;
  lastWeightData = data;
  activeWeightScope = scope;

  // 1. Update KPI Summary Badges
  const startKg = parseFloat(data.start_weight) || 92.5;
  const targetKg = parseFloat(data.target_weight) || 82.0;
  const logs = data.logs || [];
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const currentKg = latestLog ? parseFloat(latestLog.weight_kg) : startKg;
  const diffKg = +(startKg - currentKg).toFixed(1);

  const elStart = document.getElementById('weight-kpi-start');
  if (elStart) elStart.innerText = `${startKg} kg`;

  const elCurr = document.getElementById('weight-kpi-current');
  if (elCurr) elCurr.innerText = `${currentKg} kg`;

  const elLost = document.getElementById('weight-kpi-lost');
  if (elLost) {
    if (diffKg > 0) {
      elLost.innerText = `-${diffKg} kg`;
      elLost.className = 'text-base sm:text-lg font-black font-heading text-emerald-400';
    } else if (diffKg < 0) {
      elLost.innerText = `+${Math.abs(diffKg)} kg`;
      elLost.className = 'text-base sm:text-lg font-black font-heading text-rose-400';
    } else {
      elLost.innerText = `0.0 kg`;
      elLost.className = 'text-base sm:text-lg font-black font-heading text-slate-300';
    }
  }

  const elGoal = document.getElementById('weight-kpi-goal');
  if (elGoal) elGoal.innerText = `${targetKg} kg`;

  // 2. Build Axis Labels and Datasets based on scope
  const chartCanvas = document.getElementById('weightChart');
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext('2d');
  if (weightChartInstance) {
    weightChartInstance.destroy();
  }

  let daysLabels = [];
  let idealData = [];
  let actualData = [];

  let maxDay = 90;
  if (scope === 'phase1') maxDay = 28;

  if (scope === 'logged') {
    // Only show days with logged entries plus start day
    const loggedDayNums = new Set(logs.map(l => l.day_number));
    loggedDayNums.add(1);
    const sortedDays = Array.from(loggedDayNums).sort((a, b) => a - b);
    
    sortedDays.forEach(dNum => {
      daysLabels.push(`Day ${dNum}`);
      const p = (dNum - 1) / 89.0;
      idealData.push(+(startKg - p * (startKg - targetKg)).toFixed(2));
      const logEntry = logs.find(l => l.day_number === dNum);
      if (logEntry) {
        actualData.push(logEntry.weight_kg);
      } else if (dNum === 1) {
        actualData.push(startKg);
      } else {
        actualData.push(null);
      }
    });
  } else {
    for (let i = 1; i <= maxDay; i++) {
      daysLabels.push(`D${i}`);
      const p = (i - 1) / 89.0;
      idealData.push(+(startKg - p * (startKg - targetKg)).toFixed(2));
    }

    actualData = new Array(maxDay).fill(null);
    logs.forEach(l => {
      if (l.day_number >= 1 && l.day_number <= maxDay) {
        actualData[l.day_number - 1] = l.weight_kg;
      }
    });
  }

  // 3. Dynamic Y-Axis scale to make the curve prominent
  const allWeightNums = [startKg, targetKg];
  logs.forEach(l => { if (l.weight_kg) allWeightNums.push(Number(l.weight_kg)); });
  const minObserved = Math.min(...allWeightNums);
  const maxObserved = Math.max(...allWeightNums);
  const yAxisMin = Math.max(70, Math.floor(minObserved - 1.0));
  const yAxisMax = Math.min(120, Math.ceil(maxObserved + 1.0));

  // 4. Gradient Fill for Area
  const areaGradient = ctx.createLinearGradient(0, 0, 0, 340);
  areaGradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
  areaGradient.addColorStop(0.7, 'rgba(16, 185, 129, 0.08)');
  areaGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

  // 5. Construct High-Visibility Chart
  weightChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: daysLabels,
      datasets: [
        {
          label: `Goal Target (➔ ${targetKg} kg)`,
          data: idealData,
          borderColor: '#06b6d4',
          borderWidth: 2.5,
          borderDash: [6, 4],
          pointRadius: (ctx) => {
            const idx = ctx.dataIndex;
            return (idx === 0 || idx === daysLabels.length - 1) ? 4 : 0;
          },
          pointBackgroundColor: '#06b6d4',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          fill: false,
          tension: 0.1
        },
        {
          label: 'Your Logged Weight (kg)',
          data: actualData,
          borderColor: '#10b981',
          borderWidth: 3.5,
          backgroundColor: areaGradient,
          fill: true,
          tension: 0.3,
          spanGaps: true,
          pointRadius: 7,
          pointHoverRadius: 10,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#10b981',
          pointBorderWidth: 3,
          pointHitRadius: 18
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#f1f5f9',
            font: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
            boxWidth: 22,
            boxHeight: 8,
            padding: 14
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: '#090d16',
          titleColor: '#38bdf8',
          titleFont: { size: 13, weight: 'bold' },
          bodyColor: '#ffffff',
          bodyFont: { size: 12, weight: '600' },
          borderColor: '#10b981',
          borderWidth: 1.5,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            title: (items) => {
              const label = items[0].label;
              return label.startsWith('D') && !label.startsWith('Day') 
                ? `Day ${label.replace('D', '')}` 
                : label;
            },
            label: (item) => {
              const val = item.raw;
              if (val === null || val === undefined) return '';
              if (item.datasetIndex === 1) {
                const diff = +(val - startKg).toFixed(1);
                const sign = diff > 0 ? '+' : '';
                return `  ⚖️ Logged Weight: ${val} kg (${sign}${diff} kg from start)`;
              } else {
                return `  🎯 Target Trajectory: ${val} kg`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#94a3b8',
            maxTicksLimit: scope === 'phase1' ? 14 : 12,
            font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }
          }
        },
        y: {
          min: yAxisMin,
          max: yAxisMax,
          grid: {
            color: 'rgba(255, 255, 255, 0.08)',
            borderDash: [3, 3]
          },
          ticks: {
            color: '#cbd5e1',
            font: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
            callback: (v) => `${v} kg`,
            stepSize: (yAxisMax - yAxisMin > 10) ? 2 : 1
          }
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
    document.body.style.overflow = 'hidden';
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
  const workoutModal = document.getElementById('workout-modal');
  if (!workoutModal || workoutModal.classList.contains('hidden')) {
    document.body.style.overflow = '';
  }
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

async function openCoachingModal() {
  document.getElementById('rules-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (!coachingNotes || coachingNotes.length === 0) {
    await loadCoachingNotes();
  }

  const container = document.getElementById('coaching-notes-container');
  if (coachingNotes && coachingNotes.length > 0) {
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
  } else {
    container.innerHTML = `
      <div class="py-8 text-center text-slate-500">
        <p class="text-xs">No coaching rules available. Please check MongoDB connection.</p>
      </div>
    `;
  }
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

  // Modal Completed Checkbox
  const chkModalCompleted = document.getElementById('modal-completed-checkbox');
  if (chkModalCompleted) {
    chkModalCompleted.addEventListener('change', (e) => {
      handleModalCompletedToggle(e.target.checked);
    });
  }
}
