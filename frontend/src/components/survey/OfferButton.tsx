/**
 * @fileoverview Offer button component for CTA interactions
 * 
 * Individual CTA button that handles clicks and opens offers in new tabs.
 * Styled based on button variant (primary, secondary, accent).
 */

import React from 'react';
import type { CTAButtonVariant } from '@survai/shared';

export interface OfferButtonProps {
  /** Button variant configuration */
  variant: CTAButtonVariant;
  /** Click handler */
  onClick: () => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Offer button component for CTA interactions
 */
export const OfferButton: React.FC<OfferButtonProps> = ({
  variant,
  onClick,
  disabled = false
}) => {
  const getButtonStyles = () => {
    const baseStyles = {
      width: '100%',
      padding: '1rem 1.5rem',
      fontSize: '1.125rem',
      fontWeight: '600',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'all 0.2s ease-in-out',
      textAlign: 'center' as const,
      textDecoration: 'none',
      display: 'inline-block',
      lineHeight: '1.5'
    };

    switch (variant.style) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: '#3182ce',
          color: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          ':hover': {
            backgroundColor: '#2c5aa0',
            transform: 'translateY(-1px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }
        };
      
      case 'accent':
        return {
          ...baseStyles,
          backgroundColor: '#38a169',
          color: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          ':hover': {
            backgroundColor: '#2f855a',
            transform: 'translateY(-1px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }
        };
      
      case 'secondary':
      default:
        return {
          ...baseStyles,
          backgroundColor: 'white',
          color: '#3182ce',
          border: '2px solid #3182ce',
          ':hover': {
            backgroundColor: '#f7fafc',
            transform: 'translateY(-1px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }
        };
    }
  };

  const buttonStyles = getButtonStyles();

  return (
    <button
      style={buttonStyles}
      onClick={onClick}
      disabled={disabled}
      type="button"
      data-testid="offer-button"
      onMouseEnter={(e) => {
        if (!disabled && buttonStyles[':hover']) {
          Object.assign(e.currentTarget.style, buttonStyles[':hover']);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          // Reset to base styles
          e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = (buttonStyles as any).boxShadow || '';
        }
      }}
    >
      {variant.text}
    </button>
  );
};