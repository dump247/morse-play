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

const sleep = async (durationMillis) => {
  return new Promise(resolve => setTimeout(resolve, durationMillis));
};

const playTone = async (audioContext, frequencyHz, durationSecs, volume) => {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.frequency.value = frequencyHz;
  oscillator.type = 'square';
  oscillator.connect(gain);

  gain.gain.value = volume;
  gain.connect(audioContext.destination);
 
  return new Promise(resolve => {
    oscillator.onended = resolve;
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + durationSecs);
  });
};

const mapValues = (obj, mapper) => {
  const output = {};
  for (const [key, value] of Object.entries(obj)) {
    output[key] = mapper(value);
  }
  return output;
}

const zip = (list, separator) => {
  return list.flatMap((entry) => [entry, separator]).slice(0, -1);
};

const awaitList = async (list) => {
  for (const action of list) {
    await action();
  }
};

const noop = async () => {
  return Promise.resolve();
};

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
      const parts = zip(pattern.split('').map((c) => tones[c]), pauseInChar);

      return async () => awaitList(parts);
    });
  }

  get wordsPerMinute() {
    return this.#wordsPerMinute;
  }

  async play(text) {
    return awaitList(
      zip(
        text.toUpperCase().split(/\s+/).map((word) => async () => {
          console.log(`Playing word: ${word}`);
          await this._playWord(word);
        }),
        this.#pauseBetweenWords,
      )
    );
  }


  async _playWord(word) {
    return awaitList(
      zip(
        word.split('').map((letter) => async () => {
          console.log(`Playing letter: ${letter}`);
          await (this.#letters[letter] || noop)();
        }),
        this.#pauseBetweenChars,
      )
    );
  }
}