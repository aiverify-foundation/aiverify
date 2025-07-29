import { redirectRoute } from '@/lib/actions/redirectRoute';
import Home from '../page';

// Mock the redirectRoute function
jest.mock('@/lib/actions/redirectRoute', () => ({
  redirectRoute: jest.fn(),
}));

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls redirectRoute with /home', async () => {
    const mockRedirectRoute = redirectRoute as jest.MockedFunction<typeof redirectRoute>;
    mockRedirectRoute.mockResolvedValue(undefined as never);

    await Home();

    expect(mockRedirectRoute).toHaveBeenCalledWith('/home');
    expect(mockRedirectRoute).toHaveBeenCalledTimes(1);
  });

  it('returns undefined', async () => {
    const mockRedirectRoute = redirectRoute as jest.MockedFunction<typeof redirectRoute>;
    mockRedirectRoute.mockResolvedValue(undefined as never);

    const result = await Home();

    expect(result).toBeUndefined();
  });
}); 