import {AbortError, checkAborted} from "./system.js";

/**
 * Play a tone through the computer speakers.
 *
 * @param {AudioContext} audioContext Audio context instance to play the tones through.
 * @param {AbortSignal} signal Signal to cancel the operation.
 * @param {number} frequency Frequency of oscillation in hertz.
 * @param {OscillatorType} shape Shape of the waveform (except for "custom").
 * @param {number} millis Number of milliseconds to play the tone.
 * @param {number} volume Volume to play the tone at (0-1).
 * @returns {Promise<void>} Promise that resolves when the tone finished playing.
 */
export async function playTone(
  {
    audioContext,
    signal,
    frequency,
    shape,
    millis,
    volume,
  }
) {
  await checkAborted(signal);

  const seconds = millis / 1000;

  console.info('Playing tone', {frequency, shape, seconds, volume});

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.frequency.value = frequency;
  oscillator.type = shape;
  oscillator.connect(gain);

  gain.gain.value = volume;
  gain.connect(audioContext.destination);

  return new Promise((resolve, reject) => {
    const abort = () => {
      oscillator.stop();
    };

    signal.addEventListener('abort', abort);

    oscillator.onended = () => {
      signal.removeEventListener('abort', abort);

      if (signal.aborted) {
        reject(new AbortError(signal.reason));
      } else {
        console.debug('Tone play ended');
        resolve();
      }
    };

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + seconds);
  });
}