import type { LeadInfo } from "../types/leads.types";

export const LEAD_INFO_STORAGE_KEY = "LeadInfo";
export const MACHINE_STUDY_INFO_STORAGE_KEY = "MachineStudyInfo";

export const getStoredLeadInfo = (): LeadInfo | null => {
  try {
    const stored = localStorage.getItem(LEAD_INFO_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const getStoredMachineStudyInfo = (): LeadInfo | null => {
  try {
    const stored = localStorage.getItem(MACHINE_STUDY_INFO_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const setStoredLeadInfo = (leadInfo: LeadInfo) => {
  localStorage.setItem(LEAD_INFO_STORAGE_KEY, JSON.stringify(leadInfo));
};
