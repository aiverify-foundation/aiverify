function silentConsoleLogs() {
  jest.spyOn(console, 'log').mockImplementation(jest.fn());
  jest.spyOn(console, 'debug').mockImplementation(jest.fn());
  jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  jest.spyOn(console, 'error').mockImplementation(jest.fn());
}

function mockDomMatrix() {
  global.DOMMatrixReadOnly = jest.fn(() => ({
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 194,
    f: 120,
    m11: 1,
    m12: 0,
    m13: 0,
    m14: 0,
    m21: 0,
    m22: 1,
    m23: 0,
    m24: 0,
    m31: 0,
    m32: 0,
    m33: 1,
    m34: 0,
    m41: 194,
    m42: 120,
    m43: 0,
    m44: 1,
    is2D: true,
    isIdentity: false,
  })) as any;

  global.getComputedStyle = jest.fn(() => ({
    getPropertyValue: jest.fn(),
  })) as jest.Mock;
}
export { silentConsoleLogs, mockDomMatrix };
