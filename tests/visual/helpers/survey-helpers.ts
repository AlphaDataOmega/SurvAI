/**
 * @fileoverview Survey flow navigation utilities for visual testing
 * 
 * Provides utilities for navigating survey flows, handling questions and offers,
 * and managing survey states for visual regression testing.
 */

import { Page } from '@playwright/test';
import { prepareSurveyPage, prepareSurveyFlowState } from '../visual-setup';

/**
 * Survey flow state configuration
 */
export interface SurveyFlowState {
  currentQuestion: number;
  totalQuestions: number;
  hasOffers: boolean;
  showThankYou: boolean;
}

/**
 * Survey question configuration
 */
export interface SurveyQuestion {
  id: string;
  type: 'CTA' | 'FOLLOWUP' | 'RATING';
  text: string;
  offers?: SurveyOffer[];
}

/**
 * Survey offer configuration
 */
export interface SurveyOffer {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  epcScore?: number;
}

/**
 * Navigate to survey page with deterministic survey ID
 */
export async function navigateToSurvey(page: Page, surveyId: string = 'test-survey-1'): Promise<void> {
  await page.goto(`/survey/${surveyId}`);
  await page.waitForLoadState('networkidle');
  await prepareSurveyPage(page);
}

/**
 * Navigate to survey with specific question
 */
export async function navigateToSurveyQuestion(page: Page, surveyId: string, questionId: string): Promise<void> {
  await page.goto(`/survey/${surveyId}?question=${questionId}`);
  await page.waitForLoadState('networkidle');
  await prepareSurveyPage(page);
}

/**
 * Wait for survey question to load
 */
export async function waitForQuestionToLoad(page: Page): Promise<void> {
  const questionSelectors = [
    '[data-testid="question-card"], .question-card',
    '[data-testid="question-text"], .question-text',
    '[data-testid="survey-question"], .survey-question'
  ];
  
  for (const selector of questionSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
    } catch (error) {
      console.warn(`Question selector ${selector} not found, continuing...`);
    }
  }
  
  // Wait for question to stabilize
  await page.waitForTimeout(500);
}

/**
 * Wait for offers to load and stabilize
 */
export async function waitForOffersToLoad(page: Page): Promise<void> {
  const offerSelectors = [
    '[data-testid="offer-button"], .offer-button',
    '[data-testid="offer-buttons"], .offer-buttons',
    '[data-testid="cta-buttons"], .cta-buttons'
  ];
  
  for (const selector of offerSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
    } catch (error) {
      console.warn(`Offer selector ${selector} not found, continuing...`);
    }
  }
  
  // Wait for EPC ordering to stabilize
  await page.waitForTimeout(1000);
}

/**
 * Get survey question container
 */
export function getQuestionContainer(page: Page) {
  return page.locator('[data-testid="question-card"], .question-card').first();
}

/**
 * Get offer buttons container
 */
export function getOfferButtonsContainer(page: Page) {
  return page.locator('[data-testid="offer-buttons"], .offer-buttons, .cta-buttons').first();
}

/**
 * Get specific offer button
 */
export function getOfferButton(page: Page, index: number = 0) {
  return page.locator('[data-testid="offer-button"], .offer-button').nth(index);
}

/**
 * Get survey progress indicator
 */
export function getSurveyProgressContainer(page: Page) {
  return page.locator('[data-testid="survey-progress"], .survey-progress').first();
}

/**
 * Get thank you page container
 */
export function getThankYouContainer(page: Page) {
  return page.locator('[data-testid="thank-you"], .thank-you, .survey-complete').first();
}

/**
 * Click on offer button and wait for response
 */
export async function clickOfferButton(page: Page, index: number = 0): Promise<void> {
  const offerButton = getOfferButton(page, index);
  
  if (await offerButton.count() > 0) {
    await offerButton.click();
    
    // Wait for navigation or state change
    await page.waitForTimeout(1000);
    
    // Re-prepare survey page after click
    await prepareSurveyPage(page);
  }
}

/**
 * Set survey flow to specific state
 */
export async function setSurveyFlowState(page: Page, state: Partial<SurveyFlowState>): Promise<void> {
  await prepareSurveyFlowState(page, state);
}

/**
 * Navigate to next question
 */
export async function navigateToNextQuestion(page: Page): Promise<void> {
  const nextButton = page.locator('[data-testid="next-question"], .next-question, .continue-button').first();
  
  if (await nextButton.count() > 0) {
    await nextButton.click();
    await page.waitForTimeout(500);
    await waitForQuestionToLoad(page);
  }
}

/**
 * Navigate to previous question
 */
export async function navigateToPreviousQuestion(page: Page): Promise<void> {
  const prevButton = page.locator('[data-testid="prev-question"], .prev-question, .back-button').first();
  
  if (await prevButton.count() > 0) {
    await prevButton.click();
    await page.waitForTimeout(500);
    await waitForQuestionToLoad(page);
  }
}

/**
 * Complete survey flow
 */
export async function completeSurvey(page: Page): Promise<void> {
  // Click first offer button
  await clickOfferButton(page, 0);
  
  // Wait for thank you page or next question
  await page.waitForTimeout(1000);
  
  // Check if we're on thank you page
  const thankYouContainer = getThankYouContainer(page);
  if (await thankYouContainer.count() > 0) {
    await page.waitForTimeout(500);
    return;
  }
  
  // If there are more questions, continue
  const nextButton = page.locator('[data-testid="next-question"], .next-question, .continue-button').first();
  if (await nextButton.count() > 0) {
    await nextButton.click();
    await page.waitForTimeout(500);
    await waitForQuestionToLoad(page);
  }
}

/**
 * Check if survey is in loading state
 */
export async function isSurveyLoading(page: Page): Promise<boolean> {
  const loadingSelectors = [
    '.survey-loading',
    '.loading-spinner',
    '[data-testid="loading"]',
    '.question-loading'
  ];
  
  for (const selector of loadingSelectors) {
    if (await page.locator(selector).count() > 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Wait for survey to finish loading
 */
export async function waitForSurveyToLoad(page: Page): Promise<void> {
  // Wait for loading states to disappear
  await page.waitForFunction(() => {
    const loadingElements = document.querySelectorAll('.survey-loading, .loading-spinner, [data-testid="loading"], .question-loading');
    return loadingElements.length === 0;
  }, { timeout: 10000 });
  
  // Wait for question and offers to load
  await waitForQuestionToLoad(page);
  await waitForOffersToLoad(page);
}

/**
 * Capture survey in different responsive states
 */
export async function captureSurveyResponsive(page: Page, viewport: { width: number; height: number }, surveyId: string = 'test-survey-1'): Promise<void> {
  await page.setViewportSize(viewport);
  await navigateToSurvey(page, surveyId);
  await waitForSurveyToLoad(page);
  
  // Additional wait for responsive layout to settle
  await page.waitForTimeout(1000);
}

/**
 * Test survey error states
 */
export async function prepareSurveyErrorState(page: Page, errorType: 'invalid-survey' | 'network-error' | 'no-questions'): Promise<void> {
  switch (errorType) {
    case 'invalid-survey':
      await page.goto('/survey/invalid-survey-id-does-not-exist');
      await page.waitForLoadState('networkidle');
      break;
      
    case 'network-error':
      // Mock network failure
      await page.route('/api/survey/**', route => {
        route.abort('failed');
      });
      await navigateToSurvey(page);
      break;
      
    case 'no-questions':
      // Mock empty survey response
      await page.route('/api/survey/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ questions: [] })
        });
      });
      await navigateToSurvey(page);
      break;
  }
}

/**
 * Get survey with CTA question and offers
 */
export async function navigateToSurveyWithOffers(page: Page, surveyId: string = 'test-survey-1', offerCount: number = 3): Promise<void> {
  await navigateToSurvey(page, surveyId);
  
  // Set survey flow state with offers
  await setSurveyFlowState(page, {
    currentQuestion: 1,
    hasOffers: true,
    offersCount: offerCount
  });
  
  await waitForSurveyToLoad(page);
}

/**
 * Navigate to survey thank you page
 */
export async function navigateToThankYouPage(page: Page, surveyId: string = 'test-survey-1'): Promise<void> {
  await navigateToSurvey(page, surveyId);
  await completeSurvey(page);
  
  // Wait for thank you page to load
  await page.waitForSelector('[data-testid="thank-you"], .thank-you, .survey-complete', { timeout: 5000 });
  await page.waitForTimeout(500);
}

/**
 * Get survey error container
 */
export function getSurveyErrorContainer(page: Page) {
  return page.locator('[data-testid="survey-error"], .survey-error, .error-message').first();
}

/**
 * Check if survey has specific number of offers
 */
export async function checkOfferCount(page: Page, expectedCount: number): Promise<boolean> {
  const offerButtons = page.locator('[data-testid="offer-button"], .offer-button');
  const actualCount = await offerButtons.count();
  return actualCount === expectedCount;
}

/**
 * Get survey footer container
 */
export function getSurveyFooterContainer(page: Page) {
  return page.locator('[data-testid="survey-footer"], .survey-footer, .survey-navigation').first();
}