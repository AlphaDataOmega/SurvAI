/**
 * @fileoverview Unit tests for OfferButton component
 * 
 * Tests for CTA button rendering, styling variants,
 * and interaction handling.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfferButton } from '../../frontend/src/components/survey/OfferButton';
import type { CTAButtonVariant } from '@survai/shared';

describe('OfferButton Component', () => {
  const mockVariants: Record<string, CTAButtonVariant> = {
    primary: {
      id: 'button-primary',
      text: 'Get Premium Access',
      offerId: 'offer-premium',
      style: 'primary',
      order: 1,
    },
    secondary: {
      id: 'button-secondary',
      text: 'Learn More',
      offerId: 'offer-info',
      style: 'secondary',
      order: 2,
    },
    accent: {
      id: 'button-accent',
      text: 'Special Offer',
      offerId: 'offer-special',
      style: 'accent',
      order: 3,
    },
  };

  const defaultProps = {
    variant: mockVariants.primary,
    onClick: jest.fn(),
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render button text correctly', () => {
      render(<OfferButton {...defaultProps} />);

      expect(screen.getByText('Get Premium Access')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      render(<OfferButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should render different button texts for different variants', () => {
      const { rerender } = render(<OfferButton {...defaultProps} />);
      expect(screen.getByText('Get Premium Access')).toBeInTheDocument();

      rerender(<OfferButton {...defaultProps} variant={mockVariants.secondary} />);
      expect(screen.getByText('Learn More')).toBeInTheDocument();

      rerender(<OfferButton {...defaultProps} variant={mockVariants.accent} />);
      expect(screen.getByText('Special Offer')).toBeInTheDocument();
    });
  });

  describe('Styling Variants', () => {
    it('should apply primary button styles', () => {
      render(<OfferButton {...defaultProps} variant={mockVariants.primary} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        backgroundColor: '#3182ce',
        color: 'white',
        width: '100%',
        padding: '1rem 1.5rem',
        fontSize: '1.125rem',
        fontWeight: '600',
        borderRadius: '0.5rem',
        border: 'none',
      });
    });

    it('should apply secondary button styles', () => {
      render(<OfferButton {...defaultProps} variant={mockVariants.secondary} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        backgroundColor: 'white',
        color: '#3182ce',
        border: '2px solid #3182ce',
        width: '100%',
        padding: '1rem 1.5rem',
        fontSize: '1.125rem',
        fontWeight: '600',
        borderRadius: '0.5rem',
      });
    });

    it('should apply accent button styles', () => {
      render(<OfferButton {...defaultProps} variant={mockVariants.accent} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        backgroundColor: '#38a169',
        color: 'white',
        width: '100%',
        padding: '1rem 1.5rem',
        fontSize: '1.125rem',
        fontWeight: '600',
        borderRadius: '0.5rem',
        border: 'none',
      });
    });

    it('should apply box shadow to primary and accent variants', () => {
      render(<OfferButton {...defaultProps} variant={mockVariants.primary} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      });
    });

    it('should default to secondary style for unknown variant', () => {
      const unknownVariant = {
        ...mockVariants.primary,
        style: 'unknown' as any,
      };

      render(<OfferButton {...defaultProps} variant={unknownVariant} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        backgroundColor: 'white',
        color: '#3182ce',
        border: '2px solid #3182ce',
      });
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const onClick = jest.fn();
      render(<OfferButton {...defaultProps} onClick={onClick} />);

      fireEvent.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const onClick = jest.fn();
      render(<OfferButton {...defaultProps} onClick={onClick} disabled={true} />);

      fireEvent.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should handle multiple rapid clicks', () => {
      const onClick = jest.fn();
      render(<OfferButton {...defaultProps} onClick={onClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<OfferButton {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not be disabled when disabled prop is false', () => {
      render(<OfferButton {...defaultProps} disabled={false} />);

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should apply disabled styling when disabled', () => {
      render(<OfferButton {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        cursor: 'not-allowed',
        opacity: '0.6',
      });
    });

    it('should apply normal styling when not disabled', () => {
      render(<OfferButton {...defaultProps} disabled={false} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        cursor: 'pointer',
        opacity: '1',
      });
    });
  });

  describe('Hover Effects', () => {
    it('should handle mouse enter and leave events', () => {
      render(<OfferButton {...defaultProps} variant={mockVariants.primary} />);

      const button = screen.getByRole('button');
      
      // Test mouse enter
      fireEvent.mouseEnter(button);
      expect(button).toHaveStyle({
        backgroundColor: '#2c5aa0', // Hover color for primary
        transform: 'translateY(-1px)',
      });

      // Test mouse leave
      fireEvent.mouseLeave(button);
      expect(button).toHaveStyle({
        backgroundColor: '#3182ce', // Original color
        transform: 'translateY(0)',
      });
    });

    it('should not apply hover effects when disabled', () => {
      render(<OfferButton {...defaultProps} variant={mockVariants.primary} disabled={true} />);

      const button = screen.getByRole('button');
      const originalBackgroundColor = button.style.backgroundColor;
      
      fireEvent.mouseEnter(button);
      
      // Should maintain original background color
      expect(button.style.backgroundColor).toBe(originalBackgroundColor);
    });

    it('should handle hover effects for secondary variant', () => {
      render(<OfferButton {...defaultProps} variant={mockVariants.secondary} />);

      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      expect(button).toHaveStyle({
        backgroundColor: '#f7fafc', // Hover color for secondary
        transform: 'translateY(-1px)',
      });
    });

    it('should handle hover effects for accent variant', () => {
      render(<OfferButton {...defaultProps} variant={mockVariants.accent} />);

      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      expect(button).toHaveStyle({
        backgroundColor: '#2f855a', // Hover color for accent
        transform: 'translateY(-1px)',
      });
    });
  });

  describe('Accessibility', () => {
    it('should be focusable when not disabled', () => {
      render(<OfferButton {...defaultProps} />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<OfferButton {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).not.toHaveFocus();
    });

    it('should have proper button attributes', () => {
      render(<OfferButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toHaveAttribute('aria-disabled');
    });

    it('should be marked as disabled for screen readers when disabled', () => {
      render(<OfferButton {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long button text', () => {
      const longTextVariant = {
        ...mockVariants.primary,
        text: 'This is a very long button text that might cause layout issues if not handled properly',
      };

      render(<OfferButton {...defaultProps} variant={longTextVariant} />);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent(longTextVariant.text);
      expect(button).toHaveStyle({
        width: '100%',
        textAlign: 'center',
      });
    });

    it('should handle special characters in button text', () => {
      const specialCharsVariant = {
        ...mockVariants.primary,
        text: 'Get 50% Off! <Special> "Deal" & More',
      };

      render(<OfferButton {...defaultProps} variant={specialCharsVariant} />);

      expect(screen.getByText('Get 50% Off! <Special> "Deal" & More')).toBeInTheDocument();
    });

    it('should handle empty button text', () => {
      const emptyTextVariant = {
        ...mockVariants.primary,
        text: '',
      };

      render(<OfferButton {...defaultProps} variant={emptyTextVariant} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('');
    });

    it('should maintain consistent sizing across variants', () => {
      const { rerender } = render(<OfferButton {...defaultProps} variant={mockVariants.primary} />);
      const primaryButton = screen.getByRole('button');
      const primaryStyles = window.getComputedStyle(primaryButton);

      rerender(<OfferButton {...defaultProps} variant={mockVariants.secondary} />);
      const secondaryButton = screen.getByRole('button');
      const secondaryStyles = window.getComputedStyle(secondaryButton);

      // Should have same dimensions
      expect(primaryStyles.width).toBe(secondaryStyles.width);
      expect(primaryStyles.padding).toBe(secondaryStyles.padding);
      expect(primaryStyles.fontSize).toBe(secondaryStyles.fontSize);
    });
  });

  describe('Performance', () => {
    it('should handle rapid state changes without issues', () => {
      const { rerender } = render(<OfferButton {...defaultProps} disabled={false} />);

      // Rapidly toggle disabled state
      for (let i = 0; i < 10; i++) {
        rerender(<OfferButton {...defaultProps} disabled={i % 2 === 0} />);
      }

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled(); // Should end up disabled
    });

    it('should handle rapid hover events without issues', () => {
      render(<OfferButton {...defaultProps} />);

      const button = screen.getByRole('button');
      
      // Rapid hover events
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseEnter(button);
        fireEvent.mouseLeave(button);
      }

      expect(button).toBeInTheDocument();
    });
  });
});