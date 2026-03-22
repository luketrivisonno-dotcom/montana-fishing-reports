// Trial Manager - Handles 10-day free trial logic
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_START_KEY = '@trial_start_date';
const HAS_TRIAL_STARTED_KEY = '@has_trial_started';
const TRIAL_DURATION_DAYS = 10;

/**
 * Start a new 10-day trial
 */
export const startTrial = async () => {
  const now = new Date().toISOString();
  await AsyncStorage.setItem(TRIAL_START_KEY, now);
  await AsyncStorage.setItem(HAS_TRIAL_STARTED_KEY, 'true');
};

/**
 * Check if a trial has ever been started
 */
export const hasTrialStarted = async () => {
  const hasStarted = await AsyncStorage.getItem(HAS_TRIAL_STARTED_KEY);
  return hasStarted === 'true';
};

/**
 * Check if trial is currently active (within 10 days)
 */
export const isTrialActive = async () => {
  const startDateStr = await AsyncStorage.getItem(TRIAL_START_KEY);
  if (!startDateStr) return false;
  
  const startDate = new Date(startDateStr);
  const now = new Date();
  const diffTime = now - startDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  return diffDays <= TRIAL_DURATION_DAYS;
};

/**
 * Get days remaining in trial
 */
export const getTrialDaysRemaining = async () => {
  const startDateStr = await AsyncStorage.getItem(TRIAL_START_KEY);
  if (!startDateStr) return 0;
  
  const startDate = new Date(startDateStr);
  const now = new Date();
  const diffTime = now - startDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  return Math.max(0, Math.ceil(TRIAL_DURATION_DAYS - diffDays));
};

/**
 * Get trial start date
 */
export const getTrialStartDate = async () => {
  const startDateStr = await AsyncStorage.getItem(TRIAL_START_KEY);
  return startDateStr ? new Date(startDateStr) : null;
};

/**
 * Get trial end date
 */
export const getTrialEndDate = async () => {
  const startDateStr = await AsyncStorage.getItem(TRIAL_START_KEY);
  if (!startDateStr) return null;
  
  const startDate = new Date(startDateStr);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS);
  return endDate;
};

/**
 * Reset trial (for testing purposes)
 */
export const resetTrial = async () => {
  await AsyncStorage.removeItem(TRIAL_START_KEY);
  await AsyncStorage.removeItem(HAS_TRIAL_STARTED_KEY);
};

/**
 * Check if a premium feature is available (either in trial or subscribed)
 * @param {boolean} isSubscribed - Whether user has active subscription
 */
export const isPremiumFeatureAvailable = async (isSubscribed = false) => {
  if (isSubscribed) return true;
  return await isTrialActive();
};

/**
 * Get complete trial status object
 */
export const getTrialStatus = async () => {
  const [isActive, daysRemaining, hasStarted, startDate, endDate] = await Promise.all([
    isTrialActive(),
    getTrialDaysRemaining(),
    hasTrialStarted(),
    getTrialStartDate(),
    getTrialEndDate(),
  ]);
  
  return {
    isActive,
    daysRemaining,
    hasStarted,
    startDate,
    endDate,
  };
};
