import { Chip } from '@mui/material';

enum QuickFilter {
  Templates,
  PreInstalled,
  Widgets,
  Algorithms,
  InputBlocks,
}

type QuickFiltersProps = {
  activeQuickFilters: QuickFilter[];
  handleQuickFilterClick: (filter: QuickFilter) => () => void;
};

function QuickFilters(props: QuickFiltersProps) {
  const { activeQuickFilters, handleQuickFilterClick } = props;
  return (
    <div
      id="quickFilters"
      style={{
        marginBottom: '15px',
        display: 'flex',
        flexDirection: 'column',
      }}>
      <div style={{ margin: '0 0 5px 2px', fontSize: '14px' }}>Filter By</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <Chip
          clickable
          label="Pre-Installed"
          variant={'outlined'}
          color="default"
          style={{
            backgroundColor: activeQuickFilters.includes(
              QuickFilter.PreInstalled
            )
              ? '#CFCFCF'
              : 'transparent',
          }}
          onClick={handleQuickFilterClick(QuickFilter.PreInstalled)}
        />
        <Chip
          clickable
          label="Templates"
          variant={'outlined'}
          color="default"
          style={{
            backgroundColor: activeQuickFilters.includes(QuickFilter.Templates)
              ? '#CFCFCF'
              : 'transparent',
          }}
          onClick={handleQuickFilterClick(QuickFilter.Templates)}
        />
        <Chip
          clickable
          label="Widgets"
          variant={'outlined'}
          color="default"
          style={{
            backgroundColor: activeQuickFilters.includes(QuickFilter.Widgets)
              ? '#CFCFCF'
              : 'transparent',
          }}
          onClick={handleQuickFilterClick(QuickFilter.Widgets)}
        />
        <Chip
          clickable
          label="Algorithms"
          variant={'outlined'}
          color="default"
          style={{
            backgroundColor: activeQuickFilters.includes(QuickFilter.Algorithms)
              ? '#CFCFCF'
              : 'transparent',
          }}
          onClick={handleQuickFilterClick(QuickFilter.Algorithms)}
        />
        <Chip
          clickable
          label="Input Blocks"
          variant={'outlined'}
          color="default"
          style={{
            backgroundColor: activeQuickFilters.includes(
              QuickFilter.InputBlocks
            )
              ? '#CFCFCF'
              : 'transparent',
          }}
          onClick={handleQuickFilterClick(QuickFilter.InputBlocks)}
        />
      </div>
    </div>
  );
}

export { QuickFilters, QuickFilter };
