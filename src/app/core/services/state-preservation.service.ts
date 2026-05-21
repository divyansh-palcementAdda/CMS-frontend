import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StatePreservationService {
  saveState(key: string, state: any): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to sessionStorage', e);
    }
  }

  getState<T>(key: string): T | null {
    try {
      const data = sessionStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (e) {
      console.error('Failed to parse state from sessionStorage', e);
      return null;
    }
  }

  clearState(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to clear state from sessionStorage', e);
    }
  }
}
