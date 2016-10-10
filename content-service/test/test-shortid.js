const shortId = require('../server/utils/shortid');
const assert = require('assert');

describe('short id generator', () => {
  // base10: base65
  const tests = {
    10: 'a',
    11: 'b',
    65: '10',
    66: '11'
  };

  describe('numToShortId(num)', () => {
    it('should create a short id for the given number', () => {
      Object.keys(tests).forEach((key) => {
        assert.equal(shortId.numToShortId(key), tests[key]);
      })
    });
  });

  describe('shortIdToNum(num)', () => {
    it('should create a number from a short id', () => {
      Object.keys(tests).forEach((key) => {
        assert.equal(shortId.shortIdToNum(tests[key]), key);
      })
    });
  });
});
