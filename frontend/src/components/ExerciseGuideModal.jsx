import React, { useState } from 'react';
import { X, ExternalLink, Dumbbell, Sparkles } from 'lucide-react';

export default function ExerciseGuideModal({ exercise, isOpen, onClose }) {
  if (!isOpen || !exercise) return null;

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const photos = exercise.images || [];
  const cues = exercise.form_cues || [];
  const primary = exercise.primary_muscles || [];
  const secondary = exercise.secondary_muscles || [];

  const videoUrl = exercise.video_query
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.video_query)}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent((exercise.display_name || exercise.name) + ' proper form')}`;

  return (
    <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div class="w-full max-w-lg bg-dark-850 border border-white/[0.1] rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div class="p-3.5 sm:p-4 border-b border-white/[0.08] bg-dark-900 flex items-center justify-between shrink-0">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-volt">
              {exercise.category || 'Strength Movement'}
            </span>
            <h3 class="text-sm sm:text-base font-bold text-white font-heading line-clamp-1">
              {exercise.display_name || exercise.name}
            </h3>
          </div>
          <button onClick={onClose} class="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition">
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Dual photo demonstration carousel */}
          {photos.length > 0 && (
            <div class="space-y-2">
              <div class="w-full h-56 sm:h-64 rounded-2xl bg-dark-900 overflow-hidden border border-white/[0.06] relative">
                <img
                  src={photos[activePhotoIdx]}
                  alt="Exercise demonstration"
                  class="w-full h-full object-cover object-center"
                />
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-dark-950/80 backdrop-blur-md text-[10px] font-bold text-zinc-300">
                  {activePhotoIdx === 0 ? 'Phase 1: Starting Setup' : 'Phase 2: Peak Contraction'}
                </span>
              </div>

              {photos.length > 1 && (
                <div class="grid grid-cols-2 gap-2">
                  {photos.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhotoIdx(i)}
                      class={`p-1 rounded-xl border text-left flex items-center space-x-2 transition ${
                        activePhotoIdx === i
                          ? 'border-volt bg-volt/10 text-white font-bold'
                          : 'border-white/[0.06] bg-dark-900 text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <img src={src} alt="thumb" class="w-9 h-9 rounded-lg object-cover" />
                      <span class="text-[11px]">{i === 0 ? 'Starting Setup' : 'Peak Contraction'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Muscles & Equipment */}
          <div class="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06] space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-zinc-400 font-bold">Equipment:</span>
              <span class="text-white font-medium">{exercise.equipment || 'Gym Equipment'}</span>
            </div>

            <div>
              <span class="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Target Muscles</span>
              <div class="flex flex-wrap gap-1">
                {primary.map((m, i) => (
                  <span key={i} class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-volt/15 text-volt border border-volt/30 capitalize">
                    {m}
                  </span>
                ))}
                {secondary.map((m, i) => (
                  <span key={i} class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-zinc-400 capitalize">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Execution Form Cues */}
          {cues.length > 0 && (
            <div class="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06] space-y-2">
              <h4 class="text-xs font-bold text-white font-heading">Form & Execution Protocol</h4>
              <ul class="space-y-1.5">
                {cues.map((cue, i) => (
                  <li key={i} class="text-xs text-zinc-300 flex items-start space-x-2 leading-relaxed">
                    <span class="text-volt font-bold mt-0.5">•</span>
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div class="p-3 sm:p-4 border-t border-white/[0.08] bg-dark-900 shrink-0">
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white flex items-center justify-center space-x-2 transition"
          >
            <span>Watch Video Form Demonstration</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
