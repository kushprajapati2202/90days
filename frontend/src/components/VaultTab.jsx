import React, { useState, useEffect, useMemo } from 'react';
import { Search, Dumbbell, ExternalLink, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../services/api';

export default function VaultTab({ onSelectExerciseGuide }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getExercises();
        setExercises(data.exercises || []);
      } catch (e) {
        console.error('Failed to load exercises:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const groups = [
    'All',
    'Chest',
    'Back',
    'Shoulders',
    'Legs & Glutes',
    'Arms',
    'Core & Conditioning',
    'Warm-Up & Mobility',
    'Cool-Down Stretches',
  ];

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (selectedGroup !== 'All' && ex.body_group !== selectedGroup) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const inName = (ex.display_name || ex.name || '').toLowerCase().includes(q);
        const inEq = (ex.equipment || '').toLowerCase().includes(q);
        const inMuscles = (ex.primary_muscles || []).some((m) => m.toLowerCase().includes(q));
        if (!inName && !inEq && !inMuscles) return false;
      }
      return true;
    });
  }, [exercises, selectedGroup, search]);

  return (
    <div class="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Search & Groups Header */}
      <div class="p-4 rounded-2xl bg-dark-850 border border-white/[0.06] space-y-3">
        <div class="flex items-center space-x-2">
          <BookOpen class="w-4 h-4 text-volt" />
          <h2 class="text-xs font-bold text-white font-heading">Movement & Anatomy Vault</h2>
          <span class="text-[10px] text-zinc-400 font-mono">({exercises.length} Exercises)</span>
        </div>

        <div class="relative">
          <Search class="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by movement name, muscle, equipment..."
            class="w-full bg-dark-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-volt"
          />
        </div>

        {/* Group chips */}
        <div class="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {groups.map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              class={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition ${
                selectedGroup === grp
                  ? 'bg-volt text-dark-950 font-black shadow-md shadow-volt/20'
                  : 'bg-dark-900 text-zinc-400 hover:text-white border border-white/[0.04]'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of movements */}
      {loading ? (
        <div class="py-12 text-center">
          <div class="w-8 h-8 border-2 border-volt border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p class="text-xs text-zinc-400">Loading exercise library...</p>
        </div>
      ) : (
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((ex, idx) => {
            const photos = ex.images || [];
            const primary = (ex.primary_muscles || []).slice(0, 2).join(', ');

            return (
              <div
                key={ex.id || idx}
                onClick={() => onSelectExerciseGuide(ex)}
                class="p-3 rounded-2xl bg-dark-850 border border-white/[0.06] hover:border-volt/40 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Photo thumbnail */}
                  {photos.length > 0 ? (
                    <div class="w-full h-36 rounded-xl bg-dark-900 overflow-hidden mb-2.5 relative border border-white/[0.04]">
                      <img
                        src={photos[0]}
                        alt={ex.display_name}
                        loading="lazy"
                        class="w-full h-full object-cover object-center hover:scale-105 transition duration-300"
                      />
                      <span class="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-dark-950/80 backdrop-blur-md text-[10px] font-bold text-zinc-300 border border-white/10">
                        {ex.equipment || 'Equipment'}
                      </span>
                    </div>
                  ) : (
                    <div class="w-full h-24 rounded-xl bg-dark-900 flex items-center justify-center text-zinc-600 mb-2.5">
                      <Dumbbell class="w-8 h-8" />
                    </div>
                  )}

                  {/* Title */}
                  <h4 class="text-xs font-bold text-white font-heading line-clamp-1 mb-1">
                    {ex.display_name || ex.name}
                  </h4>
                  <p class="text-[11px] text-zinc-400 capitalize line-clamp-1">
                    Target: <span class="text-volt">{primary || 'Major Muscles'}</span>
                  </p>
                </div>

                <div class="pt-2 border-t border-white/[0.06] mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>{ex.category || ex.body_group}</span>
                  <span class="text-volt font-bold flex items-center space-x-0.5">
                    <span>Guide</span>
                    <ExternalLink class="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
