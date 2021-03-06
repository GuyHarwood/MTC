import { Injectable } from '@angular/core';

export type StorageKey = 'answers' | 'inputs' | 'session' |
  'audit' | 'questions' | 'config' | 'pupil' | 'school' | 'access_token' |
  'feedback' | 'checkstate' | 'device' | 'pending_submission' | 'completed_submission' |
  'access_arrangements' | 'tokens' | 'time_out' | 'check_start_time';

@Injectable()
export class StorageService {

  setItem(key: StorageKey, value: Object | Array<Object>): void {

    if (!key) {
      throw new Error('key is required');
    }
    localStorage.setItem(key, JSON.stringify(value));
  }

  getItem(key: StorageKey): any {
    if (!key) {
      throw new Error('key is required');
    }
    let item = localStorage.getItem(key);
    // try/catch as not all localstorage items are JSON, e.g. ai_session
    try {
      item = JSON.parse(item);
    } catch (_) { }
    return item;
  }

  removeItem(key: StorageKey): void {
    if (!key) {
      throw new Error('key is required');
    }
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

  getKeys(): string[] {
    return Object.keys(localStorage);
  }

  getAllItems(): any {
    return Object.keys(localStorage).reduce((obj, key) => {
      let item = localStorage.getItem(key);
      // try/catch as not all localstorage items are JSON, e.g. ai_session
      try {
        item = JSON.parse(item);
      } catch (_) { }
      obj[key] = item;
      return obj;
    }, {});
  }
}
