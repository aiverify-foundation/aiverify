import { jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Project } from '@/app/types';
import { ProjectCards } from '../projectCards';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock project data
const mockProjects: Project[] = [
  {
    id: 1,
    globalVars: [],
    pages: [],
    templateId: 'template1',
    projectInfo: {
      name: 'Test Project 1',
      description: 'Test Description 1',
      reportTitle: 'Test Report 1',
      company: 'Test Company',
    },
    testModelId: 1,
    inputBlocks: [{ id: 1 }, { id: 2 }] as any[],
    testResults: [{ id: 1 }, { id: 2 }] as any[],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    globalVars: [],
    pages: [],
    templateId: 'template2',
    projectInfo: {
      name: 'Test Project 2',
      description: 'Test Description 2',
      reportTitle: 'Test Report 2',
      company: 'Test Company',
    },
    testModelId: 2,
    inputBlocks: [{ id: 3 }] as any[],
    testResults: [{ id: 3 }] as any[],
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
];

describe('ProjectCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('renders all project cards', () => {
    render(<ProjectCards projects={mockProjects} />);

    // Check for cards by their actual CSS classes
    const cards = document.querySelectorAll('.card');
    expect(cards).toHaveLength(2);
    
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  it('renders project information correctly', () => {
    render(<ProjectCards projects={mockProjects} />);

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Description 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    expect(screen.getByText('Test Description 2')).toBeInTheDocument();
  });

  it('renders correct number of action buttons', () => {
    render(<ProjectCards projects={mockProjects} />);

    // Check for 2 view links (eye icons)
    const viewLinks = screen.getAllByRole('link').filter(link => 
      link.getAttribute('href')?.includes('mode=view')
    );
    expect(viewLinks).toHaveLength(2);

    // Check for 2 edit links (pencil icons)
    const editLinks = screen.getAllByRole('link').filter(link => 
      link.getAttribute('href')?.includes('project/select_data')
    );
    expect(editLinks).toHaveLength(2);

    // Check for 2 delete buttons
    const deleteButtons = screen.getAllByRole('button');
    expect(deleteButtons).toHaveLength(2);
  });

  it('renders view links with correct href', () => {
    render(<ProjectCards projects={mockProjects} />);

    const viewLinks = screen.getAllByRole('link').filter(link => 
      link.getAttribute('href')?.includes('mode=view')
    );
    
    expect(viewLinks).toHaveLength(2);
    expect(viewLinks[0]).toHaveAttribute('href', 
      '/canvas?flow=10&projectId=1&modelId=1&testResultIds=1,2&iBlockIds=1,2&mode=view'
    );
  });

  it('renders edit links with correct href', () => {
    render(<ProjectCards projects={mockProjects} />);

    const editLinks = screen.getAllByRole('link').filter(link => 
      link.getAttribute('href')?.includes('project/select_data')
    );
    
    expect(editLinks).toHaveLength(2);
    expect(editLinks[0]).toHaveAttribute('href', 
      '/project/select_data?flow=8&projectId=1'
    );
  });

  it('has correct card structure', () => {
    render(<ProjectCards projects={mockProjects} />);

    const cards = document.querySelectorAll('.card');
    expect(cards).toHaveLength(2);
    
    cards.forEach(card => {
      expect(card).toHaveClass('card');
      expect(card).toHaveClass('card_md');
      
      // Check for card content
      const cardContent = card.querySelector('.cardContent');
      expect(cardContent).toBeInTheDocument();
      
      // Check for card sidebar
      const cardSideBar = card.querySelector('.cardSideBar');
      expect(cardSideBar).toBeInTheDocument();
    });
  });

  it('applies correct card width', () => {
    render(<ProjectCards projects={mockProjects} />);

    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      expect(card).toHaveStyle('width: 450px');
    });
  });

  it('handles empty projects array', () => {
    render(<ProjectCards projects={[]} />);

    const cards = document.querySelectorAll('.card');
    expect(cards).toHaveLength(0);
  });

  it('handles project with no test results or input blocks', () => {
    const projectWithoutResults: Project = {
      ...mockProjects[0],
      testResults: [],
      inputBlocks: [],
    };

    render(<ProjectCards projects={[projectWithoutResults]} />);

    const viewLinks = screen.getAllByRole('link').filter(link => 
      link.getAttribute('href')?.includes('mode=view')
    );
    
    expect(viewLinks[0]).toHaveAttribute('href', 
      '/canvas?flow=10&projectId=1&modelId=1&testResultIds=&iBlockIds=&mode=view'
    );
  });

  it('renders card titles as h3 elements', () => {
    render(<ProjectCards projects={mockProjects} />);

    const title1 = screen.getByRole('heading', { level: 3, name: 'Test Project 1' });
    const title2 = screen.getByRole('heading', { level: 3, name: 'Test Project 2' });
    
    expect(title1).toBeInTheDocument();
    expect(title2).toBeInTheDocument();
  });

  it('renders project descriptions as paragraphs', () => {
    render(<ProjectCards projects={mockProjects} />);

    const description1 = screen.getByText('Test Description 1');
    const description2 = screen.getByText('Test Description 2');
    
    expect(description1.tagName).toBe('P');
    expect(description2.tagName).toBe('P');
  });

  it('renders SVG icons for actions', () => {
    render(<ProjectCards projects={mockProjects} />);

    const svgIcons = document.querySelectorAll('svg');
    // Each card has 3 SVG icons (view, edit, delete) = 6 total
    expect(svgIcons).toHaveLength(6);
    
    // All SVG icons should have the remixicon class
    svgIcons.forEach(icon => {
      expect(icon).toHaveClass('remixicon');
    });
  });

  it('has properly sized icons', () => {
    render(<ProjectCards projects={mockProjects} />);

    const svgIcons = document.querySelectorAll('svg');
    
    // View icons should be 25x25
    const viewIcons = Array.from(svgIcons).filter(icon => 
      icon.getAttribute('height') === '25' && icon.getAttribute('width') === '25'
    );
    expect(viewIcons).toHaveLength(2);

    // Edit and delete icons should be 27x27
    const actionIcons = Array.from(svgIcons).filter(icon => 
      icon.getAttribute('height') === '27' && icon.getAttribute('width') === '27'
    );
    expect(actionIcons).toHaveLength(4);
  });

  it('renders cards with gradient background', () => {
    render(<ProjectCards projects={mockProjects} />);

    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const style = window.getComputedStyle(card);
      expect(card).toHaveStyle('background-image: linear-gradient(to bottom, var(--color-primary-900), var(--color-primary-700))');
    });
  });

  it('has accessible structure', () => {
    render(<ProjectCards projects={mockProjects} />);

    // Check that all links have proper href attributes
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });

    // Check that all buttons are focusable
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('disabled');
    });
  });

  it('updates when projects prop changes', () => {
    const { rerender } = render(<ProjectCards projects={mockProjects} />);

    let cards = document.querySelectorAll('.card');
    expect(cards).toHaveLength(2);

    const newProjects = [mockProjects[0]];
    rerender(<ProjectCards projects={newProjects} />);

    cards = document.querySelectorAll('.card');
    expect(cards).toHaveLength(1);
  });

  it('renders consistent layout for all cards', () => {
    render(<ProjectCards projects={mockProjects} />);

    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
      // Each card should have a flexbox structure
      const flexbox = card.querySelector('.cardFlexbox');
      expect(flexbox).toBeInTheDocument();
      
      // Each card should have content area
      const content = card.querySelector('.cardContent');
      expect(content).toBeInTheDocument();
      
      // Each card should have sidebar
      const sidebar = card.querySelector('.cardSideBar');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Delete Functionality', () => {
    it('shows confirmation modal when delete button is clicked', () => {
      render(<ProjectCards projects={mockProjects} />);

      const deleteButtons = screen.getAllByRole('button');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete project/)).toBeInTheDocument();
    });

    it('closes confirmation modal when cancel is clicked', () => {
      render(<ProjectCards projects={mockProjects} />);

      const deleteButtons = screen.getAllByRole('button');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
    });

    it('closes confirmation modal when close icon is clicked', () => {
      render(<ProjectCards projects={mockProjects} />);

      const deleteButtons = screen.getAllByRole('button');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();

      const closeButton = document.querySelector('.icon_wrapper');
      fireEvent.click(closeButton!);

      expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
    });

    it('successfully deletes project when confirmed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      render(<ProjectCards projects={mockProjects} />);

      const deleteButtons = screen.getAllByRole('button');
      fireEvent.click(deleteButtons[0]);

      const confirmDeleteButton = screen.getByText('Delete');
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText(/has been successfully deleted/)).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/projects/1', {
        method: 'DELETE',
      });
    });

    it('handles delete API error and shows error modal', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      render(<ProjectCards projects={mockProjects} />);

      const deleteButtons = screen.getAllByRole('button');
      fireEvent.click(deleteButtons[0]);

      const confirmDeleteButton = screen.getByText('Delete');
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText(/Failed to delete project/)).toBeInTheDocument();
      });
    });

    it('handles network error during delete operation', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ProjectCards projects={mockProjects} />);

      const deleteButtons = screen.getAllByRole('button');
      fireEvent.click(deleteButtons[0]);

      const confirmDeleteButton = screen.getByText('Delete');
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText(/Failed to delete project/)).toBeInTheDocument();
      });
    });

    it('disables delete button during deletion process', async () => {
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        status: 200,
      } as Response), 100)));

      render(<ProjectCards projects={mockProjects} />);

      const deleteButtons = screen.getAllByRole('button');
      fireEvent.click(deleteButtons[0]);

      const confirmDeleteButton = screen.getByText('Delete');
      fireEvent.click(confirmDeleteButton);

      // The delete button should be disabled during the process
      expect(deleteButtons[0]).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      });
    });

    it('closes result modal when OK button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      render(<ProjectCards projects={mockProjects} />);

      const deleteButtons = screen.getAllByRole('button');
      fireEvent.click(deleteButtons[0]);

      const confirmDeleteButton = screen.getByText('Delete');
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      });

      const okButton = screen.getByText('OK');
      fireEvent.click(okButton);

      expect(screen.queryByText('Success')).not.toBeInTheDocument();
    });

    it('closes result modal when close icon is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      render(<ProjectCards projects={mockProjects} />);

      const deleteButtons = screen.getAllByRole('button');
      fireEvent.click(deleteButtons[0]);

      const confirmDeleteButton = screen.getByText('Delete');
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      });

      const closeButton = document.querySelector('.icon_wrapper');
      fireEvent.click(closeButton!);

      expect(screen.queryByText('Success')).not.toBeInTheDocument();
    });

    it('removes project from list after successful deletion', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      render(<ProjectCards projects={mockProjects} />);

      let cards = document.querySelectorAll('.card');
      expect(cards).toHaveLength(2);

      const deleteButtons = screen.getAllByRole('button');
      fireEvent.click(deleteButtons[0]);

      const confirmDeleteButton = screen.getByText('Delete');
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        cards = document.querySelectorAll('.card');
        expect(cards).toHaveLength(1);
        expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
        expect(screen.getByText('Test Project 2')).toBeInTheDocument();
      });
    });
  });
}); 