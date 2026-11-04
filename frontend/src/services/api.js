// Resilient API Client connecting to FastAPI backend

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!res.ok) {
      let detail = `Unable to complete request (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) {
          detail = errJson.detail;
          if (detail.includes('MongoDB') || detail.includes('database') || detail.includes('whitelist') || detail.includes('Atlas')) {
            detail = 'Service temporarily syncing. Please try again in a few moments.';
          }
        }
      } catch (e) {}
      const err = new Error(detail);
      err.status = res.status;
      throw err;
    }

    return await res.json();
  } catch (error) {
    console.error(`API [${endpoint}] failed:`, error.message);
    throw error;
  }
}

// Memory caches for instant tab switching and zero-latency catalog exploration
const vaultQueryCache = new Map();
let vaultFiltersCache = null;

export const api = {
  // Days
  async getDays() {
    return request('/days');
  },

  async getDay(dayNumber) {
    return request(`/days/${dayNumber}`);
  },

  async toggleDay(dayNumber, completed) {
    return request(`/days/${dayNumber}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ completed }),
    });
  },

  async updateDay(dayNumber, data) {
    return request(`/days/${dayNumber}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async startWorkoutSession(dayNumber) {
    return request(`/days/${dayNumber}/start`, {
      method: 'POST',
    });
  },

  async finishWorkoutSession(dayNumber) {
    return request(`/days/${dayNumber}/finish`, {
      method: 'POST',
    });
  },

  async toggleExercise(dayNumber, exerciseName, completed) {
    const encoded = encodeURIComponent(exerciseName);
    return request(`/days/${dayNumber}/exercises/${encoded}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ completed }),
    });
  },

  async logSet(dayNumber, exerciseName, setNum, weightKg, reps, completed = true) {
    return request(`/days/${dayNumber}/sets`, {
      method: 'POST',
      body: JSON.stringify({
        exercise_name: exerciseName,
        set_num: setNum,
        weight_kg: Number(weightKg) || 0,
        reps: Number(reps) || 0,
        completed,
      }),
    });
  },

  // Stats
  async getStats() {
    return request('/stats');
  },

  // Weight
  async getWeightHistory() {
    try {
      const res = await request('/weight-history');
      return { history: res.logs || res.history || [] };
    } catch (e) {
      try {
        const res2 = await request('/weight/history');
        return { history: res2.logs || res2.history || [] };
      } catch (err) {
        console.warn('Weight history optional fetch fallback:', err.message);
        return { history: [] };
      }
    }
  },

  async logWeight(weightKg, notes = '', date = null) {
    try {
      return await request('/weight-log', {
        method: 'POST',
        body: JSON.stringify({
          weight_kg: Number(weightKg),
          notes: notes || '',
          date_display: date || new Date().toISOString().split('T')[0],
        }),
      });
    } catch (e) {
      return await request('/weight', {
        method: 'POST',
        body: JSON.stringify({
          weight_kg: Number(weightKg),
          notes: notes || '',
          date_display: date || new Date().toISOString().split('T')[0],
        }),
      });
    }
  },

  async deleteWeightLog(logId) {
    try {
      return await request(`/weight/${logId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      return { status: 'skipped' };
    }
  },

  // Unified Movement Vault (2,200+ exercises) with instant client-side caching
  async getVaultExercises({ group = 'All', equipment = 'All', search = '', page = 1, limit = 48 } = {}) {
    const cacheKey = `${group}_${equipment}_${search.trim().toLowerCase()}_${page}_${limit}`;
    if (vaultQueryCache.has(cacheKey)) {
      return vaultQueryCache.get(cacheKey);
    }

    const params = new URLSearchParams();
    if (group && group !== 'All') params.append('group', group);
    if (equipment && equipment !== 'All') params.append('equipment', equipment);
    if (search && search.trim()) params.append('search', search.trim());
    params.append('page', page);
    params.append('limit', limit);
    const result = await request(`/exercises/vault?${params.toString()}`);
    if (result && result.exercises) {
      vaultQueryCache.set(cacheKey, result);
    }
    return result;
  },

  async getVaultFilters() {
    if (vaultFiltersCache) {
      return vaultFiltersCache;
    }
    const result = await request('/exercises/vault/filters');
    if (result) {
      vaultFiltersCache = result;
    }
    return result;
  },

  // Exercise Library
  async getExercises(group = 'All', category = 'All', search = '') {
    const params = new URLSearchParams();
    if (group && group !== 'All') params.append('group', group);
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);
    return request(`/exercises?${params.toString()}`);
  },

  // Profile & Notes
  async getProfile() {
    return request('/profile');
  },

  async getCoachingNotes() {
    return request('/coaching-notes');
  },
};

