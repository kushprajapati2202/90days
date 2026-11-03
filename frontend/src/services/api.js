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
      let detail = `Error ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) detail = errJson.detail;
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
    return request('/weight/history');
  },

  async logWeight(weightKg, notes = '', date = null) {
    return request('/weight', {
      method: 'POST',
      body: JSON.stringify({
        weight_kg: Number(weightKg),
        notes,
        date: date || new Date().toISOString().split('T')[0],
      }),
    });
  },

  async deleteWeightLog(logId) {
    return request(`/weight/${logId}`, {
      method: 'DELETE',
    });
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
