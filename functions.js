/**
 * Mapping letters to their Morse code sequence with hyphen (-) and period (.).
 */
const LETTERS = {
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
 * Async sleep method.
 */
const sleep = async (durationMillis) => new Promise(resolve => setTimeout(resolve, durationMillis));

/**
 * Play a tone on the speakers.
 *
 * @param audioContext Browser [AudioContext] to play the tone with.
 * @param frequencyHz Tone frequency (int).
 * @param durationSecs Duration the tone should play (float).
 * @param volume Tone volume (int, 0-100).
 * @returns Promise that completes when the tone stops playing.
 */
const playTone = async (audioContext, frequencyHz, durationSecs, volume) => {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.frequency.value = frequencyHz;
  oscillator.type = 'sine';
  oscillator.connect(gain);

  gain.gain.value = volume;
  gain.connect(audioContext.destination);
 
  return new Promise(resolve => {
    oscillator.onended = resolve;
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + durationSecs);
  });
};

/**
 * Map the values of an object to different values.
 *
 * @param obj Object to map the values of.
 * @param mapper Function that accepts the value and key and returns a different value: `(value, key) => newValue`
 * @returns New object with the keys mapped to different values.
 */
const mapValues = (obj, mapper) => {
  const output = {};
  for (const [key, value] of Object.entries(obj)) {
    output[key] = mapper(value, key);
  }
  return output;
}

/**
 * Add a separator between each item in a list.
 * @returns Copy of the input list with [separator] between each element
 */
const zipSeparator = (list, separator) => list.flatMap((entry) => [entry, separator]).slice(0, -1);

/**
 * Invoke a list of async methods in order.
 * @returns Promise that completes when all the actions have completed or an action fails.
 */
const executeActions = async (actions) => {
  for (const action of actions) {
    await action();
  }
};

/**
 * Async method that does nothing.
 */
const noop = async () => Promise.resolve();

class MorseCode {
  #wordsPerMinute;
  #audioContext;
  #letters;
  #pauseBetweenChars;
  #pauseBetweenWords;

  constructor({ wordsPerMinute = 5, frequencyHz = 750, volume = 1.0 } = {}) {
    this.frequencyHz = frequencyHz;
    this.volume = volume;
    this.wordsPerMinute = wordsPerMinute;
  }

  set wordsPerMinute(value) {
    this.#wordsPerMinute = value;

    const secsPerUnit = 60 / (50 * this.#wordsPerMinute);
    const msPerUnit = secsPerUnit * 1000;

    const secsPerDit = secsPerUnit;
    const secsPerDah = secsPerUnit * 3;

    const msInChar = msPerUnit;
    const msBetweenChar = msPerUnit * 3;
    const msBetweenWords = msPerUnit * 7;

    const playMorseTone = async (durationSecs) => {
      // AudioContext can only be constructed as the result of a user action
      if (!this.#audioContext) {
        this.#audioContext = new AudioContext();
      }

      return playTone(this.#audioContext, this.frequencyHz, durationSecs, this.volume);
    }

    const tones = {
      '.': async () => playMorseTone(secsPerDit),
      '-': async () => playMorseTone(secsPerDah),
    };
  
    const pauseInChar = async () => sleep(msInChar);

    this.#pauseBetweenChars = async() => sleep(msBetweenChar);
    this.#pauseBetweenWords = async() => sleep(msBetweenWords);

    this.#letters = mapValues(LETTERS, (pattern) => {
      const parts = zipSeparator(pattern.split('').map((c) => tones[c]), pauseInChar);

      return async () => executeActions(parts);
    });
  }

  get wordsPerMinute() {
    return this.#wordsPerMinute;
  }

  async play(text) {
    return executeActions(
      zipSeparator(
        text.toUpperCase().split(/\s+/).map((word) => async () => {
          console.log(`Playing word: ${word}`);
          await this._playWord(word);
        }),
        this.#pauseBetweenWords,
      )
    );
  }


  async _playWord(word) {
    return executeActions(
      zipSeparator(
        word.split('').map((letter) => async () => {
          console.log(`Playing letter: ${letter}`);
          await (this.#letters[letter] || noop)();
        }),
        this.#pauseBetweenChars,
      )
    );
  }
}
