export const createClient = jest.fn().mockReturnValue({ 
  on: jest.fn(),
  connect: jest.fn(), 
  xAdd: jest.fn(),
  hSet: jest.fn(),
  pSubscribe: jest.fn(),
});

