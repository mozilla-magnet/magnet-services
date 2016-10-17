
const codes = {
  23505: 'UNIQUE_VIOLATION'
};

// Generate name->code mapping from codes.
const names = Object.keys(codes).reduce((obj, code) => {
  obj[codes[code]] = Number(code);
  return obj;
}, {});

module.exports = {
  codes,
  names
};

