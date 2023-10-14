import C from 'crypto-js';

const generateKeys = () => {
  const k0 = C.lib.WordArray.random(16).toString(C.enc.Hex);
  const k1 = C.lib.WordArray.random(16).toString(C.enc.Hex);
  const k2 = C.lib.WordArray.random(16).toString(C.enc.Hex);

  const data = {
    k0,
    k1,
    k2,
    k3: k1,
    k4: k2,
  };

  return data;
};

module.exports = {
  generateKeys,
};
