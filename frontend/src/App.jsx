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
  const [allDays, setAllDays] = useState([]);
  const [stats, setStats] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Modals
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedExerciseGuide, setSelectedExerciseGuide] = useState(null);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Rest Timer State
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  // Load initial data
  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [daysRes, statsRes, weightRes] = await Promise.all([
        api.getDays(),
        api.getStats(),
        api.getWeightHistory(),
      ]);

      setAllDays(daysRes.days || []);
      setStats(statsRes);
      setWeightHistory(weightRes.history || []);
    } catch (err) {
      console.error('Failed to load application data:', err);
      setLoadError(err.message || 'Unable to connect to service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
  // Use today's calendar date offset or first pending day
  const getTodayDay = () => {
    if (allDays.length === 0) return null;
    const pendingDay = allDays.find((d) => !d.completed);
    return pendingDay || allDays[0];
  };

  const todayDay = getTodayDay();

  // Optimistic updates
  const handleDayUpdated = (updatedDay) => {
    setAllDays((prev) =>
      prev.map((d) => (d.day_number === updatedDay.day_number ? updatedDay : d))
    );
    // Refresh stats in background
    api.getStats().then((s) => setStats(s)).catch(() => {});
  };

  const handleQuickLogWeight = async (weightKg) => {
    await api.logWeight(weightKg);
    const [statsRes, weightRes] = await Promise.all([
      api.getStats(),
      api.getWeightHistory(),
    ]);
    setStats(statsRes);
    setWeightHistory(weightRes.history || []);
  };

  const handleDeleteWeightLog = async (logId) => {
    try {
      await api.deleteWeightLog(logId);
      const [statsRes, weightRes] = await Promise.all([
        api.getStats(),
        api.getWeightHistory(),
      ]);
      setStats(statsRes);
      setWeightHistory(weightRes.history || []);
    } catch (e) {
      console.error('Delete weight log failed:', e);
    }
  };

  return (
    <div class="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans">
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
      <main class="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-20 md:pb-8">
        {isLoading ? (
          <div class="py-24 text-center">
            <div class="w-10 h-10 border-2 border-volt border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 class="text-sm font-bold text-white font-heading">Initializing 90Days Pro Engine</h3>
            <p class="text-xs text-zinc-400 mt-1">Connecting to MongoDB Atlas...</p>
          </div>
        ) : loadError ? (
          <div class="py-12 px-4 max-w-md mx-auto text-center bg-dark-850 rounded-3xl border border-rose-500/30 shadow-2xl">
            <div class="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              !
            </div>
            <h3 class="text-base font-bold text-white font-heading mb-1">Service Initializing</h3>
            <p class="text-xs text-zinc-400 mb-4">{loadError}</p>
            <button
              onClick={loadData}
              class="px-5 py-2.5 rounded-xl bg-volt text-dark-950 font-black text-xs hover:bg-[#b8e600] active:scale-95 transition"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'today' && (
              <TodayTab
                todayDay={todayDay}
                allDays={allDays}
                stats={stats}
                onOpenWorkoutModal={(d) => setSelectedWorkout(d)}
                onOpenWeightModal={() => setIsWeightModalOpen(true)}
                onQuickLogWeight={handleQuickLogWeight}
                onSelectDay={(d) => setSelectedWorkout(d)}
              />
            )}

            {activeTab === 'workouts' && (
              <WorkoutsTab
                allDays={allDays}
                stats={stats}
                onOpenWorkoutModal={(d) => setSelectedWorkout(d)}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressTab
                stats={stats}
                weightHistory={weightHistory}
                onOpenWeightModal={() => setIsWeightModalOpen(true)}
                onDeleteWeightLog={handleDeleteWeightLog}
              />
            )}

            {activeTab === 'vault' && (
              <VaultTab
                onSelectExerciseGuide={(ex) => setSelectedExerciseGuide(ex)}
              />
            )}
          </>
        )}
      </main>

      {/* 3. MOBILE BOTTOM DOCK (4 SEGMENTS) */}
      <BottomDock activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 4. REST TIMER FLOATING CARD */}
      <RestTimer
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        secondsLeft={timerSeconds}
        isRunning={isTimerRunning}
        onToggleRun={handleToggleTimerRun}
        onReset={handleResetTimer}
        onSetPreset={handleSetTimerPreset}
      />

      {/* 5. WORKOUT EXECUTION MODAL */}
      <WorkoutModal
        day={selectedWorkout}
        isOpen={!!selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        onDayUpdated={handleDayUpdated}
        onLaunchRestTimer={launchRestTimer}
        onOpenExerciseGuide={(ex) => setSelectedExerciseGuide(ex)}
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

