import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_START_KEY = 'trial_start_date';
const TRIAL_DURATION_DAYS = 14;

export function useTrial() {
  const [trialState, setTrialState] = useState({
    isLoading: true,
    trialStartDate: null,
    isTrialActive: false,
    daysRemaining: 0,
    hasStartedTrial: false,
  });

  useEffect(() => {
    loadTrialStatus();
  }, []);

  const loadTrialStatus = useCallback(async () => {
    try {
      const startDateStr = await AsyncStorage.getItem(TRIAL_START_KEY);
      
      if (!startDateStr) {
        // Trial hasn't started yet
        setTrialState({
          isLoading: false,
          trialStartDate: null,
          isTrialActive: false,
          daysRemaining: TRIAL_DURATION_DAYS,
          hasStartedTrial: false,
        });
        return;
      }

      const startDate = new Date(startDateStr);
      const now = new Date();
      const diffTime = now.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - diffDays);
      const isTrialActive = daysRemaining > 0;

      setTrialState({
        isLoading: false,
        trialStartDate: startDate,
        isTrialActive,
        daysRemaining,
        hasStartedTrial: true,
      });
    } catch (error) {
      setTrialState({
        isLoading: false,
        trialStartDate: null,
        isTrialActive: false,
        daysRemaining: 0,
        hasStartedTrial: false,
      });
    }
  }, []);

  const startTrial = useCallback(async () => {
    try {
      const now = new Date();
      await AsyncStorage.setItem(TRIAL_START_KEY, now.toISOString());
      
      setTrialState({
        isLoading: false,
        trialStartDate: now,
        isTrialActive: true,
        daysRemaining: TRIAL_DURATION_DAYS,
        hasStartedTrial: true,
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const getTrialStatusText = useCallback(() => {
    if (!trialState.hasStartedTrial) {
      return `${TRIAL_DURATION_DAYS}-Day Free Trial`;
    }
    if (trialState.isTrialActive) {
      return `${trialState.daysRemaining} day${trialState.daysRemaining !== 1 ? 's' : ''} left in trial`;
    }
    return 'Trial expired';
  }, [trialState]);

  return {
    ...trialState,
    startTrial,
    getTrialStatusText,
    refreshTrialStatus: loadTrialStatus,
  };
}

export function isTrialActiveSync() {
  // Helper for checking trial status outside of hooks
  // Returns a promise that resolves to boolean
  return AsyncStorage.getItem(TRIAL_START_KEY).then(startDateStr => {
    if (!startDateStr) return false;
    const startDate = new Date(startDateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < TRIAL_DURATION_DAYS;
  }).catch(() => false);
}
