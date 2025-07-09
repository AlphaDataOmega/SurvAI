/**
 * @fileoverview Unit tests for QuestionCard component
 * 
 * Tests for CTA question display, button interactions,
 * and error handling in the frontend.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionCard } from '../../frontend/src/components/survey/QuestionCard';
import type { Question, CTAButtonVariant } from '@survai/shared';

// Mock the OfferButton component
jest.mock('../../frontend/src/components/survey/OfferButton', () => ({
  OfferButton: ({ variant, onClick, disabled }: any) => (
    <button
      data-testid={`offer-button-${variant.id}`}
      onClick={onClick}
      disabled={disabled}
      style={{ order: variant.order }}
    >
      {variant.text}
    </button>
  ),
}));

describe('QuestionCard Component', () => {
  const mockQuestion: Question = {
    id: 'question-1',
    surveyId: 'survey-123',
    type: 'CTA_OFFER' as any,
    text: 'What are you most interested in?',
    description: 'Select the option that best matches your interests.',
    config: {
      maxButtons: 3,
      buttonLayout: 'vertical',
      ctaStyle: {
        primaryColor: '#3182ce',
        buttonSize: 'large',
      },
    },
    options: [],
    order: 1,
    logic: undefined,
    aiVersions: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOfferButtons: CTAButtonVariant[] = [
    {
      id: 'button-1',
      text: 'Get Financial Advice',
      offerId: 'offer-finance',
      style: 'primary',
      order: 1,
    },
    {
      id: 'button-2',
      text: 'Learn About Insurance',
      offerId: 'offer-insurance',
      style: 'secondary',
      order: 2,
    },
    {
      id: 'button-3',
      text: 'Health & Wellness Tips',
      offerId: 'offer-health',
      style: 'accent',
      order: 3,
    },
  ];

  const defaultProps = {
    question: mockQuestion,
    offerButtons: mockOfferButtons,
    onButtonClick: jest.fn(),
    onSkip: jest.fn(),
    isLoading: false,
    error: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render question text and description', () => {
      render(<QuestionCard {...defaultProps} />);

      expect(screen.getByText('What are you most interested in?')).toBeInTheDocument();
      expect(screen.getByText('Select the option that best matches your interests.')).toBeInTheDocument();
    });

    it('should render all offer buttons', () => {
      render(<QuestionCard {...defaultProps} />);

      expect(screen.getByTestId('offer-button-button-1')).toBeInTheDocument();
      expect(screen.getByTestId('offer-button-button-2')).toBeInTheDocument();
      expect(screen.getByTestId('offer-button-button-3')).toBeInTheDocument();

      expect(screen.getByText('Get Financial Advice')).toBeInTheDocument();
      expect(screen.getByText('Learn About Insurance')).toBeInTheDocument();
      expect(screen.getByText('Health & Wellness Tips')).toBeInTheDocument();
    });

    it('should render skip button', () => {
      render(<QuestionCard {...defaultProps} />);

      expect(screen.getByText('No Thanks, Skip')).toBeInTheDocument();
    });

    it('should render without description if not provided', () => {
      const questionWithoutDescription = {
        ...mockQuestion,
        description: undefined,
      };

      render(
        <QuestionCard
          {...defaultProps}
          question={questionWithoutDescription}
        />
      );

      expect(screen.getByText('What are you most interested in?')).toBeInTheDocument();
      expect(screen.queryByText('Select the option that best matches your interests.')).not.toBeInTheDocument();
    });

    it('should handle empty offer buttons array', () => {
      render(<QuestionCard {...defaultProps} offerButtons={[]} />);

      expect(screen.getByText('What are you most interested in?')).toBeInTheDocument();
      expect(screen.getByText('No Thanks, Skip')).toBeInTheDocument();
      expect(screen.queryByTestId('offer-button-button-1')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onButtonClick when offer button is clicked', async () => {
      const onButtonClick = jest.fn().mockResolvedValue(undefined);
      
      render(<QuestionCard {...defaultProps} onButtonClick={onButtonClick} />);

      fireEvent.click(screen.getByTestId('offer-button-button-1'));

      await waitFor(() => {
        expect(onButtonClick).toHaveBeenCalledWith('button-1', 'offer-finance');
      });
    });

    it('should call onSkip when skip button is clicked', async () => {
      const onSkip = jest.fn().mockResolvedValue(undefined);
      
      render(<QuestionCard {...defaultProps} onSkip={onSkip} />);

      fireEvent.click(screen.getByText('No Thanks, Skip'));

      await waitFor(() => {
        expect(onSkip).toHaveBeenCalledTimes(1);
      });
    });

    it('should disable buttons when loading', () => {
      render(<QuestionCard {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('offer-button-button-1')).toBeDisabled();
      expect(screen.getByTestId('offer-button-button-2')).toBeDisabled();
      expect(screen.getByTestId('offer-button-button-3')).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loading text on skip button when loading', () => {
      render(<QuestionCard {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('No Thanks, Skip')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      const errorMessage = 'Failed to load next question';
      
      render(<QuestionCard {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should not display error message when not provided', () => {
      render(<QuestionCard {...defaultProps} error={undefined} />);

      expect(screen.queryByText(/Failed to/)).not.toBeInTheDocument();
    });

    it('should display error with proper styling', () => {
      const errorMessage = 'Network error occurred';
      
      render(<QuestionCard {...defaultProps} error={errorMessage} />);

      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toHaveStyle({
        color: '#c53030',
        backgroundColor: '#fed7d7',
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading overlay when loading', () => {
      render(<QuestionCard {...defaultProps} isLoading={true} />);

      const loadingOverlay = screen.getByText('Loading...');
      expect(loadingOverlay).toBeInTheDocument();
      expect(loadingOverlay.parentElement).toHaveStyle({
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: '10',
      });
    });

    it('should not show loading overlay when not loading', () => {
      render(<QuestionCard {...defaultProps} isLoading={false} />);

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should apply horizontal layout when configured', () => {
      const questionWithHorizontalLayout = {
        ...mockQuestion,
        config: {
          ...mockQuestion.config,
          buttonLayout: 'horizontal' as const,
        },
      };

      render(
        <QuestionCard
          {...defaultProps}
          question={questionWithHorizontalLayout}
        />
      );

      // Check that buttons container has flex-direction: row
      const buttonsContainer = screen.getByTestId('offer-button-button-1').parentElement;
      expect(buttonsContainer).toHaveStyle({
        display: 'flex',
        flexDirection: 'row',
      });
    });

    it('should apply vertical layout by default', () => {
      render(<QuestionCard {...defaultProps} />);

      const buttonsContainer = screen.getByTestId('offer-button-button-1').parentElement;
      expect(buttonsContainer).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
      });
    });

    it('should have proper spacing between elements', () => {
      render(<QuestionCard {...defaultProps} />);

      const buttonsContainer = screen.getByTestId('offer-button-button-1').parentElement;
      expect(buttonsContainer).toHaveStyle({
        gap: '1rem',
        marginBottom: '2rem',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<QuestionCard {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('What are you most interested in?');
    });

    it('should have accessible button elements', () => {
      render(<QuestionCard {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // 3 offer buttons + 1 skip button

      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should maintain focus management during loading', () => {
      const { rerender } = render(<QuestionCard {...defaultProps} />);

      const firstButton = screen.getByTestId('offer-button-button-1');
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // When loading starts, buttons should be disabled but focus should be maintained
      rerender(<QuestionCard {...defaultProps} isLoading={true} />);
      
      expect(screen.getByTestId('offer-button-button-1')).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long question text', () => {
      const longQuestion = {
        ...mockQuestion,
        text: 'This is a very long question text that might wrap to multiple lines and should be handled gracefully by the component without breaking the layout or causing overflow issues in the user interface.',
      };

      render(<QuestionCard {...defaultProps} question={longQuestion} />);

      expect(screen.getByText(longQuestion.text)).toBeInTheDocument();
    });

    it('should handle special characters in question text', () => {
      const questionWithSpecialChars = {
        ...mockQuestion,
        text: 'What\'s your favorite "special" character? <>&',
      };

      render(<QuestionCard {...defaultProps} question={questionWithSpecialChars} />);

      expect(screen.getByText('What\'s your favorite "special" character? <>&')).toBeInTheDocument();
    });

    it('should handle single offer button', () => {
      const singleButton = [mockOfferButtons[0]];
      
      render(<QuestionCard {...defaultProps} offerButtons={singleButton} />);

      expect(screen.getByTestId('offer-button-button-1')).toBeInTheDocument();
      expect(screen.queryByTestId('offer-button-button-2')).not.toBeInTheDocument();
      expect(screen.getByText('No Thanks, Skip')).toBeInTheDocument();
    });

    it('should handle async button click errors gracefully', async () => {
      const onButtonClick = jest.fn().mockRejectedValue(new Error('Network error'));
      
      render(<QuestionCard {...defaultProps} onButtonClick={onButtonClick} />);

      fireEvent.click(screen.getByTestId('offer-button-button-1'));

      await waitFor(() => {
        expect(onButtonClick).toHaveBeenCalled();
      });

      // Component should not crash and should remain functional
      expect(screen.getByText('What are you most interested in?')).toBeInTheDocument();
    });
  });
});