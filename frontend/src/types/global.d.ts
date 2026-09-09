export {};

declare global {
  interface Window {
    _alertDebounce?: NodeJS.Timeout;
    _alertDebounce2?: NodeJS.Timeout;
  }
}