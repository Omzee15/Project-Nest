import { useEffect, useRef, useState, useCallback } from 'react';
import { useDebounce } from './use-debounce';

export interface AutoSaveOptions {
  delay?: number; // Debounce delay in milliseconds (default: 2000)
  enabled?: boolean; // Whether auto-save is enabled (default: true)
  onSave?: () => void; // Callback when save is triggered
  onSaveStart?: () => void; // Callback when saving starts
  onSaveSuccess?: () => void; // Callback when save succeeds
  onSaveError?: (error: any) => void; // Callback when save fails
}

export interface AutoSaveState {
  isDirty: boolean; // Whether content has changed
  isSaving: boolean; // Whether save is in progress
  lastSaved: Date | null; // Last successful save timestamp
  hasUnsavedChanges: boolean; // Whether there are unsaved changes
}

/**
 * Custom hook for auto-saving content with debouncing
 */
export function useAutoSave(
  content: string,
  saveFunction: (content: string) => Promise<void>,
  options: AutoSaveOptions = {}
) {
  const {
    delay = 2000,
    enabled = true,
    onSave,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
  });

  const initialContentRef = useRef<string | null>(null);
  const lastSavedContentRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the initial content reference
  useEffect(() => {
    if (initialContentRef.current === null) {
      initialContentRef.current = content;
      lastSavedContentRef.current = content;
    }
  }, []);

  // Check if content is dirty (changed from last saved)
  const isDirty = content !== lastSavedContentRef.current;
  const hasUnsavedChanges = content !== initialContentRef.current && isDirty;

  // Update state when content changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isDirty,
      hasUnsavedChanges,
    }));
  }, [isDirty, hasUnsavedChanges]);

  // Auto-save function
  const performSave = useCallback(async () => {
    if (!enabled || !isDirty || state.isSaving) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isSaving: true }));
      onSaveStart?.();
      onSave?.();

      await saveFunction(content);

      // Update refs and state on successful save
      lastSavedContentRef.current = content;
      setState(prev => ({  
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        isDirty: false,
        hasUnsavedChanges: content !== initialContentRef.current,
      }));

      onSaveSuccess?.();
    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false }));
      onSaveError?.(error);
    }
  }, [content, enabled, isDirty, state.isSaving, saveFunction, onSave, onSaveStart, onSaveSuccess, onSaveError]);

  // Debounced auto-save
  useDebounce(
    performSave,
    delay,
    [content, enabled, isDirty]
  );

  // Manual save function
  const save = useCallback(async () => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    await performSave();
  }, [performSave]);

  // Reset function to mark content as saved and not dirty
  const markAsSaved = useCallback(() => {
    lastSavedContentRef.current = content;
    initialContentRef.current = content;
    setState(prev => ({
      ...prev,
      isDirty: false,
      hasUnsavedChanges: false,
      lastSaved: new Date(),
    }));
  }, [content]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    save,
    markAsSaved,
  };
}