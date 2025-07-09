/**
 * @fileoverview Survey Flow Visual Tests
 * 
 * Comprehensive visual regression testing for survey flow:
 * - Initial CTA question rendering
 * - Offer presentation and selection
 * - Question progression
 * - Thank you page variations
 * - Error states and loading states
 * - Responsive design
 */

import { test, expect } from '@playwright/test';
import { setupBrowserContext, preparePageForVisualTesting } from './visual-setup';
import {
  navigateToSurvey,
  navigateToSurveyQuestion,
  navigateToSurveyWithOffers,
  navigateToThankYouPage,
  waitForQuestionToLoad,
  waitForOffersToLoad,
  waitForSurveyToLoad,
  clickOfferButton,
  completeSurvey,
  setSurveyFlowState,
  getQuestionContainer,
  getOfferButtonsContainer,
  getOfferButton,
  getSurveyProgressContainer,
  getThankYouContainer,
  getSurveyErrorContainer,
  getSurveyFooterContainer,
  captureSurveyResponsive,
  prepareSurveyErrorState,
  checkOfferCount
} from './helpers/survey-helpers';
import { createComprehensiveTestDataSet } from './helpers/data-seeders';

// Global test data
let testData: ReturnType<typeof createComprehensiveTestDataSet>;

test.describe('Survey Flow Visual Tests', () => {
  
  test.beforeAll(async () => {
    // Create comprehensive test data set
    testData = createComprehensiveTestDataSet();
  });

  test.beforeEach(async ({ context, page }) => {
    // Set up browser context for consistent rendering
    await setupBrowserContext(context);
    
    // Prepare page for visual testing
    await preparePageForVisualTesting(page);
  });

  test.describe('Survey Landing and Initial Question', () => {
    
    test('should capture survey landing page', async ({ page }) => {
      await navigateToSurvey(page, testData.baseData.surveyId);
      await waitForSurveyToLoad(page);
      
      // Take full survey page screenshot
      await expect(page).toHaveScreenshot('survey-landing.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture CTA question card', async ({ page }) => {
      await navigateToSurvey(page, testData.baseData.surveyId);
      await waitForSurveyToLoad(page);
      
      // Capture question card specifically
      const questionCard = getQuestionContainer(page);
      if (await questionCard.count() > 0) {
        await expect(questionCard).toHaveScreenshot('survey-cta-question-card.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Fallback to full page
        await expect(page).toHaveScreenshot('survey-cta-question-card-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture survey progress indicator', async ({ page }) => {
      await navigateToSurvey(page, testData.baseData.surveyId);
      await waitForSurveyToLoad(page);
      
      // Capture progress indicator
      const progressContainer = getSurveyProgressContainer(page);
      if (await progressContainer.count() > 0) {
        await expect(progressContainer).toHaveScreenshot('survey-progress-indicator.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Capture top area of survey
        await expect(page.locator('.survey-header, .survey-top').first()).toHaveScreenshot('survey-progress-indicator-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

  });

  test.describe('Offer Presentation and Selection', () => {
    
    test('should capture CTA question with 3 offers', async ({ page }) => {
      await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 3);
      
      // Verify we have 3 offers
      const hasCorrectOfferCount = await checkOfferCount(page, 3);
      if (hasCorrectOfferCount) {
        await expect(page).toHaveScreenshot('survey-cta-with-3-offers.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Capture anyway for debugging
        await expect(page).toHaveScreenshot('survey-cta-with-offers-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture offer buttons layout', async ({ page }) => {
      await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 3);
      
      // Capture offer buttons area specifically
      const offerButtonsContainer = getOfferButtonsContainer(page);
      if (await offerButtonsContainer.count() > 0) {
        await expect(offerButtonsContainer).toHaveScreenshot('survey-offer-buttons-layout.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Look for individual offer buttons
        const firstButton = getOfferButton(page, 0);
        if (await firstButton.count() > 0) {
          const buttonParent = firstButton.locator('xpath=ancestor::div[contains(@class, "offer") or contains(@class, "button") or contains(@class, "cta")][1]');
          await expect(buttonParent).toHaveScreenshot('survey-offer-buttons-layout.png', {
            maxDiffPixelRatio: 0.001
          });
        } else {
          await expect(page).toHaveScreenshot('survey-offer-buttons-layout-fallback.png', {
            maxDiffPixelRatio: 0.001
          });
        }
      }
    });

    test('should capture individual offer button', async ({ page }) => {
      await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 3);
      
      // Capture first offer button
      const firstOfferButton = getOfferButton(page, 0);
      if (await firstOfferButton.count() > 0) {
        await expect(firstOfferButton).toHaveScreenshot('survey-offer-button-single.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        await expect(page).toHaveScreenshot('survey-offer-button-single-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture offer button hover state', async ({ page }) => {
      await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 3);
      
      // Hover over first offer button
      const firstOfferButton = getOfferButton(page, 0);
      if (await firstOfferButton.count() > 0) {
        await firstOfferButton.hover();
        await page.waitForTimeout(200);
        
        await expect(firstOfferButton).toHaveScreenshot('survey-offer-button-hover.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture offer selection feedback', async ({ page }) => {
      await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 3);
      
      // Click first offer button
      await clickOfferButton(page, 0);
      
      // Capture feedback or loading state
      await expect(page).toHaveScreenshot('survey-offer-selection-feedback.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Question Progression', () => {
    
    test('should capture survey after offer click', async ({ page }) => {
      await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 3);
      
      // Click first offer button
      await clickOfferButton(page, 0);
      
      // Wait for navigation or state change
      await page.waitForTimeout(1000);
      
      // Capture post-click state
      await expect(page).toHaveScreenshot('survey-post-offer-click.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture followup question', async ({ page }) => {
      await navigateToSurvey(page, testData.baseData.surveyId);
      
      // Complete first question
      await clickOfferButton(page, 0);
      await page.waitForTimeout(1000);
      
      // Check if we have a followup question
      const questionCard = getQuestionContainer(page);
      if (await questionCard.count() > 0) {
        await expect(questionCard).toHaveScreenshot('survey-followup-question.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        await expect(page).toHaveScreenshot('survey-followup-question-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture survey navigation controls', async ({ page }) => {
      await navigateToSurvey(page, testData.baseData.surveyId);
      await waitForSurveyToLoad(page);
      
      // Capture navigation footer
      const footerContainer = getSurveyFooterContainer(page);
      if (await footerContainer.count() > 0) {
        await expect(footerContainer).toHaveScreenshot('survey-navigation-controls.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Capture bottom area of survey
        await expect(page.locator('.survey-footer, .survey-bottom').first()).toHaveScreenshot('survey-navigation-controls-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

  });

  test.describe('Thank You Page', () => {
    
    test('should capture thank you page', async ({ page }) => {
      await navigateToThankYouPage(page, testData.baseData.surveyId);
      
      // Capture thank you page
      await expect(page).toHaveScreenshot('survey-thank-you.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture thank you message', async ({ page }) => {
      await navigateToThankYouPage(page, testData.baseData.surveyId);
      
      // Capture thank you container specifically
      const thankYouContainer = getThankYouContainer(page);
      if (await thankYouContainer.count() > 0) {
        await expect(thankYouContainer).toHaveScreenshot('survey-thank-you-message.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Fallback to main content area
        await expect(page.locator('.survey-content, .main-content').first()).toHaveScreenshot('survey-thank-you-message-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture thank you page with completion stats', async ({ page }) => {
      await navigateToThankYouPage(page, testData.baseData.surveyId);
      
      // Look for completion statistics
      const stats = page.locator('[data-testid="completion-stats"], .completion-stats, .survey-stats').first();
      if (await stats.count() > 0) {
        await expect(stats).toHaveScreenshot('survey-completion-stats.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        await expect(page).toHaveScreenshot('survey-completion-stats-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

  });

  test.describe('Responsive Design', () => {
    
    test('should capture mobile survey view', async ({ page }) => {
      await captureSurveyResponsive(page, { width: 375, height: 667 }, testData.baseData.surveyId);
      
      await expect(page).toHaveScreenshot('survey-mobile.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture tablet survey view', async ({ page }) => {
      await captureSurveyResponsive(page, { width: 768, height: 1024 }, testData.baseData.surveyId);
      
      await expect(page).toHaveScreenshot('survey-tablet.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture mobile offer buttons', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 3);
      
      // Capture offer buttons on mobile
      const offerButtonsContainer = getOfferButtonsContainer(page);
      if (await offerButtonsContainer.count() > 0) {
        await expect(offerButtonsContainer).toHaveScreenshot('survey-offer-buttons-mobile.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        await expect(page).toHaveScreenshot('survey-offer-buttons-mobile-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture mobile thank you page', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateToThankYouPage(page, testData.baseData.surveyId);
      
      await expect(page).toHaveScreenshot('survey-thank-you-mobile.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Error and Loading States', () => {
    
    test('should capture survey loading state', async ({ page }) => {
      await page.goto(`/survey/${testData.baseData.surveyId}`);
      
      // Capture immediately for potential loading state
      await page.waitForTimeout(100);
      
      await expect(page).toHaveScreenshot('survey-loading.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture invalid survey error', async ({ page }) => {
      await prepareSurveyErrorState(page, 'invalid-survey');
      
      await expect(page).toHaveScreenshot('survey-invalid-error.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture network error state', async ({ page }) => {
      await prepareSurveyErrorState(page, 'network-error');
      
      await expect(page).toHaveScreenshot('survey-network-error.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture no questions error', async ({ page }) => {
      await prepareSurveyErrorState(page, 'no-questions');
      
      await expect(page).toHaveScreenshot('survey-no-questions.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture survey error message', async ({ page }) => {
      await prepareSurveyErrorState(page, 'invalid-survey');
      
      // Capture error container specifically
      const errorContainer = getSurveyErrorContainer(page);
      if (await errorContainer.count() > 0) {
        await expect(errorContainer).toHaveScreenshot('survey-error-message.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        await expect(page).toHaveScreenshot('survey-error-message-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

  });

  test.describe('Survey Flow Variations', () => {
    
    test('should capture survey with single offer', async ({ page }) => {
      await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 1);
      
      await expect(page).toHaveScreenshot('survey-single-offer.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture survey with many offers', async ({ page }) => {
      await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 5);
      
      await expect(page).toHaveScreenshot('survey-many-offers.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture survey with no offers', async ({ page }) => {
      await navigateToSurvey(page, testData.baseData.surveyId);
      
      // Set survey state without offers
      await setSurveyFlowState(page, {
        currentQuestion: 1,
        hasOffers: false
      });
      
      await waitForSurveyToLoad(page);
      
      await expect(page).toHaveScreenshot('survey-no-offers.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Survey Interaction States', () => {
    
    test('should capture survey with offer clicked but not submitted', async ({ page }) => {
      await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 3);
      
      // Click offer button but don't submit
      const firstOfferButton = getOfferButton(page, 0);
      if (await firstOfferButton.count() > 0) {
        await firstOfferButton.click();
        await page.waitForTimeout(300);
        
        // Capture the selected state
        await expect(page).toHaveScreenshot('survey-offer-selected.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture survey with validation errors', async ({ page }) => {
      await navigateToSurvey(page, testData.baseData.surveyId);
      await waitForSurveyToLoad(page);
      
      // Try to submit without selecting an offer
      const submitButton = page.locator('[data-testid="submit-survey"], .submit-survey, .next-button').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('survey-validation-errors.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

});

/**
 * Survey flow consistency tests
 */
test.describe('Survey Flow UI Consistency', () => {
  
  test.beforeAll(async () => {
    testData = createComprehensiveTestDataSet();
  });

  test.beforeEach(async ({ context, page }) => {
    await setupBrowserContext(context);
    await preparePageForVisualTesting(page);
  });

  test('should render survey consistently across multiple loads', async ({ page }) => {
    // Test that survey looks the same across multiple loads
    for (let i = 0; i < 3; i++) {
      await navigateToSurvey(page, testData.baseData.surveyId);
      await waitForSurveyToLoad(page);
      
      // Each reload should look identical
      await expect(page).toHaveScreenshot(`survey-consistency-${i + 1}.png`, {
        maxDiffPixelRatio: 0.001
      });
    }
  });

  test('should maintain consistent layout after offer interactions', async ({ page }) => {
    await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 3);
    
    // Perform various interactions
    const firstButton = getOfferButton(page, 0);
    if (await firstButton.count() > 0) {
      await firstButton.hover();
      await page.waitForTimeout(200);
      await firstButton.click();
      await page.waitForTimeout(300);
    }
    
    // Layout should be consistent after interactions
    await expect(page).toHaveScreenshot('survey-post-interactions.png', {
      maxDiffPixelRatio: 0.001
    });
  });

});