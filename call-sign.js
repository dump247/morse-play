import {randomChar, randomElement} from "./system.js";

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '1234567890';

/**
 * Morse call sign formats with an associated weight to determine how often they are generated.
 *
 * The weight determines how often call signs at that weight are generated.
 * Example: if format set A has weight 10 and B has weight 1, A is generated ten times for every one B.
 *
 * The formats use N for number, L for letter, and hyphen ('/') is output literally.
 *
 * THE FORMATS MUST BE SORTED ASCENDING BY WEIGHT!
 *
 * @type {{formats: string[], weight: number, sum: number}[]}
 */
const FORMATS = [
  {
    weight: 5,
    formats: [
      'LNNL',
      'NL/LNLL',
      'NL/LLNLL',
      'NL/LLNLLL',
      'LLN/LNLL',
      'LLN/LLNL',
      'LLN/LLNLL',
      'LLN/LLNLLL',
      'LL/LLNL',
      'LL/LLNLL',
      'LLNNLLL',
    ]
  },
  {
    weight: 10,
    formats: [
      'NLNL',
      'NLNLL',
      'NLNLLL',
    ]
  },
  {
    weight: 85,
    formats: [
      'LNL',
      'LNLL',
      'LNLLL',
      'LLNL',
      'LLNL',
      'LLNLL',
      'LLNLLL',
    ]
  },
];
const FORMAT_RANGE = FORMATS.reduce(
  (total, format) => {
    format.sum = total + format.weight;
    return format.sum;
  },
  0,
) + 1;

/**
 * Generate a ham call sign.
 *
 * The formats use N for number, L for letter, and hyphen ('/') is output literally.
 * Any other characters result in an `Error` being thrown.
 *
 * @param {string} format Call sign format string.
 * @returns {string} Generated call sign.
 */
export function formatCallSign(format) {
  let result = '';

  for (let ch of format) {
    switch (ch) {
      case 'L':
        result += randomChar(LETTERS);
        break;

      case 'N':
        result += randomChar(NUMBERS);
        break;

      case '/':
        result += ch;
        break;

      default:
        throw Error(`Unknown call sign format char: ${ch}`);
    }
  }

  console.info('Formatted call sign', {format, result});

  return result;
}

/**
 * Generate a random ham call sign.
 *
 * @see FORMATS
 * @return {string} Random ham call sign.
 */
export function randomCallSign() {
  const next = Math.random() * FORMAT_RANGE;
  const formats = FORMATS.find(({sum}) => next <= sum).formats;
  const format = randomElement(formats);

  console.info('Generating call sign', {next, format, formats});

  return formatCallSign(format);
}