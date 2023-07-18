function silentConsoleLogs() {
  jest.spyOn(console, 'log').mockImplementation(jest.fn());
  jest.spyOn(console, 'debug').mockImplementation(jest.fn());
  jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  jest.spyOn(console, 'error').mockImplementation(jest.fn());
}

export { silentConsoleLogs };
