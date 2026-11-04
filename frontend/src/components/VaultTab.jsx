import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ExternalLink, Filter, X, Sparkles, Layers, ChevronDown } from 'lucide-react';
import { MdFitnessCenter } from 'react-icons/md';
import { TbBarbell } from 'react-icons/tb';
import { api } from '../services/api';

const BODY_GROUPS = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs & Glutes',
  'Core / Abs',
  'Cardio',
  'Stretching',
];

const EQUIPMENT_OPTIONS = [
  'All Equipment',
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Bodyweight',
  'Kettlebell & Bands',
];

export default function VaultTab({ onSelectExerciseGuide }) {
  const [exercises, setExercises] = useState(() => {
    try {
      const saved = sessionStorage.getItem('90days_vault_default');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [totalCount, setTotalCount] = useState(() => {
    try {
      const saved = sessionStorage.getItem('90days_vault_total');
      return saved ? Number(saved) : 0;
    } catch (e) {
      return 0;
    }
  });
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(() => {
    try {
      const saved = sessionStorage.getItem('90days_vault_default');
      return !saved || JSON.parse(saved).length === 0;
    } catch (e) {
      return true;
    }
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedEquipment, setSelectedEquipment] = useState('All Equipment');
  const [search, setSearch] = useState('');
  const [filterStats, setFilterStats] = useState(() => {
    try {
      const saved = sessionStorage.getItem('90days_vault_filters');
      return saved ? JSON.parse(saved) : { groups: {}, equipment: {}, total: 0 };
    } catch (e) {
      return { groups: {}, equipment: {}, total: 0 };
    }
  });

  const searchDebounceRef = useRef(null);

  // Load filter counts on mount with instant session cache
  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await api.getVaultFilters();
        if (stats) {
          setFilterStats(stats);
          try {
            sessionStorage.setItem('90days_vault_filters', JSON.stringify(stats));
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Failed to load vault filter counts:', e);
      }
    }
    loadStats();
  }, []);

  // Fetch exercises based on active filters & page
  const fetchExercises = useCallback(async (pageNum, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else if (!exercises.length) {
        setLoading(true);
      }

      const res = await api.getVaultExercises({
        group: selectedGroup,
        equipment: selectedEquipment === 'All Equipment' ? 'All' : selectedEquipment,
        search: search.trim(),
        page: pageNum,
        limit: 48,
      });

      if (res && res.exercises) {
        if (isLoadMore) {
          setExercises((prev) => [...prev, ...res.exercises]);
        } else {
          setExercises(res.exercises);
          if (selectedGroup === 'All' && selectedEquipment === 'All Equipment' && !search.trim() && pageNum === 1) {
            try {
              sessionStorage.setItem('90days_vault_default', JSON.stringify(res.exercises));
              sessionStorage.setItem('90days_vault_total', String(res.total || 0));
            } catch (e) {}
          }
        }
        setTotalCount(res.total || 0);
        setHasMore(Boolean(res.has_more));
        setPage(pageNum);
      }
    } catch (e) {
      console.error('Failed to query exercise vault:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedGroup, selectedEquipment, search, exercises.length]);

  // Initial load and filter change trigger
  useEffect(() => {
    fetchExercises(1, false);
  }, [fetchExercises]);

  // Handle live search with debouncing
  const handleSearchChange = (val) => {
    setSearch(val);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchExercises(page + 1, true);
    }
  };

  const resetFilters = () => {
    setSelectedGroup('All');
    setSelectedEquipment('All Equipment');
    setSearch('');
  };

  // Helper to get count badge for group
  const getGroupCount = (grp) => {
    if (grp === 'All') return filterStats.total || totalCount || 2140;
    return filterStats.groups?.[grp] || null;
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Search & Filter Header Container */}
      <div className="p-4 sm:p-5 rounded-3xl bg-dark-850 border border-white/[0.08] shadow-xl space-y-4">
        {/* Title & Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-volt/15 border border-volt/30 flex items-center justify-center text-volt">
              <MdFitnessCenter className="w-4 h-4 text-volt" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white font-heading tracking-tight flex items-center space-x-2">
                <span>Movement & Anatomy Vault</span>
                <span className="px-2 py-0.5 rounded-full bg-volt/15 text-volt text-[10px] font-mono font-bold border border-volt/30">
                  {filterStats.total ? `${filterStats.total.toLocaleString()} Exercises` : '2,140+ Exercises'}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Comprehensive movement library with dual-angle photos, animated executions, form cues & YouTube guides.
              </p>
            </div>
          </div>

          {(selectedGroup !== 'All' || selectedEquipment !== 'All Equipment' || search.trim()) && (
            <button
              onClick={resetFilters}
              className="self-start sm:self-auto text-[11px] font-bold text-volt hover:text-volt-light flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-volt/10 border border-volt/20 transition"
            >
              <X className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search exercise, muscle, or gear..."
            className="w-full bg-dark-900 border border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-volt transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Muscle / Body Group Filter Pills */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Target Body Region
          </span>
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
            {BODY_GROUPS.map((grp) => {
              const isSelected = selectedGroup === grp;
              const count = getGroupCount(grp);
              return (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-volt text-dark-950 font-black shadow-md shadow-volt/20'
                      : 'bg-dark-900 text-zinc-400 hover:text-white border border-white/[0.05]'
                  }`}
                >
                  <span>{grp}</span>
                  {count !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isSelected ? 'bg-black/20 text-dark-950' : 'bg-white/5 text-zinc-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Equipment Filter Chips */}
        <div className="space-y-1.5 pt-1 border-t border-white/[0.04]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Equipment Filter
          </span>
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            {EQUIPMENT_OPTIONS.map((eq) => {
              const isSelected = selectedEquipment === eq;
              return (
                <button
                  key={eq}
                  onClick={() => setSelectedEquipment(eq)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition ${
                    isSelected
                      ? 'bg-white/15 text-white font-bold border border-white/20'
                      : 'bg-dark-900 text-zinc-400 hover:text-zinc-200 border border-white/[0.04]'
                  }`}
                >
                  {eq}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
        <div>
          Showing <span className="text-white font-bold">{exercises.length}</span> of{' '}
          <span className="text-volt font-bold">{totalCount.toLocaleString()}</span> movements
          {selectedGroup !== 'All' && <span className="text-zinc-400"> in {selectedGroup}</span>}
          {selectedEquipment !== 'All Equipment' && <span className="text-zinc-400"> ({selectedEquipment})</span>}
        </div>
      </div>

      {/* Grid of Movement Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-9 h-9 border-2 border-volt border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-white">Loading exercise library...</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Accessing 2,200+ exercise movements & protocols...</p>
        </div>
      ) : exercises.length === 0 ? (
        <div className="py-16 text-center bg-dark-850 rounded-3xl border border-white/[0.06] p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
            <TbBarbell className="w-7 h-7 text-zinc-500" />
          </div>
          <h3 className="text-sm font-bold text-white font-heading">No movements found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            No exercises match your current search and filter criteria. Try adjusting your search term or resetting filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-volt text-dark-950 font-bold text-xs shadow-md shadow-volt/20 hover:bg-volt-light transition"
          >
            Show All Movements
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {exercises.map((ex, idx) => {
            const rawPhotos = ex.images || [];
            const photos = ex.gif_url && !rawPhotos.includes(ex.gif_url) ? [ex.gif_url, ...rawPhotos] : rawPhotos;
            const primary = (ex.primary_muscles || []).slice(0, 2).join(', ');
            const thumbnail = ex.gif_url || photos[0];
            const isGif = Boolean(thumbnail && thumbnail.toLowerCase().includes('.gif'));

            return (
              <div
                key={`${ex.id || ex.name}-${idx}`}
                onClick={() => onSelectExerciseGuide(ex)}
                className="p-3.5 rounded-2xl bg-dark-850 border border-white/[0.06] hover:border-volt/40 transition duration-200 cursor-pointer flex flex-col justify-between group shadow-lg shadow-black/20"
              >
                <div>
                  {/* Photo / Demonstration thumbnail */}
                  <div className="w-full h-44 rounded-xl bg-black overflow-hidden mb-3 relative border border-white/[0.06] flex items-center justify-center">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={ex.display_name || ex.name}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          const staticImg = ex.images?.find((p) => !p.toLowerCase().includes('.gif'));
                          if (staticImg && e.currentTarget.src !== staticImg) {
                            e.currentTarget.src = staticImg;
                          } else {
                            e.currentTarget.style.display = 'none';
                          }
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-600">
                        <TbBarbell className="w-8 h-8 mb-1 text-zinc-600" />
                        <span className="text-[10px] text-zinc-400">Exercise Preview</span>
                      </div>
                    )}

                    {/* Equipment Pill Badge */}
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-dark-950/85 backdrop-blur-md text-[10px] font-bold text-zinc-300 border border-white/10">
                      {ex.equipment || 'Equipment'}
                    </span>

                    {/* 90-Day Plan Core Badge */}
                    {ex.is_plan && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-volt text-dark-950 text-[9px] font-black uppercase tracking-wider shadow-md shadow-volt/30">
                        ★ Plan Core
                      </span>
                    )}
                  </div>

                  {/* Title & Muscles */}
                  <h4 className="text-xs sm:text-sm font-bold text-white font-heading line-clamp-1 group-hover:text-volt transition mb-1">
                    {ex.display_name || ex.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mb-2">
                    Target: <span className="text-volt font-medium capitalize">{primary || ex.body_group || 'General'}</span>
                  </p>
                </div>

                {/* Footer Tag & Guide trigger */}
                <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="truncate max-w-[65%] text-[10px] font-mono uppercase text-zinc-400">
                    {ex.body_group || ex.category}
                  </span>
                  <span className="text-volt font-bold flex items-center space-x-1 group-hover:underline">
                    <span>Form Guide</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination / Load More Button */}
      {!loading && hasMore && (
        <div className="pt-6 pb-4 text-center space-y-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-dark-850 hover:bg-dark-800 border border-white/10 hover:border-volt/40 text-xs font-bold text-white transition flex items-center justify-center space-x-2 mx-auto shadow-lg"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-volt border-t-transparent rounded-full animate-spin" />
                <span>Loading more exercises...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4 text-volt" />
                <span>Load 48 More Exercises</span>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </>
            )}
          </button>
          <p className="text-[11px] text-zinc-400 font-mono">
            Showing {exercises.length} of {totalCount.toLocaleString()} total movements
          </p>
        </div>
      )}

      {!loading && !hasMore && exercises.length > 0 && (
        <div className="pt-6 text-center text-xs text-zinc-400 font-mono">
          ✓ All {totalCount.toLocaleString()} matching exercises loaded
        </div>
      )}
    </div>
  );
}
