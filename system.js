/**
 * Async sleep method.
 *
 * @param {number} millis Number of milliseconds to sleep.
 * @param {AbortSignal} signal Signal to abort the operation.
 * @return A promise that resolves after `millis` milliseconds elapses.
 */
export async function sleep(millis, signal) {
  await checkAborted(signal);

  return new Promise((resolve, reject) => {
    const resolveTimeout = () => {
      signal.removeEventListener('abort', resolveTimeout);
      clearTimeout(timeoutId);

      if (signal.aborted) {
        reject(new AbortError(signal.reason));
      } else {
        resolve();
      }
    };

    const timeoutId = setTimeout(resolveTimeout, millis);
    signal.addEventListener('abort', resolveTimeout);
  });
}

/**
 * Function that does nothing, ignores all parameters, and returns nothing.
 */
export function noop() {
  // Do nothing
}

/**
 * Return a random element from an array.
 *
 * @param {Array} array Array to return an element from.
 * @returns {*} Random element from `array`.
 */
export function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Return a random character from a string.
 *
 * @param {string} str String to return a random character from.
 * @returns {string} Random character from `str`.
 */
export function randomChar(str) {
  return str.charAt(Math.floor(Math.random() * str.length));
}

/**
 * Enable/disable all elements in a form.
 *
 * @param {HTMLFormElement} form Form to enable/disable.
 * @param {boolean} enabled True to enable, false to disable.
 */
export function enableForm(form, enabled) {
  for (const el of form.elements) {
    el.disabled = !enabled;
  }
}

export class AbortError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AbortError';
  }
}

export async function checkAborted(signal) {
  if (signal.aborted) {
    return Promise.reject(new AbortError(signal.reason));
  } else {
    return Promise.resolve();
  }
}