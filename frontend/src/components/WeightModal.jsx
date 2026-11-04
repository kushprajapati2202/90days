import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, Sun, Moon } from 'lucide-react';
import { FaWeightScale } from 'react-icons/fa6';
import { api } from '../services/api';
import { getIndianTodayIsoDate, getAutoTimeOfDay } from '../utils/timeFormat';

export default function WeightModal({ isOpen, onClose, currentWeight, onWeightLogged }) {
  if (!isOpen) return null;

  const [weight, setWeight] = useState(currentWeight || '');
  const [date, setDate] = useState(getIndianTodayIsoDate());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const autoTimeOfDay = getAutoTimeOfDay();

  // Escape key dismiss listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weight) return;
    setIsSubmitting(true);
    setError('');

    try {
      await api.logWeight(weight, notes, date, autoTimeOfDay);
      if (onWeightLogged) onWeightLogged();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save weight record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="weight-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm bg-dark-850 border border-white/[0.1] rounded-3xl p-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-volt/10 text-volt flex items-center justify-center">
              <FaWeightScale className="w-4 h-4 text-volt" />
            </div>
            <h3 id="weight-modal-title" className="text-sm font-bold text-white font-heading">Log Body Weight</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Weight (kg)</label>
            <div className="relative">
              <input
                type="number"
                step="0.05"
                required
                value={weight === 0 || weight === '0' ? '' : weight}
                onChange={(e) => setWeight(e.target.value)}
                onFocus={(e) => {
                  if (e.target.value === '0' || e.target.value === '0.0') {
                    setWeight('');
                  } else {
                    e.target.select();
                  }
                }}
                placeholder="91.5"
                className="w-full bg-dark-900 border border-white/10 rounded-xl pl-3 pr-8 py-3 text-base font-mono font-bold text-white focus:outline-none focus:border-volt"
              />
              <span className="absolute right-3.5 top-3.5 text-xs text-zinc-500 font-bold">kg</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Timing</label>
            <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-dark-900 border border-white/10 text-xs">
              {autoTimeOfDay === 'morning' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-300">Morning Weigh-In</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-indigo-300">Evening Weigh-In</span>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-volt"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fasting, post-workout, good sleep"
              className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-volt"
            />
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 rounded-xl text-xs font-bold bg-dark-900 hover:bg-white/5 text-zinc-300 border border-white/10 transition min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 py-3 rounded-xl text-xs font-black bg-volt text-dark-950 hover:bg-[#b8e600] active:scale-95 transition disabled:opacity-50 shadow-lg shadow-volt/20 min-h-[44px]"
            >
              {isSubmitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
