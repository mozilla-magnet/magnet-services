const BASE65_DICT = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_~';
const base65From10 = createBase10ToN(BASE65_DICT);
const base10From65 = createBaseNTo10(BASE65_DICT);

// Create a function that can convert a base10 number to the base of the
// dictionary length
function createBase10ToN(dictionary) {
  const dictLength = dictionary.length;

  return function(num) {
    let r = num % dictLength;
    let builder = dictionary.charAt(r);
    let q = Math.floor(num / dictLength);

    while(q) {
      r = q % dictLength;
      q = Math.floor(q / dictLength);
      builder = dictionary.charAt(r) + builder;
    }

    return builder;
  };
}

function createBaseNTo10(dictionary) {
  const dictLength = dictionary.length;
  return function(num) {
    let _num = String(num + '');
    let length = _num.length;
    let builder = 0;
    for (let charIndex = 0; charIndex < length; charIndex++) {
      builder = dictLength * builder + dictionary.indexOf(_num.charAt(charIndex));
    }
    return builder;
  };
}

module.exports = {
  numToShortId: base65From10,
  shortIdToNum: base10From65,
};
