import { useState, useEffect, useCallback } from 'react';
import { medicationAPI, reminderAPI, dashboardAPI, caregiverAPI } from '../services/api';

// ─── Generic fetch hook ───────────────────────────────────────
const useFetch = (apiFn, deps = []) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn();
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};

// ─── Dashboard Hook ───────────────────────────────────────────
export const useDashboard = () => useFetch(dashboardAPI.get);

// ─── Medications Hook ─────────────────────────────────────────
export const useMedications = () => {
  const { data, loading, error, refetch } = useFetch(medicationAPI.getAll);

  const add = async (formData) => {
    await medicationAPI.add(formData);
    refetch();
  };
  const update = async (id, formData) => {
    await medicationAPI.update(id, formData);
    refetch();
  };
  const remove = async (id) => {
    await medicationAPI.delete(id);
    refetch();
  };

  return { medications: data || [], loading, error, add, update, remove, refetch };
};

// ─── Reminders Hook ───────────────────────────────────────────
export const useReminders = () => {
  const { data, loading, error, refetch } = useFetch(reminderAPI.getToday);

  const markStatus = async (id, status, notes) => {
    await reminderAPI.updateStatus(id, { status, notes });
    refetch();
  };

  return { reminders: data || [], loading, error, markStatus, refetch };
};

// ─── Adherence Hook ───────────────────────────────────────────
export const useAdherence = (days = 7) =>
  useFetch(() => reminderAPI.getAdherence({ days }), [days]);

// ─── Caregivers Hook ──────────────────────────────────────────
export const useCaregivers = () => {
  const { data, loading, error, refetch } = useFetch(caregiverAPI.getMyCaregivers);

  const link = async (formData) => {
    await caregiverAPI.link(formData);
    refetch();
  };
  const remove = async (id) => {
    await caregiverAPI.remove(id);
    refetch();
  };

  return { caregivers: data || [], loading, error, link, remove, refetch };
};
