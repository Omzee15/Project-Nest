import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://localhost:${import.meta.env.VITE_BACKEND_PORT || '8080'}/api`;

export interface UserSettings {
  settings_uid?: string;
  theme: string;
  language: string;
  timezone: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  sound_enabled: boolean;
  compact_mode: boolean;
  auto_save: boolean;
  auto_save_interval: number;
  created_at?: string;
  updated_at?: string;
}

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'projectnest-default',
  language: 'en',
  timezone: 'UTC',
  notifications_enabled: true,
  email_notifications: true,
  sound_enabled: true,
  compact_mode: false,
  auto_save: true,
  auto_save_interval: 30,
};

export const useUserSettings = (): UseUserSettingsReturn => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/settings`, { headers });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setSettings(data.data);
      } else {
        // Use default settings if no settings found
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
      console.error('Error fetching settings:', err);
      
      // Use default settings on error
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    try {
      setError(null);

      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update settings: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setSettings(data.data);
        return true;
      }

      throw new Error('Invalid response from server');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      console.error('Error updating settings:', err);
      return false;
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/settings/reset`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to reset settings: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setSettings(data.data);
        return true;
      }

      throw new Error('Invalid response from server');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings';
      setError(errorMessage);
      console.error('Error resetting settings:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetToDefaults,
    refreshSettings,
  };
};