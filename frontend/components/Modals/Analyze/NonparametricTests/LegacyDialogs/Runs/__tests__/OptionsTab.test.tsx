import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptionsTab from '../components/OptionsTab';
import { TourStep, CutPointOptions, DisplayStatisticsOptions } from '../types';

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

jest.mock('@/components/ui/separator', () => ({
  Separator: ({ className, orientation }: any) => (
    <div className={className} data-testid="separator" data-orientation={orientation} />
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: any) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
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

describe('OptionsTab Component', () => {
  const defaultProps = {
    cutPoint: {
      median: false,
      mode: false,
      mean: false,
      custom: false
    } as CutPointOptions,
    setCutPoint: jest.fn(),
    customValue: 0,
    setCustomValue: jest.fn(),
    displayStatistics: {
      descriptive: true,
      quartiles: false
    } as DisplayStatisticsOptions,
    setDisplayStatistics: jest.fn(),
    tourActive: false,
    currentStep: 0,
    tourSteps: [] as TourStep[],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render cut point options', () => {
    render(<OptionsTab {...defaultProps} />);
    
    expect(screen.getByText('Cut Point')).toBeVisible();
    expect(screen.getByText('Median')).toBeVisible();
    expect(screen.getByText('Mean')).toBeVisible();
    expect(screen.getByText('Mode')).toBeVisible();
    expect(screen.getByText('Custom')).toBeVisible();
  });

  it('should render display statistics option', () => {
    render(<OptionsTab {...defaultProps} />);
    
    expect(screen.getByText('Statistics')).toBeVisible();
    expect(screen.getByText('Descriptive')).toBeVisible();
    expect(screen.getByText('Quartiles')).toBeVisible();
  });

  it('should show custom value input when cutPoint.custom is true', () => {
    render(<OptionsTab {...defaultProps} cutPoint={{ ...defaultProps.cutPoint, custom: true }} />);
    
    expect(screen.getByTestId('custom-value')).toBeVisible();
  });

  it('should hide custom value input when cutPoint.custom is false', () => {
    render(<OptionsTab {...defaultProps} cutPoint={{ ...defaultProps.cutPoint, custom: false }} />);
    
    const customValueInput = screen.getByTestId('custom-value') as HTMLInputElement;
    expect(customValueInput.disabled).toBe(true);
  });

  it('should display current custom value in input', () => {
    render(<OptionsTab {...defaultProps} cutPoint={{ ...defaultProps.cutPoint, custom: true }} customValue={10.5} />);
    
    const customValueInput = screen.getByTestId('custom-value') as HTMLInputElement;
    expect(customValueInput.value).toBe('10.5');
  });

  it('should display current display statistics state in checkbox', () => {
    render(<OptionsTab {...defaultProps} displayStatistics={{ descriptive: false, quartiles: false }} />);
    
    const descriptiveCheckbox = screen.getByTestId('descriptive');
    expect(descriptiveCheckbox).not.toBeChecked();
  });

  it('should show tour highlighting when tour is active', () => {
    const tourSteps: TourStep[] = [
      {
        title: 'Cut Point Options',
        content: 'Select cut point method here',
        targetId: 'cut-point-options',
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: 'info'
      },
    ];
    
    render(<OptionsTab {...defaultProps} tourActive={true} currentStep={0} tourSteps={tourSteps} />);
    
    // Check that the component renders without errors when tour is active
    expect(screen.getByText('Cut Point')).toBeVisible();
    expect(screen.getByText('Statistics')).toBeVisible();
  });

  it('should render all cut point checkbox options', () => {
    render(<OptionsTab {...defaultProps} />);
    
    expect(screen.getByTestId('median')).toBeVisible();
    expect(screen.getByTestId('mean')).toBeVisible();
    expect(screen.getByTestId('mode')).toBeVisible();
    expect(screen.getByTestId('custom')).toBeVisible();
  });

  it('should show correct checkbox state', () => {
    render(<OptionsTab {...defaultProps} cutPoint={{ ...defaultProps.cutPoint, custom: true }} />);
    
    const customCheckbox = screen.getByTestId('custom');
    expect(customCheckbox).toBeChecked();
  });

  it('should render with proper types', () => {
    // This test ensures the component can be rendered with the correct TypeScript types
    const propsWithAllTypes = {
      cutPoint: {
        median: true,
        mode: false,
        mean: true,
        custom: false
      } as CutPointOptions,
      setCutPoint: jest.fn(),
      customValue: 5.5,
      setCustomValue: jest.fn(),
      displayStatistics: {
        descriptive: true,
        quartiles: true
      } as DisplayStatisticsOptions,
      setDisplayStatistics: jest.fn(),
      tourActive: true,
      currentStep: 1,
      tourSteps: [
        {
          title: 'Test Step',
          content: 'Test content',
          targetId: 'test-target',
          defaultPosition: 'bottom',
          defaultHorizontalPosition: null,
          icon: 'info'
        }
      ] as TourStep[],
    };

    expect(() => render(<OptionsTab {...propsWithAllTypes} />)).not.toThrow();
  });
}); 