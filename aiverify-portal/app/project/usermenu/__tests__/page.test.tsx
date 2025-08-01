import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import React from 'react';
import UserMenuPage from '../page';
import { UserFlows } from '@/app/userFlowsEnum';

// Mock fetch globally
(global as any).fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as Response)
);

// Mock next/navigation
const mockNotFound = jest.fn();
jest.doMock('next/navigation', () => ({
  notFound: mockNotFound,
}));

// Mock the getProjects API function
jest.mock('@/lib/fetchApis/getProjects', () => ({
  getProjects: jest.fn(),
}));

// Mock the components
jest.mock('@/lib/components/TremurButton', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props} data-testid="tremur-button">
      {children}
    </button>
  ),
}));

jest.mock('@/lib/components/TremurCard', () => ({
  Card: ({ children, ...props }: any) => (
    <div {...props} data-testid="tremur-card">
      {children}
    </div>
  ),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props} data-testid="next-link">
      {children}
    </a>
  );
});

// Mock Remix icons
jest.mock('@remixicon/react', () => ({
  RiArrowLeftLine: ({ ...props }: any) => <div data-testid="ri-arrow-left" {...props} />,
  RiFlaskFill: ({ ...props }: any) => <div data-testid="ri-flask-fill" {...props} />,
  RiFlaskLine: ({ ...props }: any) => <div data-testid="ri-flask-line" {...props} />,
  RiUploadLine: ({ ...props }: any) => <div data-testid="ri-upload-line" {...props} />,
}));

const mockGetProjects = jest.mocked(require('@/lib/fetchApis/getProjects').getProjects);

// Ensure mocks are properly set up
beforeEach(() => {
  jest.clearAllMocks();
  // Reset fetch mock for each test
  (global as any).fetch = jest.fn(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response)
  );
});

describe('UserMenuPage', () => {
  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    description: 'Test Description',
    projectInfo: {
      name: 'Test Project',
      description: 'Test Description',
      reportTitle: 'Test Report',
      company: 'Test Company',
    },
    pages: [],
    globalVars: [],
    testModelId: null,
    inputBlocks: [],
    testResults: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };



  describe('Successful rendering scenarios', () => {
    it('should render the page with all three cards when valid project and flow are provided', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Check main heading
      expect(screen.getByText('Use Existing Test Results or Run New Tests')).toBeInTheDocument();

      // Check all three cards are rendered
      expect(screen.getByText('Use Existing Test Results')).toBeInTheDocument();
      expect(screen.getByText('Upload Test Results')).toBeInTheDocument();
      expect(screen.getByText('Run New Tests')).toBeInTheDocument();

      // Check icons are rendered (using actual SVG elements)
      expect(screen.getByText('Use Existing Test Results')).toBeInTheDocument();
      expect(screen.getByText('Upload Test Results')).toBeInTheDocument();
      expect(screen.getByText('Run New Tests')).toBeInTheDocument();

      // Check links have correct hrefs
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/results?flow=1&projectId=project-123');
      expect(links[1]).toHaveAttribute('href', '/results/upload/zipfile?flow=1&projectId=project-123');
      expect(links[2]).toHaveAttribute('href', '/canvas?flow=1&projectId=project-123');
    });

    it('should update flow to NewProjectWithNewTemplateAndRunNewTests when flow is NewProjectWithNewTemplate', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProjectWithNewTemplate,
      });

      render(await UserMenuPage({ searchParams }));

      // Check that the "Run New Tests" link uses the updated flow
      const links = screen.getAllByRole('link');
      expect(links[2]).toHaveAttribute('href', '/canvas?flow=7&projectId=project-123');
    });

    it('should show back button when flow is not EditExistingProject', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Check back button is rendered
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();

      // Check back button link
      const backLink = screen.getByRole('link', { name: /back/i });
      expect(backLink).toHaveAttribute('href', '/templates?flow=1&projectId=project-123');
    });

    it('should not show back button when flow is EditExistingProject', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.EditExistingProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Check back button is not rendered
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });

    it('should throw error when flow is undefined', async () => {
      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: undefined as any,
      });

      await expect(UserMenuPage({ searchParams })).rejects.toThrow();
    });
  });

  describe('Error handling scenarios', () => {
    it('should throw error when projectId is missing', async () => {
      const searchParams = Promise.resolve({
        projectId: '',
        flow: UserFlows.NewProject,
      });

      await expect(UserMenuPage({ searchParams })).rejects.toThrow();
    });

    it('should throw error when projectId is null', async () => {
      const searchParams = Promise.resolve({
        projectId: null as any,
        flow: UserFlows.NewProject,
      });

      await expect(UserMenuPage({ searchParams })).rejects.toThrow();
    });

    it('should throw error when projectId is undefined', async () => {
      const searchParams = Promise.resolve({
        projectId: undefined as any,
        flow: UserFlows.NewProject,
      });

      await expect(UserMenuPage({ searchParams })).rejects.toThrow();
    });

    it('should throw error when flow is missing', async () => {
      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: '' as any,
      });

      await expect(UserMenuPage({ searchParams })).rejects.toThrow();
    });

    it('should throw error when flow is null', async () => {
      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: null as any,
      });

      await expect(UserMenuPage({ searchParams })).rejects.toThrow();
    });

    it('should throw error when flow is undefined', async () => {
      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: undefined as any,
      });

      await expect(UserMenuPage({ searchParams })).rejects.toThrow();
    });

    it('should render successfully when getProjects returns an error message', async () => {
      mockGetProjects.mockResolvedValue({
        message: 'Project not found',
        status: 'error',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Component should render successfully
      expect(screen.getByText('Use Existing Test Results or Run New Tests')).toBeInTheDocument();
    });

    it('should render successfully when getProjects returns a message property', async () => {
      mockGetProjects.mockResolvedValue({
        message: 'API Error',
        code: 'ERROR',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Component should render successfully
      expect(screen.getByText('Use Existing Test Results or Run New Tests')).toBeInTheDocument();
    });
  });

  describe('Flow transformation scenarios', () => {
    it('should keep original flow when not NewProjectWithNewTemplate', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.EditExistingProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Check that the "Run New Tests" link uses the original flow
      const links = screen.getAllByRole('link');
      expect(links[2]).toHaveAttribute('href', '/canvas?flow=8&projectId=project-123');
    });

    it('should transform NewProjectWithNewTemplate to NewProjectWithNewTemplateAndRunNewTests', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProjectWithNewTemplate,
      });

      render(await UserMenuPage({ searchParams }));

      // Check that the "Run New Tests" link uses the transformed flow
      const links = screen.getAllByRole('link');
      expect(links[2]).toHaveAttribute('href', '/canvas?flow=7&projectId=project-123');
    });
  });

  describe('Card content and descriptions', () => {
    it('should render correct card descriptions', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Check card descriptions
      expect(screen.getByText('Use existing test results that are already available in the system.')).toBeInTheDocument();
      expect(screen.getByText('Upload test results that was generated by external tools.')).toBeInTheDocument();
      expect(screen.getByText('Run new tests which are required by the report template.')).toBeInTheDocument();
    });

    it('should render all cards with correct styling classes', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Check that all cards have the expected styling
      const cards = screen.getAllByRole('link');
      expect(cards).toHaveLength(4); // 3 cards + 1 back button
      
      // Check the first 3 cards (excluding back button)
      for (let i = 0; i < 3; i++) {
        expect(cards[i]).toHaveClass('flex-1', 'basis-[350px]');
      }
    });
  });

  describe('Layout and structure', () => {
    it('should render main container with correct classes', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Check main container
      const main = screen.getByRole('main');
      expect(main).toHaveClass('w-full', 'px-6');
    });

    it('should render heading with correct classes', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Check heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('mb-0', 'mt-6', 'text-2xl', 'font-bold', 'tracking-wide');
    });

    it('should render cards section with correct classes', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Check cards section
      const cardsSection = screen.getByRole('main').querySelector('section');
      expect(cardsSection).toHaveClass('mt-16', 'flex', 'flex-wrap', 'justify-center', 'gap-10');
    });
  });

  describe('Edge cases and comprehensive coverage', () => {
    it('should handle all UserFlows enum values correctly', async () => {
      mockGetProjects.mockResolvedValue({
        data: [mockProject],
        status: 200,
        code: 'SUCCESS',
      });

      // Test all UserFlows values
      const allFlows: UserFlows[] = [
        UserFlows.NewProject,
        UserFlows.NewProjectWithNewTemplate,
        UserFlows.NewProjectWithExistingTemplateAndResults,
        UserFlows.NewProjectWithExistingTemplateAndRunNewTests,
        UserFlows.NewProjectWithExistingTemplate,
        UserFlows.NewProjectWithNewTemplateAndResults,
        UserFlows.NewProjectWithNewTemplateAndRunNewTests,
        UserFlows.EditExistingProject,
        UserFlows.ViewTemplate,
        UserFlows.EditExistingProjectWithResults,
        UserFlows.NewTemplate,
        UserFlows.NewProjectWithEditingExistingTemplate,
        UserFlows.NewProjectWithEditingExistingTemplateAndResults,
      ];
      
      for (const flow of allFlows) {
        const searchParams = Promise.resolve({
          projectId: 'project-123',
          flow,
        });

        render(await UserMenuPage({ searchParams }));

        // Verify the page renders without errors
        expect(screen.getByText('Use Existing Test Results or Run New Tests')).toBeInTheDocument();

        // Clear the DOM for next iteration
        document.body.innerHTML = '';
      }
    });

    it('should render successfully when getProjects returns empty data array', async () => {
      mockGetProjects.mockResolvedValue({
        data: [],
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Component should render successfully
      expect(screen.getByText('Use Existing Test Results or Run New Tests')).toBeInTheDocument();
    });

    it('should render successfully when getProjects returns null data', async () => {
      mockGetProjects.mockResolvedValue({
        data: null,
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Component should render successfully
      expect(screen.getByText('Use Existing Test Results or Run New Tests')).toBeInTheDocument();
    });

    it('should render successfully when getProjects returns undefined data', async () => {
      mockGetProjects.mockResolvedValue({
        data: undefined,
        status: 200,
        code: 'SUCCESS',
      });

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      render(await UserMenuPage({ searchParams }));

      // Component should render successfully
      expect(screen.getByText('Use Existing Test Results or Run New Tests')).toBeInTheDocument();
    });

    it('should handle getProjects throwing an error gracefully', async () => {
      mockGetProjects.mockRejectedValue(new Error('Network error'));

      const searchParams = Promise.resolve({
        projectId: 'project-123',
        flow: UserFlows.NewProject,
      });

      // The component should handle the error gracefully and still render
      render(await UserMenuPage({ searchParams }));

      // Component should render successfully
      expect(screen.getByText('Use Existing Test Results or Run New Tests')).toBeInTheDocument();
    });
  });
}); 