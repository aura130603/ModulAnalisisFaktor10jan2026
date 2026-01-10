import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptionsTab from '../components/OptionsTab';
import { OptionsTabProps } from '../types';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, id }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-testid={id || 'button'}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, className, id, disabled }: any) => (
    <input 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      className={className}
      data-testid={id || 'input'}
      disabled={disabled}
    />
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, className, id }: any) => (
    <input 
      type="checkbox"
      checked={checked} 
      onChange={(e) => onCheckedChange?.(e.target.checked)} 
      className={className}
      data-testid={id || 'checkbox'}
    />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className, htmlFor }: any) => (
    <label className={className} htmlFor={htmlFor} data-testid="label">
      {children}
    </label>
  ),
}));

jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children, value, onValueChange }: any) => (
    <div data-testid="radio-group" data-value={value}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ value, id }: any) => (
    <input 
      type="radio" 
      value={value} 
      id={id} 
      data-testid={`radio-${value}`}
    />
  ),
}));

jest.mock('@/components/Common/TourComponents', () => ({
  ActiveElementHighlight: ({ active, children }: any) => (
    <div data-testid="active-element-highlight" data-active={active}>
      {children}
    </div>
  ),
}));

describe('OptionsTab Component', () => {
  const defaultProps: OptionsTabProps = {
    expectedRange: {
      getFromData: true,
      useSpecifiedRange: false
    },
    setExpectedRange: jest.fn(),
    rangeValue: {
      lowerValue: null,
      upperValue: null
    },
    setRangeValue: jest.fn(),
    expectedValue: {
      allCategoriesEqual: true,
      values: false,
      inputValue: null
    },
    setExpectedValue: jest.fn(),
    expectedValueList: [],
    setExpectedValueList: jest.fn(),
    displayStatistics: {
      descriptive: false,
      quartiles: false
    },
    setDisplayStatistics: jest.fn(),
    highlightedExpectedValueIndex: null,
    setHighlightedExpectedValueIndex: jest.fn(),
    addExpectedValue: jest.fn(),
    removeExpectedValue: jest.fn(),
    changeExpectedValue: jest.fn(),
    tourActive: false,
    currentStep: 0,
    tourSteps: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const mergedProps = { ...defaultProps, ...props };
    return render(<OptionsTab {...mergedProps} />);
  };

  describe('Initial Render', () => {
    it('should render the options tab with correct title', () => {
      renderComponent();
      
      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByText('Expected Range')).toBeInTheDocument();
    });

    it('should display all available options', () => {
      renderComponent();
      
      expect(screen.getByLabelText('Descriptive')).toBeInTheDocument();
      expect(screen.getByLabelText('Quartiles')).toBeInTheDocument();
    });

    it('should show default settings', () => {
      renderComponent();
      
      expect(screen.getByLabelText('Descriptive')).not.toBeChecked();
      expect(screen.getByLabelText('Quartiles')).not.toBeChecked();
    });
  });

  describe('Display Statistics Options', () => {
    it('should allow toggling descriptive statistics', async () => {
      const user = userEvent.setup();
      const mockSetDisplayStatistics = jest.fn();
      
      renderComponent({ setDisplayStatistics: mockSetDisplayStatistics });
      
      const descriptiveCheckbox = screen.getByLabelText('Descriptive');
      await user.click(descriptiveCheckbox);
      
      expect(mockSetDisplayStatistics).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: false
      });
    });

    it('should allow toggling quartiles', async () => {
      const user = userEvent.setup();
      const mockSetDisplayStatistics = jest.fn();
      
      renderComponent({ setDisplayStatistics: mockSetDisplayStatistics });
      
      const quartilesCheckbox = screen.getByLabelText('Quartiles');
      await user.click(quartilesCheckbox);
      
      expect(mockSetDisplayStatistics).toHaveBeenCalledWith({
        descriptive: false,
        quartiles: true
      });
    });

    it('should maintain state when options are already selected', () => {
      renderComponent({
        displayStatistics: {
          descriptive: true,
          quartiles: true
        }
      });
      
      expect(screen.getByLabelText('Descriptive')).toBeChecked();
      expect(screen.getByLabelText('Quartiles')).toBeChecked();
    });
  });

  describe('Expected Range Options', () => {
    it('should show expected range options', () => {
      renderComponent();
      
      expect(screen.getByText('Get from data')).toBeInTheDocument();
      expect(screen.getByText('Use specified range')).toBeInTheDocument();
    });

    it('should handle expected range changes', async () => {
      const user = userEvent.setup();
      const mockSetExpectedRange = jest.fn();
      
      renderComponent({ setExpectedRange: mockSetExpectedRange });
      
      const useSpecifiedRangeRadio = screen.getByTestId('radio-useSpecifiedRange');
      await user.click(useSpecifiedRangeRadio);
      
      expect(mockSetExpectedRange).toHaveBeenCalledWith({
        getFromData: false,
        useSpecifiedRange: true
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for checkboxes', () => {
      renderComponent();
      
      expect(screen.getByLabelText('Descriptive')).toBeInTheDocument();
      expect(screen.getByLabelText('Quartiles')).toBeInTheDocument();
    });

    it('should have proper checkbox roles', () => {
      renderComponent();
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });

    it('should have proper keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockSetDisplayStatistics = jest.fn();
      
      renderComponent({ setDisplayStatistics: mockSetDisplayStatistics });
      
      const descriptiveCheckbox = screen.getByLabelText('Descriptive');
      
      // Focus the checkbox
      descriptiveCheckbox.focus();
      expect(descriptiveCheckbox).toHaveFocus();
      
      // Use space to toggle
      await user.keyboard(' ');
      expect(mockSetDisplayStatistics).toHaveBeenCalledWith({
        descriptive: true,
        quartiles: false
      });
    });
  });

  describe('State Management', () => {
    it('should update when props change', () => {
      const { rerender } = renderComponent({
        displayStatistics: {
          descriptive: false,
          quartiles: false
        }
      });
      
      expect(screen.getByLabelText('Descriptive')).not.toBeChecked();
      
      // Update props
      rerender(
        <OptionsTab
          {...defaultProps}
          displayStatistics={{
            descriptive: true,
            quartiles: false
          }}
        />
      );
      
      expect(screen.getByLabelText('Descriptive')).toBeChecked();
    });
  });

  describe('Tour Guide Integration', () => {
    it('should show tour highlighting when tour is active', () => {
      renderComponent({
        tourActive: true,
        currentStep: 0
      });
      
      // Check that tour-related elements are present
      expect(screen.getByTestId('active-element-highlight')).toBeInTheDocument();
    });
  });
}); 