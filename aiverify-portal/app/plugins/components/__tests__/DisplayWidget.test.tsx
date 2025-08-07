import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Widget } from '@/app/plugins/utils/types';
import WidgetCard from '../DisplayWidget';

// Mock Button component
jest.mock('@/lib/components/button', () => ({
  Button: ({ text, onClick, 'aria-label': ariaLabel, pill, textColor, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid={`button-${text.toLowerCase().replace(/\s+/g, '-')}`}
      className={className}
      {...props}
    >
      {text}
    </button>
  ),
  ButtonVariant: {
    PRIMARY: 'primary',
    OUTLINE: 'outline',
  },
}));

// Mock Modal component
jest.mock('@/lib/components/modal', () => ({
  Modal: ({ heading, children, onCloseIconClick, 'aria-labelledby': ariaLabelledby }: any) => (
    <div
      data-testid="modal"
      aria-labelledby={ariaLabelledby}
      aria-modal="true"
    >
      <div data-testid="modal-header">
        <h2 id="modal-heading">{heading}</h2>
        <button onClick={onCloseIconClick} data-testid="close-modal">
          ×
        </button>
      </div>
      <div data-testid="modal-content">{children}</div>
    </div>
  ),
}));

// Mock Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, color }: any) => (
    <div data-testid={`icon-${name}`} data-color={color}>
      {name} Icon
    </div>
  ),
  IconName: {
    Warning: 'Warning',
  },
}));

// Mock custom icons
jest.mock('@/app/plugins/utils/icons', () => ({
  TaskAltIcon: ({ color }: any) => (
    <div data-testid="task-alt-icon" data-color={color}>
      TaskAlt Icon
    </div>
  ),
  CheckCircleIcon: ({ color }: any) => (
    <div data-testid="check-circle-icon" data-color={color}>
      CheckCircle Icon
    </div>
  ),
  CrossCircleIcon: ({ color }: any) => (
    <div data-testid="cross-circle-icon" data-color={color}>
      CrossCircle Icon
    </div>
  ),
}));

describe('WidgetCard Component', () => {
  const mockWidget: Widget = {
    gid: 'widget-gid-123',
    cid: 'widget-cid-456',
    name: 'Test Widget',
    version: '1.0.0',
    author: 'Test Author',
    description: 'Test widget description',
    widgetSize: { minW: 2, minH: 2, maxW: 6, maxH: 6 },
    properties: [
      { key: 'color', helper: 'Choose color', default: 'blue' },
      { key: 'size', helper: 'Set size', default: 'medium' },
    ],
    tags: 'test,widget,ui',
    dependencies: [
      { cid: 'dependency-1', gid: 'dep-gid-1', version: '1.0.0' },
      { cid: 'dependency-2', gid: 'dep-gid-2', version: '1.0.0' },
    ],
    mockdata: {
      testData: 'mock data for testing',
      values: [1, 2, 3, 4, 5],
    } as any,
    dynamicHeight: false,
  };

  const mockWidgetMissingDependencies: Widget = {
    gid: 'widget-gid-missing',
    cid: 'widget-cid-missing',
    name: 'Widget Missing Dependencies',
    version: '1.0.0',
    author: 'Test Author',
    description: 'Test widget with missing dependencies',
    widgetSize: { minW: 1, minH: 1, maxW: 4, maxH: 4 },
    properties: [],
    tags: 'test',
    dependencies: [
      { cid: 'missing-dep-1', gid: null, version: null },
      { cid: '', gid: null, version: null },
    ],
    mockdata: null,
    dynamicHeight: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<WidgetCard widget={mockWidget} />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('displays widget name as heading', () => {
      render(<WidgetCard widget={mockWidget} />);
      
      const heading = screen.getByRole('heading', { name: 'Test Widget' });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-xl', 'font-semibold');
    });

    it('displays widget description', () => {
      render(<WidgetCard widget={mockWidget} />);
      expect(screen.getByText('Test widget description')).toBeInTheDocument();
    });

    it('displays default description when none provided', () => {
      const widgetWithoutDescription = { ...mockWidget, description: null };
      render(<WidgetCard widget={widgetWithoutDescription} />);
      expect(screen.getByText('No description provided.')).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('displays all metadata when available', () => {
      render(<WidgetCard widget={mockWidget} />);
      
      expect(screen.getByText('widget-gid-123:widget-cid-456')).toBeInTheDocument();
      expect(screen.getByText('widget-cid-456')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
      expect(screen.getByText('test,widget,ui')).toBeInTheDocument();
      expect(screen.getByText('Min: 2x2 / Max: 6x6')).toBeInTheDocument();
    });

    it('handles missing optional metadata gracefully', () => {
      const widgetWithMissingData: any = {
        ...mockWidget,
        author: undefined,
        tags: undefined,
        version: undefined,
        widgetSize: undefined,
      };

      render(<WidgetCard widget={widgetWithMissingData} />);
      
      expect(screen.getByText('widget-gid-123:widget-cid-456')).toBeInTheDocument();
      expect(screen.queryByText('Author:')).not.toBeInTheDocument();
      expect(screen.queryByText('Tags:')).not.toBeInTheDocument();
      expect(screen.queryByText('Version:')).not.toBeInTheDocument();
      expect(screen.queryByText('Dimensions:')).not.toBeInTheDocument();
    });
  });

  describe('Dependency Status', () => {
    it('shows "Dependencies OK" when all dependencies are available', () => {
      render(<WidgetCard widget={mockWidget} />);
      
      const dependencyStatus = screen.getByText('Dependencies OK');
      expect(dependencyStatus).toBeInTheDocument();
      expect(dependencyStatus).toHaveStyle('color: #25A167');
      
      const checkIcon = screen.getByTestId('check-circle-icon');
      expect(checkIcon).toBeInTheDocument();
      expect(checkIcon).toHaveAttribute('data-color', '#25A167');
    });

    it('shows "Missing Dependencies" when some dependencies are missing', () => {
      render(<WidgetCard widget={mockWidgetMissingDependencies} />);
      
      const dependencyStatus = screen.getByText('Missing Dependencies');
      expect(dependencyStatus).toBeInTheDocument();
      expect(dependencyStatus).toHaveStyle('color: rgb(255, 0, 0); font-weight: bold;');
      
      const crossIcon = screen.getByTestId('cross-circle-icon');
      expect(crossIcon).toBeInTheDocument();
      expect(crossIcon).toHaveAttribute('data-color', '#red');
    });

    it('displays dependency list with correct status indicators', () => {
      render(<WidgetCard widget={mockWidget} />);
      
      expect(screen.getByText('dependency-1')).toBeInTheDocument();
      expect(screen.getByText('dependency-2')).toBeInTheDocument();
      
      const taskAltIcons = screen.getAllByTestId('task-alt-icon');
      expect(taskAltIcons).toHaveLength(2);
    });

    it('displays warning icons for missing dependencies', () => {
      render(<WidgetCard widget={mockWidgetMissingDependencies} />);
      
      const warningIcons = screen.getAllByTestId('icon-Warning');
      expect(warningIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Properties Button', () => {
    it('renders properties button when properties exist', () => {
      render(<WidgetCard widget={mockWidget} />);
      
      const propertiesButton = screen.getByTestId('button-properties');
      expect(propertiesButton).toBeInTheDocument();
      expect(propertiesButton).toHaveAttribute('aria-label', 'View widget properties');
    });

    it('does not render properties button when no properties', () => {
      const widgetWithoutProperties = { ...mockWidget, properties: null };
      render(<WidgetCard widget={widgetWithoutProperties} />);
      
      expect(screen.queryByTestId('button-properties')).not.toBeInTheDocument();
    });
  });

  describe('Mock Data Button', () => {
    it('renders mock data button when mockdata exists', () => {
      render(<WidgetCard widget={mockWidget} />);
      
      const mockDataButton = screen.getByTestId('button-mock-data');
      expect(mockDataButton).toBeInTheDocument();
      expect(mockDataButton).toHaveAttribute('aria-label', 'View widget mock data');
    });

    it('does not render mock data button when no mockdata', () => {
      const widgetWithoutMockData = { ...mockWidget, mockdata: null };
      render(<WidgetCard widget={widgetWithoutMockData} />);
      
      expect(screen.queryByTestId('button-mock-data')).not.toBeInTheDocument();
    });
  });

  describe('Modal Functionality', () => {
    it('opens properties modal when properties button is clicked', async () => {
      render(<WidgetCard widget={mockWidget} />);
      
      const propertiesButton = screen.getByTestId('button-properties');
      fireEvent.click(propertiesButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      expect(screen.getByText('Widget Properties')).toBeInTheDocument();
      const modalContent = screen.getByTestId('modal-content');
      expect(modalContent).toHaveTextContent('color');
      expect(modalContent).toHaveTextContent('size');
    });

    it('opens mock data modal when mock data button is clicked', async () => {
      render(<WidgetCard widget={mockWidget} />);
      
      const mockDataButton = screen.getByTestId('button-mock-data');
      fireEvent.click(mockDataButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      expect(screen.getByText('Mock Data')).toBeInTheDocument();
      const modalContent = screen.getByTestId('modal-content');
      expect(modalContent).toHaveTextContent('testData');
      expect(modalContent).toHaveTextContent('values');
    });

    it('handles widget without properties gracefully', async () => {
      const widgetWithoutProperties = { ...mockWidget, properties: null };
      render(<WidgetCard widget={widgetWithoutProperties} />);
      
      // Properties button should not be rendered when properties is null
      expect(screen.queryByTestId('button-properties')).not.toBeInTheDocument();
    });

    it('handles widget without mock data gracefully', async () => {
      const widgetWithoutMockData = { ...mockWidget, mockdata: null };
      render(<WidgetCard widget={widgetWithoutMockData} />);
      
      // Mock data button should not be rendered when mockdata is null
      expect(screen.queryByTestId('button-mock-data')).not.toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      render(<WidgetCard widget={mockWidget} />);
      
      // Open modal
      const propertiesButton = screen.getByTestId('button-properties');
      fireEvent.click(propertiesButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByTestId('close-modal');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and regions', () => {
      render(<WidgetCard widget={mockWidget} />);
      
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'widget-widget-gid-123');
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveAttribute('id', 'widget-widget-gid-123');
      
      const metadataList = screen.getAllByRole('list')[0];
      expect(metadataList).toBeInTheDocument();
    });

    it('has accessible dependency status', () => {
      render(<WidgetCard widget={mockWidget} />);
      
      const dependencyStatus = screen.getByLabelText('All dependencies are met');
      expect(dependencyStatus).toBeInTheDocument();
      expect(dependencyStatus).toHaveAttribute('aria-live', 'polite');
    });

    it('has accessible dependency status for missing dependencies', () => {
      render(<WidgetCard widget={mockWidgetMissingDependencies} />);
      
      const dependencyStatus = screen.getByLabelText('Missing dependencies');
      expect(dependencyStatus).toBeInTheDocument();
      expect(dependencyStatus).toHaveAttribute('aria-live', 'polite');
    });

    it('modal has correct accessibility attributes', async () => {
      render(<WidgetCard widget={mockWidget} />);
      
      const propertiesButton = screen.getByTestId('button-properties');
      fireEvent.click(propertiesButton);

      await waitFor(() => {
        const modal = screen.getByTestId('modal');
        expect(modal).toHaveAttribute('aria-modal', 'true');
        expect(modal).toHaveAttribute('aria-labelledby', 'modal-heading');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty dependencies array', () => {
      const widgetWithNoDependencies = { ...mockWidget, dependencies: [] };
      render(<WidgetCard widget={widgetWithNoDependencies} />);
      
      const dependencyStatus = screen.getByText('Dependencies OK');
      expect(dependencyStatus).toBeInTheDocument();
      
      expect(screen.queryByText('Required Dependencies:')).not.toBeInTheDocument();
    });

    it('handles very long widget names', () => {
      const widgetWithLongName = {
        ...mockWidget,
        name: 'This is a very long widget name that might cause layout issues if not handled properly'
      };
      
      render(<WidgetCard widget={widgetWithLongName} />);
      
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent(widgetWithLongName.name);
    });

    it('handles complex properties data', () => {
      const widgetWithComplexProperties: any = {
        ...mockWidget,
        properties: [
          { key: 'nested', helper: 'Complex data', default: { nested: { value: 'test' } } },
        ],
      };
      
      render(<WidgetCard widget={widgetWithComplexProperties} />);
      
      const propertiesButton = screen.getByTestId('button-properties');
      fireEvent.click(propertiesButton);

      waitFor(() => {
        const modalContent = screen.getByTestId('modal-content');
        expect(modalContent).toHaveTextContent('nested');
      });
    });
  });
}); 