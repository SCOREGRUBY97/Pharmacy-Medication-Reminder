// Simple toast utility — call from anywhere
let toastFn = null;
export const setToastFn = (fn) => { toastFn = fn; };
export const toast = {
  success: (msg) => toastFn && toastFn({ msg, type: 'success' }),
  error:   (msg) => toastFn && toastFn({ msg, type: 'error' }),
  info:    (msg) => toastFn && toastFn({ msg, type: 'info' }),
  warn:    (msg) => toastFn && toastFn({ msg, type: 'warn' }),
};
