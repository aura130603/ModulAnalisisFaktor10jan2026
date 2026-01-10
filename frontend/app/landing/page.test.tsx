import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Page from './page'

// Mock the child components to test the layout
jest.mock('./components/HeroSection', () => {
    const MockHeroSection = () => <section>Hero Section</section>;
    MockHeroSection.displayName = 'MockHeroSection';
    return MockHeroSection;
});
jest.mock('./components/Features', () => {
    const MockFeatures = () => <section>Features Section</section>;
    MockFeatures.displayName = 'MockFeatures';
    return MockFeatures;
});
jest.mock('./components/Comparison', () => {
    const MockComparison = () => <section>Comparison Section</section>;
    MockComparison.displayName = 'MockComparison';
    return MockComparison;
});
jest.mock('./components/Testimonials', () => {
    const MockTestimonials = () => <section>Testimonials Section</section>;
    MockTestimonials.displayName = 'MockTestimonials';
    return MockTestimonials;
});
jest.mock('./components/Footer', () => {
    const MockFooter = () => <footer>Footer Section</footer>;
    MockFooter.displayName = 'MockFooter';
    return MockFooter;
});


describe('Landing Page', () => {
  it('renders all sections of the landing page', () => {
    render(<Page />)

    // Check for the main heading from HeroSection (or a general one)
    expect(screen.getByText('Hero Section')).toBeInTheDocument();

    // Check for other sections
    expect(screen.getByText('Features Section')).toBeInTheDocument();
    expect(screen.getByText('Comparison Section')).toBeInTheDocument();
    expect(screen.getByText('Testimonials Section')).toBeInTheDocument();
    expect(screen.getByText('Footer Section')).toBeInTheDocument();
  })
}) 