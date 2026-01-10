import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FindReplaceContent } from '../FindReplaceContent';
import { useFindReplaceForm } from '../../hooks/useFindReplaceForm';
import { TabType } from '../../types';
import '@testing-library/jest-dom';

jest.mock('../../hooks/useFindReplaceForm');
const mockedUseFindReplaceForm = useFindReplaceForm as jest.Mock;

jest.mock('../Tour', () => ({
  TourPopup: jest.fn(() => null),
  ActiveElementHighlight: jest.fn(() => null),
}));

const mockHandleFindChange = jest.fn();
const mockHandleReplaceChange = jest.fn();
const mockHandleFindNext = jest.fn();
const mockHandleReplace = jest.fn();
const mockHandleReplaceAll = jest.fn();
const mockSetActiveTab = jest.fn();
const mockSetSelectedColumnName = jest.fn();

const defaultMockData = {
  activeTab: TabType.FIND,
  setActiveTab: mockSetActiveTab,
  columnNames: ['Var1', 'Var2'],
  selectedColumnName: 'Var1',
  setSelectedColumnName: mockSetSelectedColumnName,
  findText: '',
  handleFindChange: mockHandleFindChange,
  replaceText: '',
  handleReplaceChange: mockHandleReplaceChange,
  matchCase: false,
  setMatchCase: jest.fn(),
  matchTo: 'contains',
  setMatchTo: jest.fn(),
  direction: 'down',
  setDirection: jest.fn(),
  findError: '',
  replaceError: '',
  handleFindNext: mockHandleFindNext,
  handleFindPrevious: jest.fn(),
  handleReplace: mockHandleReplace,
  handleReplaceAll: mockHandleReplaceAll,
  searchResultsCount: 0,
  currentResultNumber: 0,
};

describe('FindReplaceContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseFindReplaceForm.mockReturnValue(defaultMockData);
  });

  it('renders the Find tab correctly', () => {
    render(<FindReplaceContent onClose={jest.fn()} defaultTab={TabType.FIND}/>);

    expect(screen.getByLabelText('Column:')).toBeInTheDocument();
    expect(screen.getByLabelText('Find:')).toBeInTheDocument();
    expect(screen.queryByLabelText('Replace with:')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /find next/i })).toBeInTheDocument();
  });

  it('switches to the Replace tab and shows replace fields', async () => {
    render(<FindReplaceContent onClose={jest.fn()} defaultTab={TabType.FIND} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('tab', { name: /replace/i }));

    expect(mockSetActiveTab).toHaveBeenCalledWith(TabType.REPLACE);
  });
  
  it('renders the Replace tab correctly when active', () => {
    mockedUseFindReplaceForm.mockReturnValue({ ...defaultMockData, activeTab: TabType.REPLACE });
    render(<FindReplaceContent onClose={jest.fn()} defaultTab={TabType.REPLACE}/>);

    expect(screen.getByLabelText('Replace with:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^replace$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /replace all/i })).toBeInTheDocument();
  });

  it('calls handleFindChange when user types in Find input', async () => {
    render(<FindReplaceContent onClose={jest.fn()} defaultTab={TabType.FIND} />);
    const user = userEvent.setup();
    const findInput = screen.getByLabelText('Find:');

    await user.type(findInput, 'test');
    
    // The hook debounces, so we check the value, not the call count
    expect(mockHandleFindChange).toHaveBeenCalledWith('t');
    expect(mockHandleFindChange).toHaveBeenCalledWith('e');
    expect(mockHandleFindChange).toHaveBeenCalledWith('s');
    expect(mockHandleFindChange).toHaveBeenCalledWith('t');
  });

  it('calls handleReplaceChange when user types in Replace input', async () => {
    mockedUseFindReplaceForm.mockReturnValue({ ...defaultMockData, activeTab: TabType.REPLACE });
    render(<FindReplaceContent onClose={jest.fn()} defaultTab={TabType.REPLACE}/>);
    const user = userEvent.setup();
    const replaceInput = screen.getByLabelText('Replace with:');

    await user.type(replaceInput, 'new');

    expect(mockHandleReplaceChange).toHaveBeenCalledWith('n');
    expect(mockHandleReplaceChange).toHaveBeenCalledWith('e');
    expect(mockHandleReplaceChange).toHaveBeenCalledWith('w');
  });

  it('calls handleFindNext when Find Next button is clicked', async () => {
    mockedUseFindReplaceForm.mockReturnValue({ ...defaultMockData, findText: 'test' });
    render(<FindReplaceContent onClose={jest.fn()} defaultTab={TabType.FIND} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /find next/i }));

    expect(mockHandleFindNext).toHaveBeenCalledTimes(1);
  });
  
  it('displays search results count', () => {
    mockedUseFindReplaceForm.mockReturnValue({
      ...defaultMockData,
      findText: 'a',
      searchResultsCount: 5,
      currentResultNumber: 2,
    });
    render(<FindReplaceContent onClose={jest.fn()} defaultTab={TabType.FIND}/>);
    
    expect(screen.getByText('2 of 5')).toBeInTheDocument();
  });
  
  it('displays "No results" message', () => {
    mockedUseFindReplaceForm.mockReturnValue({
      ...defaultMockData,
      findText: 'xyz',
      searchResultsCount: 0,
    });
    render(<FindReplaceContent onClose={jest.fn()} defaultTab={TabType.FIND}/>);
    
    expect(screen.getByText('No results')).toBeInTheDocument();
  });
  
  it('displays find error message', () => {
    mockedUseFindReplaceForm.mockReturnValue({
      ...defaultMockData,
      findText: 'test',
      findError: 'Something went wrong',
    });
    render(<FindReplaceContent onClose={jest.fn()} defaultTab={TabType.FIND} />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
}); 