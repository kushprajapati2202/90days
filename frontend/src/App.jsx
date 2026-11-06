import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import BottomDock from './components/BottomDock';
import TodayTab from './components/TodayTab';
import WorkoutsTab from './components/WorkoutsTab';
import ProgressTab from './components/ProgressTab';
import VaultTab from './components/VaultTab';
import WorkoutModal from './components/WorkoutModal';
import WeightModal from './components/WeightModal';
import ExerciseGuideModal from './components/ExerciseGuideModal';
import RestTimer from './components/RestTimer';
import { api } from './services/api';
import { sounds } from './utils/sound';

export default function App() {
  const [activeTab, setActiveTab] = useState('today');

  // Instant-load from local storage cache on refresh / visit
  const [allDays, setAllDays] = useState(() => {
    try {
      const saved = localStorage.getItem('90days_cache_days');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('90days_cache_stats');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [weightHistory, setWeightHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('90days_cache_weight');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      const saved = localStorage.getItem('90days_cache_days');
      return !saved || JSON.parse(saved).length === 0;
    } catch (e) {
      return true;
    }
  });

  const [loadError, setLoadError] = useState(null);

  // Modals
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState(null);
  const [selectedExerciseGuide, setSelectedExerciseGuide] = useState(null);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Rest Timer State
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  // Load initial data with silent background refresh
  const loadData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      setLoadError(null);
      const [daysRes, statsRes, weightRes] = await Promise.all([
        api.getDays(),
        api.getStats().catch((e) => {
          console.warn('Stats fetch fallback:', e);
          return null;
        }),
        api.getWeightHistory().catch((e) => {
          console.warn('Weight history fetch fallback:', e);
          return { history: [] };
        }),
      ]);

      const days = daysRes.days || [];
      const weight = weightRes.history || [];

      setAllDays(days);
      if (statsRes) setStats(statsRes);
      setWeightHistory(weight);

      // Persist to local storage for instantaneous future loads
      try {
        localStorage.setItem('90days_cache_days', JSON.stringify(days));
        if (statsRes) localStorage.setItem('90days_cache_stats', JSON.stringify(statsRes));
        localStorage.setItem('90days_cache_weight', JSON.stringify(weight));
      } catch (storageErr) {
        console.warn('Cache storage notice:', storageErr);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
      // Only display block error if there is zero cached data to show
      if (allDays.length === 0) {
        setLoadError(err.message || 'Unable to connect to service.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If cached data exists, load silently in background without showing a spinner
    const hasCached = allDays && allDays.length > 0;
    loadData(hasCached);
  }, []);

  // Timer Tick logic
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            sounds.playTimerDone();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const launchRestTimer = (seconds = 90) => {
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
    setIsTimerOpen(true);
  };

  const handleToggleTimerRun = () => {
    if (timerSeconds <= 0) setTimerSeconds(90);
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(90);
  };

  const handleSetTimerPreset = (sec) => {
    setTimerSeconds(sec);
    setIsTimerRunning(true);
  };

  // Determine Today's Workout Day
  // Priority:
  // 1. User selected day number (e.g. tapped from weekly consistency capsules)
  // 2. Exact match of today's calendar date in Indian Standard Time (Asia/Kolkata)
  // 3. First non-completed day (or day 1 if all done)
  const getTodayDay = () => {
    if (allDays.length === 0) return null;
    if (selectedDayNumber) {
      const found = allDays.find((d) => d.day_number === selectedDayNumber);
      if (found) return found;
    }
    try {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        timeZone: 'Asia/Kolkata',
      });
      const parts = formatter.formatToParts(new Date());
      const day = parts.find((p) => p.type === 'day')?.value;
      const month = parts.find((p) => p.type === 'month')?.value;
      if (day && month) {
        const todayDateStr = `${day} ${month}`.toLowerCase();
        const matchToday = allDays.find(
          (d) => d.date_display && d.date_display.trim().toLowerCase() === todayDateStr
        );
        if (matchToday) return matchToday;
      }
    } catch (e) {
      console.warn('Date matching error:', e);
    }
    const pendingDay = allDays.find((d) => !d.completed);
    return pendingDay || allDays[0];
  };

  const todayDay = getTodayDay();

  const statsDebounceRef = useRef(null);

  // Optimistic updates with instant cache synchronization
  const handleDayUpdated = (updatedDay) => {
    setAllDays((prev) => {
      const next = prev.map((d) => (d.day_number === updatedDay.day_number ? updatedDay : d));
      try {
        localStorage.setItem('90days_cache_days', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Debounced stats refresh in background so rapid ticks/inputs don't spam getStats()
    if (statsDebounceRef.current) clearTimeout(statsDebounceRef.current);
    statsDebounceRef.current = setTimeout(() => {
      api.getStats().then((s) => {
        if (s) {
          setStats(s);
          try {
            localStorage.setItem('90days_cache_stats', JSON.stringify(s));
          } catch (e) {}
        }
      }).catch(() => {});
    }, 400);
  };

  const handleQuickLogWeight = async (weightKg, timeOfDay = 'morning', dayNum = null) => {
    // Optimistically update weight on the day in allDays
    if (dayNum) {
      setAllDays((prev) => {
        const next = prev.map((d) => (d.day_number === dayNum ? { ...d, actual_weight_kg: Number(weightKg) } : d));
        try { localStorage.setItem('90days_cache_days', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    }

    await api.logWeight(weightKg, '', null, timeOfDay, dayNum);
    const [statsRes, weightRes] = await Promise.all([
      api.getStats(),
      api.getWeightHistory(),
    ]);
    if (statsRes) {
      setStats(statsRes);
      try { localStorage.setItem('90days_cache_stats', JSON.stringify(statsRes)); } catch (e) {}
    }
    const history = weightRes.history || [];
    setWeightHistory(history);
    try { localStorage.setItem('90days_cache_weight', JSON.stringify(history)); } catch (e) {}
  };

  const handleDeleteWeightLog = async (logId) => {
    try {
      await api.deleteWeightLog(logId);
      const [statsRes, weightRes] = await Promise.all([
        api.getStats(),
        api.getWeightHistory(),
      ]);
      if (statsRes) {
        setStats(statsRes);
        try { localStorage.setItem('90days_cache_stats', JSON.stringify(statsRes)); } catch (e) {}
      }
      const history = weightRes.history || [];
      setWeightHistory(history);
      try { localStorage.setItem('90days_cache_weight', JSON.stringify(history)); } catch (e) {}
    } catch (e) {
      console.error('Delete weight log failed:', e);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans">
      {/* 1. TOP HEADER APP BAR */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
        onToggleTimer={() => setIsTimerOpen(!isTimerOpen)}
        timerRemaining={timerSeconds}
        isTimerRunning={isTimerRunning}
      />

      {/* 2. MAIN WORKSPACE VIEW */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-4 md:pb-8">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-2 border-volt border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-sm font-bold text-white font-heading">Loading Your 90-Day Plan</h3>
            <p className="text-xs text-zinc-400 mt-1">Syncing your workouts, weights, and daily targets...</p>
          </div>
        ) : loadError ? (
          <div className="py-12 px-4 max-w-md mx-auto text-center bg-dark-850 rounded-3xl border border-rose-500/30 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              !
            </div>
            <h3 className="text-base font-bold text-white font-heading mb-1">Unable to Load Plan</h3>
            <p className="text-xs text-zinc-400 mb-4">Please check your internet connection and try again.</p>
            <button
              onClick={loadData}
              className="px-5 py-2.5 rounded-xl bg-volt text-dark-950 font-black text-xs hover:bg-[#b8e600] active:scale-95 transition"
            >
              Reload Training Plan
            </button>
          </div>
        ) : (
          <>
            <div className={activeTab === 'today' ? 'block' : 'hidden'}>
              <TodayTab
                todayDay={todayDay}
                allDays={allDays}
                stats={stats}
                weightHistory={weightHistory}
                onOpenWorkoutModal={(d) => setSelectedWorkout(d)}
                onOpenWeightModal={() => setIsWeightModalOpen(true)}
                onQuickLogWeight={handleQuickLogWeight}
                onSelectDay={(d) => setSelectedDayNumber(d.day_number)}
                onDayUpdated={handleDayUpdated}
                onLaunchRestTimer={launchRestTimer}
                onOpenExerciseGuide={(ex) => setSelectedExerciseGuide(ex)}
              />
            </div>

            <div className={activeTab === 'workouts' ? 'block' : 'hidden'}>
              <WorkoutsTab
                allDays={allDays}
                stats={stats}
                onOpenWorkoutModal={(d) => setSelectedWorkout(d)}
              />
            </div>

            <div className={activeTab === 'progress' ? 'block' : 'hidden'}>
              <ProgressTab
                stats={stats}
                weightHistory={weightHistory}
                onOpenWeightModal={() => setIsWeightModalOpen(true)}
                onDeleteWeightLog={handleDeleteWeightLog}
              />
            </div>

            <div className={activeTab === 'vault' ? 'block' : 'hidden'}>
              <VaultTab
                onSelectExerciseGuide={(ex) => setSelectedExerciseGuide(ex)}
              />
            </div>
          </>
        )}
      </main>

      {/* 3. MOBILE BOTTOM DOCK (4 SEGMENTS) */}
      <BottomDock activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 5. WORKOUT EXECUTION MODAL */}
      <WorkoutModal
        day={selectedWorkout}
        isOpen={!!selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        onDayUpdated={handleDayUpdated}
        onLaunchRestTimer={launchRestTimer}
        onOpenExerciseGuide={(ex) => setSelectedExerciseGuide(ex)}
        stats={stats}
        allDays={allDays}
      />

      {/* 4. REST TIMER FLOATING CARD (Rendered after WorkoutModal so it stays on top) */}
      <RestTimer
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        secondsLeft={timerSeconds}
        isRunning={isTimerRunning}
        onToggleRun={handleToggleTimerRun}
        onReset={handleResetTimer}
        onSetPreset={handleSetTimerPreset}
      />

      {/* 6. WEIGH-IN MODAL */}
      <WeightModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        currentWeight={stats?.weight_stats?.current_weight_kg || 91.55}
        onWeightLogged={async () => {
          const [s, w] = await Promise.all([api.getStats(), api.getWeightHistory()]);
          setStats(s);
          setWeightHistory(w.history || []);
        }}
      />

      {/* 7. EXERCISE FORM GUIDE MODAL */}
      <ExerciseGuideModal
        exercise={selectedExerciseGuide}
        isOpen={!!selectedExerciseGuide}
        onClose={() => setSelectedExerciseGuide(null)}
      />
    </div>
  );
}

