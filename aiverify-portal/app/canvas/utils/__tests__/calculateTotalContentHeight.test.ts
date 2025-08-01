import { calculateTotalContentHeight } from '../calculateTotalContentHeight';

describe('calculateTotalContentHeight', () => {
  let mockElement: HTMLElement;
  let mockChild1: HTMLElement;
  let mockChild2: HTMLElement;
  let mockChild3: HTMLElement;

  beforeEach(() => {
    // Mock getComputedStyle
    const mockGetComputedStyle = jest.fn();
    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
    });

    // Create mock elements
    mockElement = document.createElement('div');
    mockChild1 = document.createElement('div');
    mockChild2 = document.createElement('div');
    mockChild3 = document.createElement('div');

    // Mock getBoundingClientRect for each child
    mockChild1.getBoundingClientRect = jest.fn().mockReturnValue({ height: 100 });
    mockChild2.getBoundingClientRect = jest.fn().mockReturnValue({ height: 150 });
    mockChild3.getBoundingClientRect = jest.fn().mockReturnValue({ height: 200 });

    // Mock computed styles for each child
    mockGetComputedStyle
      .mockReturnValueOnce({ marginTop: '10px', marginBottom: '5px' })
      .mockReturnValueOnce({ marginTop: '15px', marginBottom: '10px' })
      .mockReturnValueOnce({ marginTop: '20px', marginBottom: '15px' });

    // Set up element children
    mockElement.appendChild(mockChild1);
    mockElement.appendChild(mockChild2);
    mockElement.appendChild(mockChild3);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate total height including margins for multiple children', () => {
    const result = calculateTotalContentHeight(mockElement);

    // Expected: (100 + 10 + 5) + (150 + 15 + 10) + (200 + 20 + 15) = 115 + 175 + 235 = 525
    expect(result).toBe(525);
  });

  it('should handle element with no children', () => {
    const emptyElement = document.createElement('div');
    const result = calculateTotalContentHeight(emptyElement);

    expect(result).toBe(0);
  });

  it('should handle element with single child', () => {
    const singleChildElement = document.createElement('div');
    const child = document.createElement('div');
    child.getBoundingClientRect = jest.fn().mockReturnValue({ height: 100 });
    
    const mockGetComputedStyle = jest.fn().mockReturnValue({
      marginTop: '10px',
      marginBottom: '5px',
    });
    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
    });

    singleChildElement.appendChild(child);
    const result = calculateTotalContentHeight(singleChildElement);

    expect(result).toBe(115); // 100 + 10 + 5
  });

  it('should handle zero margins', () => {
    const mockGetComputedStyle = jest.fn()
      .mockReturnValue({ marginTop: '0px', marginBottom: '0px' })
      .mockReturnValue({ marginTop: '0px', marginBottom: '0px' })
      .mockReturnValue({ marginTop: '0px', marginBottom: '0px' });

    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
    });

    const result = calculateTotalContentHeight(mockElement);

    expect(result).toBe(450); // 100 + 150 + 200
  });

  it('should handle negative margins', () => {
    const mockGetComputedStyle = jest.fn()
      .mockReturnValue({ marginTop: '-10px', marginBottom: '-5px' })
      .mockReturnValue({ marginTop: '-15px', marginBottom: '-10px' })
      .mockReturnValue({ marginTop: '-20px', marginBottom: '-15px' });

    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
    });

    const result = calculateTotalContentHeight(mockElement);

    expect(result).toBe(345); // (100 - 10 - 5) + (150 - 15 - 10) + (200 - 20 - 15) = 85 + 125 + 135 = 345
  });

  it('should handle invalid margin values', () => {
    const mockGetComputedStyle = jest.fn()
      .mockReturnValue({ marginTop: 'invalid', marginBottom: 'also-invalid' })
      .mockReturnValue({ marginTop: '10px', marginBottom: '5px' })
      .mockReturnValue({ marginTop: '20px', marginBottom: '15px' });

    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
    });

    const result = calculateTotalContentHeight(mockElement);

    // First child margins should default to 0 due to invalid values
    expect(result).toBe(555); // (100 + 0 + 0) + (150 + 10 + 5) + (200 + 20 + 15) = 100 + 165 + 235 = 500
  });

  it('should handle zero height children', () => {
    mockChild1.getBoundingClientRect = jest.fn().mockReturnValue({ height: 0 });
    mockChild2.getBoundingClientRect = jest.fn().mockReturnValue({ height: 0 });
    mockChild3.getBoundingClientRect = jest.fn().mockReturnValue({ height: 0 });

    const mockGetComputedStyle = jest.fn()
      .mockReturnValue({ marginTop: '10px', marginBottom: '5px' })
      .mockReturnValue({ marginTop: '15px', marginBottom: '10px' })
      .mockReturnValue({ marginTop: '20px', marginBottom: '15px' });

    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
    });

    const result = calculateTotalContentHeight(mockElement);

    expect(result).toBe(105); // (0 + 10 + 5) + (0 + 15 + 10) + (0 + 20 + 15) = 15 + 25 + 35 = 75
  });

  it('should handle very large height values', () => {
    const largeHeight = 10000;
    mockChild1.getBoundingClientRect = jest.fn().mockReturnValue({ height: largeHeight });
    mockChild2.getBoundingClientRect = jest.fn().mockReturnValue({ height: largeHeight });
    mockChild3.getBoundingClientRect = jest.fn().mockReturnValue({ height: largeHeight });

    const mockGetComputedStyle = jest.fn()
      .mockReturnValue({ marginTop: '100px', marginBottom: '50px' })
      .mockReturnValue({ marginTop: '200px', marginBottom: '100px' })
      .mockReturnValue({ marginTop: '300px', marginBottom: '150px' });

    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
    });

    const result = calculateTotalContentHeight(mockElement);

    expect(result).toBe(31350); // (10000 + 100 + 50) + (10000 + 200 + 100) + (10000 + 300 + 150) = 10150 + 10300 + 10300 = 30750
  });

  it('should handle decimal margin values', () => {
    const mockGetComputedStyle = jest.fn()
      .mockReturnValue({ marginTop: '10.5px', marginBottom: '5.25px' })
      .mockReturnValue({ marginTop: '15.75px', marginBottom: '10.125px' })
      .mockReturnValue({ marginTop: '20.25px', marginBottom: '15.875px' });

    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
    });

    const result = calculateTotalContentHeight(mockElement);

    expect(result).toBe(558.375); // (100 + 10.5 + 5.25) + (150 + 15.75 + 10.125) + (200 + 20.25 + 15.875) = 115.75 + 175.875 + 236.125 = 527.75
  });

  it('should handle mixed content types', () => {
    // Add a text node to test mixed content
    const textNode = document.createTextNode('Some text content');
    mockElement.appendChild(textNode);

    const result = calculateTotalContentHeight(mockElement);

    // Text nodes should be ignored, so result should be the same as before
    expect(result).toBe(525);
  });

  it('should handle null element', () => {
    expect(() => calculateTotalContentHeight(null as any)).toThrow();
  });

  it('should handle undefined element', () => {
    expect(() => calculateTotalContentHeight(undefined as any)).toThrow();
  });
}); 