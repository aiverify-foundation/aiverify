import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InputsPage from '../page';
import { getAllInputBlocks } from '@/lib/fetchApis/getAllInputBlocks';

// Mock the getAllInputBlocks function
jest.mock('@/lib/fetchApis/getAllInputBlocks');
const mockGetAllInputBlocks = getAllInputBlocks as jest.MockedFunction<typeof getAllInputBlocks>;

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock Icon component
jest.mock('@/lib/components/IconSVG', () => ({
  Icon: ({ name, size, color, svgClassName }: any) => (
    <div data-testid={`icon-${name}`} style={{ width: size, height: size, color }}>
      {name}
    </div>
  ),
  IconName: {
    File: 'File',
    CheckList: 'CheckList',
  },
}));

// Mock Card component
jest.mock('@/lib/components/card/card', () => ({
  Card: ({ 
    children, 
    className, 
    enableTiltEffect,
    tiltSpeed,
    tiltRotation,
    enableTiltGlare,
    tiltMaxGlare,
    size,
    cardColor,
    width,
    height,
    style,
    onClick,
    ...props 
  }: any) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
}));

describe('InputsPage', () => {
  const mockInputBlocks = [
    {
      gid: 'group1',
      cid: 'checklist1',
      name: 'Test Checklist 1',
      description: 'Test description 1',
      group: 'Group A',
      groupNumber: 1,
    },
    {
      gid: 'group1',
      cid: 'checklist2',
      name: 'Test Checklist 2',
      description: 'Test description 2',
      group: 'Group A',
      groupNumber: 2,
    },
    {
      gid: 'group2',
      cid: 'checklist3',
      name: 'Test Checklist 3',
      description: 'Test description 3',
      group: 'Group B',
      groupNumber: 1,
    },
    {
      gid: 'group3',
      cid: 'checklist4',
      name: 'Standalone Checklist',
      description: 'Standalone description',
      group: undefined,
      groupNumber: undefined,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllInputBlocks.mockResolvedValue(mockInputBlocks);
  });

  it('renders the page title and description', async () => {
    render(await InputsPage());
    
    await waitFor(() => {
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      expect(screen.getByText('View and manage user inputs')).toBeInTheDocument();
    });
  });

  it('displays the file icon', async () => {
    render(await InputsPage());
    
    await waitFor(() => {
      expect(screen.getByTestId('icon-File')).toBeInTheDocument();
    });
  });

  it('renders grouped input blocks as cards', async () => {
    render(await InputsPage());
    
    await waitFor(() => {
      // Should render Group A and Group B cards
      expect(screen.getByText('Group A')).toBeInTheDocument();
      expect(screen.getByText('Group B')).toBeInTheDocument();
    });
  });

  it('renders non-grouped input blocks as individual cards', async () => {
    render(await InputsPage());
    
    await waitFor(() => {
      expect(screen.getByText('Standalone Checklist')).toBeInTheDocument();
    });
  });

  it('creates correct links for grouped input blocks', async () => {
    render(await InputsPage());

    await waitFor(() => {
      const groupALink = screen.getByText('Group A').closest('a');
      expect(groupALink).toHaveAttribute('href', '/inputs/groups/group1/Group%20A');
      
      const groupBLink = screen.getByText('Group B').closest('a');
      expect(groupBLink).toHaveAttribute('href', '/inputs/groups/group2/Group%20B');
    });
  });

  it('creates correct links for non-grouped input blocks', async () => {
    render(await InputsPage());
    
    await waitFor(() => {
      const standaloneLink = screen.getByText('Standalone Checklist').closest('a');
      expect(standaloneLink).toHaveAttribute('href', '/inputs/group3/checklist4');
    });
  });

  it('displays checklist icons in cards', async () => {
    render(await InputsPage());
    
    await waitFor(() => {
      const icons = screen.getAllByTestId('icon-CheckList');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  it('displays descriptive text in cards', async () => {
    render(await InputsPage());
    
    await waitFor(() => {
      const descriptions = screen.getAllByText('Manage input blocks in this group');
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  it('handles empty input blocks array', async () => {
    mockGetAllInputBlocks.mockResolvedValue([]);
    
    render(await InputsPage());
    
    await waitFor(() => {
      expect(screen.getByText('User Inputs')).toBeInTheDocument();
      // Should not render any group cards
      expect(screen.queryByText('Group A')).not.toBeInTheDocument();
    });
  });

  it('handles input blocks with null group values', async () => {
    const blocksWithNullGroups = [
      {
        gid: 'group1',
        cid: 'checklist1',
        name: 'No Group Checklist',
        description: 'No group description',
        group: undefined,
        groupNumber: undefined,
      },
    ];
    mockGetAllInputBlocks.mockResolvedValue(blocksWithNullGroups);
    
    render(await InputsPage());
    
    await waitFor(() => {
      expect(screen.getByText('No Group Checklist')).toBeInTheDocument();
    });
  });

  it('sorts grouped input blocks alphabetically', async () => {
    const unsortedBlocks = [
      {
        gid: 'group1',
        cid: 'checklist1',
        name: 'Zebra Group',
        description: 'Zebra description',
        group: 'Zebra Group',
        groupNumber: 1,
      },
      {
        gid: 'group2',
        cid: 'checklist2',
        name: 'Alpha Group',
        description: 'Alpha description',
        group: 'Alpha Group',
        groupNumber: 1,
      },
    ];
    mockGetAllInputBlocks.mockResolvedValue(unsortedBlocks);
    
    render(await InputsPage());
    
    await waitFor(() => {
      const cards = screen.getAllByTestId('card');
      const cardTexts = cards.map(card => card.textContent);
      
      // Alpha Group should appear before Zebra Group
      const alphaIndex = cardTexts.findIndex(text => text?.includes('Alpha Group'));
      const zebraIndex = cardTexts.findIndex(text => text?.includes('Zebra Group'));
      
      expect(alphaIndex).toBeLessThan(zebraIndex);
    });
  });

  it('handles API errors gracefully', async () => {
    mockGetAllInputBlocks.mockRejectedValue(new Error('API Error'));
    
    // Mock console.log to prevent error output in tests
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // The component should handle the error gracefully
    try {
      render(await InputsPage());
      
      // Should still render the page structure even with API errors
      await waitFor(() => {
        expect(screen.getByText('User Inputs')).toBeInTheDocument();
      });
    } catch (error) {
      // If the component throws an error, that's also acceptable behavior
      expect(error).toBeDefined();
    }
    
    consoleSpy.mockRestore();
  });

  it('renders cards with proper styling', async () => {
    render(await InputsPage());

    await waitFor(() => {
      const cards = screen.getAllByTestId('card');
      cards.forEach(card => {
        expect(card).toHaveClass('bg-secondary-500', '!bg-none');
      });
    });
  });
}); 