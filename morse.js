import {noop, sleep} from "./system.js";
import {playTone} from "./tone.js";

/**
 * Mapping letters to their Morse code sequence with hyphen (-) for dah and period (.) for dit.
 */
export const LETTERS = {
  'A': '.-',
  'B': '-...',
  'C': '-.-.',
  'D': '-..',
  'E': '.',
  'F': '..-.',
  'G': '--.',
  'H': '....',
  'I': '..',
  'J': '.---',
  'K': '-.-',
  'L': '.-..',
  'M': '--',
  'N': '-.',
  'O': '---',
  'P': '.--.',
  'Q': '--.-',
  'R': '.-.',
  'S': '...',
  'T': '-',
  'U': '..-',
  'V': '...-',
  'W': '.--',
  'X': '-..-',
  'Y': '-.--',
  'Z': '--..',

  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',

  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
};

/**
 * Translate the given text into the equivalent morse code sequences.
 *
 * The returned array is a list of Morse dit/dah sequences. Hyphen (-) for dah and period (.) for dit.
 *
 * Example:
 * ```
 * translateMorse('ABC')
 * // returns ['.-', '-...', '-.-.']
 * ```
 *
 * @param {string} text String to translate.
 * @param {string} unknownChar Value to use in the returned array for characters in `text` that do not have an
 *      equivalent morse code sequence.
 * @returns {string[]} Morse code sequence for each character in `text`.
 */
export function translateMorse(text, unknownChar = '') {
  const morse = []

  console.debug('Translating morse', {text, unknownChar});

  for (const ch of text) {
    morse.push(LETTERS[ch] || unknownChar)
  }

  console.info('Translated morse', {text, morse});

  return morse
}

/**
 * Play Morse code tones through the computer speakers.
 *
 * The following transforms are applied to the text:
 * - Characters are switched to upper case
 * - Whitespace is trimmed
 * - All groups of whitespace are replaced with a single space
 *
 * The parameter to the `letterCallback` is an object with this shape:
 * ```
 * {
 *   // Text that is being played (the `text` parameter)
 *   "text": "ABC",
 *
 *   // Array of Morse character strings.
 *   // Each Morse character maps to the character at the same index in `text`.
 *   // Empty string if the character has no equivalent Morse representation.
 *   // Hyphen (-) for dah, period (.) for dit
 *   "morseText": ['.-', '-...', '-.-.'],
 *
 *   // Zero-based index of the letter in `text` and `morseText` that will be played.
 *   // See `char` and `morseChar`.
 *   "charIndex": 0,
 *
 *   // Letter to be played or space if pausing between words.
 *   "char": "A",
 *
 *   // Equivalent morse code for `letter` or empty string if there is no
 *   // equivalent.
 *   // Hyphen (-) for dah, period (.) for dit
 *   "morseChar": ".-",
 *
 *   ""
 * }
 * ```
 *
 * @param {AudioContext} audioContext Audio context instance to play the tones through.
 * @param {AbortSignal} signal Signal to abort the operation.
 * @param {string} text Text to convert to morse and play.
 * @param {number} speed Speed to play the text in words per minute.
 * @param {number} frequency Frequency of oscillation in hertz.
 * @param {number} volume Volume to play the tones at (0-1).
 * @param {function} characterCallback Callback to invoke before each character is played.
 * @returns {Promise<void>} Promise the resolves when the text finishes playing.
 */
export async function playMorseText(
  {
    audioContext,
    signal,
    text,
    speed,
    frequency,
    volume,
    characterCallback = noop,
  }
) {
  // Collapse each group of whitespace into a single space (used as a word separator)
  text = text.toUpperCase().trim().replaceAll(/'\\s+'/g, ' ')

  const morseText = translateMorse(text);

  const millisPerUnit = (60 / (50 * speed)) * 1000;

  const millisPerDit = millisPerUnit;
  const millisPerDah = millisPerUnit * 3;

  const millisPauseInChar = millisPerUnit;
  const millisPauseBetweenChar = millisPerUnit * 3;
  const millisPauseBetweenWords = millisPerUnit * 7;

  console.info('Playing morse tones', {text, morseText, speed, frequency, volume});

  let insideWord = false;

  for (let charIndex = 0; charIndex < text.length; charIndex += 1) {
    const char = text[charIndex];
    const morseChar = morseText[charIndex];

    characterCallback({text, morseText, charIndex, char, morseChar});

    if (char === ' ') {
      insideWord = false;
      console.info('Pausing between words', {millisPauseBetweenWords});
      await sleep(millisPauseBetweenWords, signal);
    } else if (morseChar.length > 0) {
      if (insideWord) {
        console.info('Pausing between characters', {millisPauseBetweenChar});
        await sleep(millisPauseBetweenChar, signal);
      }

      insideWord = true;

      console.info('Playing morse character tones', {charIndex, char, morseChar});

      for (let morseUnitIndex = 0; morseUnitIndex < morseChar.length; morseUnitIndex += 1) {
        const morseUnit = morseChar[morseUnitIndex];

        if (morseUnitIndex > 0) {
          console.info('Pausing between units', {millisPauseInChar});
          await sleep(millisPauseInChar, signal);
        }

        console.info('Playing morse tone', {morseUnit});
        await playTone({
          audioContext,
          signal,
          frequency,
          shape: 'sine',
          millis: morseUnit === '.' ? millisPerDit : millisPerDah,
          volume,
        })
      }
    }
  }

  console.info('Playing morse tones complete');
}