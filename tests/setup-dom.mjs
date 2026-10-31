// Must execute before react-dom detects browser event support.
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
const keys = ['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'IS_REACT_ACT_ENVIRONMENT'];
const descriptors = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
for (const key of keys) Object.defineProperty(globalThis, key, { configurable: true, writable: true,
  value: key === 'IS_REACT_ACT_ENVIRONMENT' ? true : dom.window[key] });
export function restoreDOM() {
  dom.window.close();
  for (const key of keys) {
    const descriptor = descriptors.get(key);
    if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
  }
}
