import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { TbBarbell, TbActivity } from 'react-icons/tb';
import { FaDumbbell } from 'react-icons/fa6';

export default function ExerciseGuideModal({ exercise, isOpen, onClose }) {
  if (!isOpen || !exercise) return null;

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Collect all photos and prioritize GIF demonstration if available
  let rawPhotos = Array.isArray(exercise.images) ? [...exercise.images] : [];
  const gifCandidate = exercise.gif_url || exercise.media?.gif_url;
  if (gifCandidate && !rawPhotos.includes(gifCandidate)) {
    rawPhotos = [gifCandidate, ...rawPhotos];
  }
  const photos = rawPhotos;

  const cues = exercise.form_cues || [];
  const primary = exercise.primary_muscles || [];
  const secondary = exercise.secondary_muscles || [];

  const activeSrc = photos[Math.min(activePhotoIdx, Math.max(0, photos.length - 1))] || '';
  const isCurrentGif = activeSrc.toLowerCase().includes('.gif');

  const videoUrl = exercise.video_query
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.video_query)}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent((exercise.display_name || exercise.name) + ' proper form')}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-dark-850 border border-white/[0.1] rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/[0.08] bg-dark-900 flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-volt">
                {exercise.body_group || exercise.category || 'Strength Movement'}
              </span>
              {exercise.is_plan && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-volt text-dark-950 uppercase">
                  90-Day Plan Core
                </span>
              )}
              {exercise.level && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  • {exercise.level}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white font-heading line-clamp-1">
              {exercise.display_name || exercise.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Visual photo / Animated GIF demonstration */}
          {photos.length > 0 ? (
            <div className="space-y-2">
              <div className="w-full h-64 sm:h-72 rounded-2xl bg-black overflow-hidden border border-white/[0.08] relative flex items-center justify-center">
                <img
                  src={activeSrc}
                  alt={exercise.name}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    const fallback = photos.find((p) => p !== activeSrc && !p.toLowerCase().includes('.gif')) || photos[1];
                    if (fallback && e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
                <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-dark-950/85 backdrop-blur-md text-[10px] font-bold text-zinc-200 border border-white/10">
                  <span>
                    {isCurrentGif
                      ? 'Movement Demonstration'
                      : photos.length > 1
                      ? (activePhotoIdx === (photos[0]?.includes('.gif') ? 1 : 0) ? 'Phase 1: Starting Setup' : 'Phase 2: Peak Contraction')
                      : 'Movement Demonstration'}
                  </span>
                </div>
              </div>

              {photos.length > 1 && (
                <div className={`grid gap-2 ${photos.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {photos.map((src, i) => {
                    const isGif = src.toLowerCase().includes('.gif');
                    const label = isGif
                      ? 'Demonstration'
                      : (i === (photos[0]?.includes('.gif') ? 1 : 0) ? 'Phase 1: Setup' : 'Phase 2: Peak');

                    return (
                      <button
                        key={i}
                        onClick={() => setActivePhotoIdx(i)}
                        className={`p-1.5 rounded-xl border text-left flex items-center space-x-2 transition ${
                          activePhotoIdx === i
                            ? 'border-volt bg-volt/10 text-white font-bold ring-1 ring-volt/40'
                            : 'border-white/[0.06] bg-dark-900 text-zinc-400 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0 relative">
                          <img
                            src={src}
                            alt="thumb"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="text-[10px] leading-tight min-w-0">
                          <span className="block font-semibold text-white truncate">
                            {label}
                          </span>
                          <span className="text-[9px] text-zinc-400">Tap to inspect</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-36 rounded-2xl bg-dark-900 border border-white/[0.06] flex flex-col items-center justify-center text-zinc-500 space-y-1">
              <TbBarbell className="w-10 h-10 text-zinc-600" />
              <span className="text-xs text-zinc-400">Visual demonstration available via Video Guide below</span>
            </div>
          )}

          {/* Muscles & Equipment */}
          <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.04]">
              <span className="text-zinc-400 font-bold flex items-center space-x-1">
                <FaDumbbell className="w-3.5 h-3.5 text-zinc-400 inline" />
                <span>Equipment Needed:</span>
              </span>
              <span className="text-white font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10">
                {exercise.equipment || exercise.raw_equipment || 'Bodyweight / Gym Equipment'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                Target Muscles Worked
              </span>
              <div className="flex flex-wrap gap-1.5">
                {primary.map((m, i) => (
                  <span
                    key={`p-${i}`}
                    className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-volt/15 text-volt border border-volt/30 capitalize"
                  >
                    ★ {m}
                  </span>
                ))}
                {secondary.map((m, i) => (
                  <span
                    key={`s-${i}`}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-zinc-300 border border-white/5 capitalize"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Execution Form Cues */}
          {cues.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/[0.06] space-y-2.5">
              <div className="flex items-center space-x-1.5">
                <TbActivity className="w-4 h-4 text-volt" />
                <h4 className="text-xs font-bold text-white font-heading uppercase tracking-wider">
                  Biomechanical Execution Protocol
                </h4>
              </div>
              <ul className="space-y-2">
                {cues.map((cue, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex items-start space-x-2.5 leading-relaxed">
                    <span className="text-volt font-black text-xs mt-0.5 shrink-0">{i + 1}.</span>
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-dark-900 shrink-0">
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-volt text-dark-950 hover:bg-volt-light flex items-center justify-center space-x-2 transition shadow-md shadow-volt/20"
          >
            <span>Watch Form Demonstration on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
