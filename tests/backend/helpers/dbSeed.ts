/**
 * @fileoverview Database seeding utilities for testing
 * 
 * Provides helper functions to create test data for database operations
 * with proper cleanup and transaction support.
 */

import { PrismaClient } from '@prisma/client';
import type { 
  UserRole, 
  OfferCategory, 
  OfferStatus, 
  QuestionType,
  SurveyStatus 
} from '@survai/shared';

const prisma = new PrismaClient();

/**
 * Creates a test user with specified role and email
 * 
 * @param role - User role (defaults to ADMIN)
 * @param email - User email (defaults to timestamped email)
 * @returns Promise<User> - Created user object
 */
export const createTestUser = async (
  role: UserRole = 'ADMIN',
  email?: string
) => {
  const userEmail = email || `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  
  return await prisma.user.create({
    data: {
      email: userEmail,
      name: 'Test User',
      role,
      isActive: true,
    },
  });
};

/**
 * Creates a test offer with specified parameters
 * 
 * @param userId - ID of the user creating the offer
 * @param overrides - Optional overrides for offer data
 * @returns Promise<Offer> - Created offer object
 */
export const createTestOffer = async (
  userId: string,
  overrides: Partial<{
    title: string;
    description: string;
    category: OfferCategory;
    status: OfferStatus;
    destinationUrl: string;
    payout: number;
    currency: string;
    dailyClickCap: number;
    totalClickCap: number;
    cooldownPeriod: number;
    geoTargeting: string[];
    deviceTargeting: string[];
  }> = {}
) => {
  const defaultData = {
    title: 'Test Offer',
    description: 'Test offer description',
    category: 'FINANCE' as OfferCategory,
    status: 'ACTIVE' as OfferStatus,
    destinationUrl: 'https://example.com/test-offer',
    config: {
      payout: overrides.payout || 50.00,
      currency: overrides.currency || 'USD',
      dailyClickCap: overrides.dailyClickCap || 1000,
      totalClickCap: overrides.totalClickCap || 50000,
      cooldownPeriod: overrides.cooldownPeriod || 24
    },
    targeting: {
      geoTargeting: overrides.geoTargeting || ['US', 'CA'],
      deviceTargeting: overrides.deviceTargeting || ['desktop', 'mobile']
    },
    createdBy: userId,
    ...overrides
  };

  return await prisma.offer.create({
    data: defaultData,
  });
};

/**
 * Creates a test survey with specified parameters
 * 
 * @param userId - ID of the user creating the survey
 * @param overrides - Optional overrides for survey data
 * @returns Promise<Survey> - Created survey object
 */
export const createTestSurvey = async (
  userId: string,
  overrides: Partial<{
    title: string;
    description: string;
    status: SurveyStatus;
    isActive: boolean;
  }> = {}
) => {
  const defaultData = {
    title: 'Test Survey',
    description: 'Test survey description',
    status: 'ACTIVE' as SurveyStatus,
    isActive: true,
    createdBy: userId,
    ...overrides
  };

  return await prisma.survey.create({
    data: defaultData,
  });
};

/**
 * Creates a test question with specified parameters
 * 
 * @param surveyId - ID of the survey the question belongs to
 * @param userId - ID of the user creating the question
 * @param overrides - Optional overrides for question data
 * @returns Promise<Question> - Created question object
 */
export const createTestQuestion = async (
  surveyId: string,
  userId: string,
  overrides: Partial<{
    title: string;
    description: string;
    type: QuestionType;
    order: number;
    isActive: boolean;
  }> = {}
) => {
  const defaultData = {
    title: 'Test Question',
    description: 'Test question description',
    type: 'SINGLE_CHOICE' as QuestionType,
    order: 1,
    isActive: true,
    surveyId,
    createdBy: userId,
    ...overrides
  };

  return await prisma.question.create({
    data: defaultData,
  });
};

/**
 * Creates a test session with specified parameters
 * 
 * @param surveyId - ID of the survey
 * @param overrides - Optional overrides for session data
 * @returns Promise<Session> - Created session object
 */
export const createTestSession = async (
  surveyId: string,
  overrides: Partial<{
    clickId: string;
    sessionId: string;
    userAgent: string;
    ipAddress: string;
    referrer: string;
    deviceType: string;
    geoLocation: string;
  }> = {}
) => {
  const defaultData = {
    clickId: `test-click-${Date.now()}`,
    sessionId: `test-session-${Date.now()}`,
    userAgent: 'Mozilla/5.0 (Test Browser)',
    ipAddress: '127.0.0.1',
    referrer: 'https://example.com',
    deviceType: 'desktop',
    geoLocation: 'US',
    surveyId,
    startedAt: new Date(),
    isActive: true,
    ...overrides
  };

  return await prisma.session.create({
    data: defaultData,
  });
};

/**
 * Creates a test click track with specified parameters
 * 
 * @param sessionId - ID of the session
 * @param offerId - ID of the offer
 * @param overrides - Optional overrides for click track data
 * @returns Promise<ClickTrack> - Created click track object
 */
export const createTestClickTrack = async (
  sessionId: string,
  offerId: string,
  overrides: Partial<{
    clickId: string;
    userAgent: string;
    ipAddress: string;
    referrer: string;
    deviceType: string;
    geoLocation: string;
  }> = {}
) => {
  const defaultData = {
    clickId: `test-click-${Date.now()}`,
    userAgent: 'Mozilla/5.0 (Test Browser)',
    ipAddress: '127.0.0.1',
    referrer: 'https://example.com',
    deviceType: 'desktop',
    geoLocation: 'US',
    sessionId,
    offerId,
    clickedAt: new Date(),
    ...overrides
  };

  return await prisma.clickTrack.create({
    data: defaultData,
  });
};

/**
 * Creates a test conversion track with specified parameters
 * 
 * @param clickId - ID of the click track
 * @param overrides - Optional overrides for conversion data
 * @returns Promise<ConversionTrack> - Created conversion track object
 */
export const createTestConversionTrack = async (
  clickId: string,
  overrides: Partial<{
    revenue: number;
    conversionValue: number;
    conversionType: string;
  }> = {}
) => {
  const defaultData = {
    revenue: 25.00,
    conversionValue: 25.00,
    conversionType: 'PURCHASE',
    convertedAt: new Date(),
    clickId,
    ...overrides
  };

  return await prisma.conversionTrack.create({
    data: defaultData,
  });
};

/**
 * Creates a test widget analytics entry
 * 
 * @param overrides - Optional overrides for widget analytics data
 * @returns Promise<WidgetAnalytics> - Created widget analytics object
 */
export const createTestWidgetAnalytics = async (
  overrides: Partial<{
    partnerId: string;
    surveyId: string;
    sessionId: string;
    eventType: string;
    eventData: any;
    userAgent: string;
    ipAddress: string;
    referrer: string;
  }> = {}
) => {
  const defaultData = {
    partnerId: 'test-partner-123',
    surveyId: 'test-survey-456',
    sessionId: `test-session-${Date.now()}`,
    eventType: 'impression',
    eventData: { test: 'data' },
    userAgent: 'Mozilla/5.0 (Test Browser)',
    ipAddress: '127.0.0.1',
    referrer: 'https://example.com',
    timestamp: new Date(),
    ...overrides
  };

  return await prisma.widgetAnalytics.create({
    data: defaultData,
  });
};

/**
 * Cleans up all test data from the database
 * 
 * @param options - Options for cleanup
 * @returns Promise<void>
 */
export const cleanupTestData = async (
  options: {
    userIds?: string[];
    surveyIds?: string[];
    offerIds?: string[];
    sessionIds?: string[];
    clickIds?: string[];
    skipAll?: boolean;
  } = {}
) => {
  if (options.skipAll) {
    return;
  }

  // Clean up in reverse dependency order
  if (options.clickIds?.length) {
    await prisma.conversionTrack.deleteMany({
      where: { clickId: { in: options.clickIds } },
    });
  }

  if (options.sessionIds?.length) {
    await prisma.clickTrack.deleteMany({
      where: { sessionId: { in: options.sessionIds } },
    });
  }

  await prisma.widgetAnalytics.deleteMany({
    where: options.sessionIds?.length ? { sessionId: { in: options.sessionIds } } : {},
  });

  if (options.sessionIds?.length) {
    await prisma.session.deleteMany({
      where: { id: { in: options.sessionIds } },
    });
  }

  if (options.surveyIds?.length) {
    await prisma.question.deleteMany({
      where: { surveyId: { in: options.surveyIds } },
    });
  }

  if (options.offerIds?.length) {
    await prisma.offer.deleteMany({
      where: { id: { in: options.offerIds } },
    });
  }

  if (options.surveyIds?.length) {
    await prisma.survey.deleteMany({
      where: { id: { in: options.surveyIds } },
    });
  }

  if (options.userIds?.length) {
    await prisma.user.deleteMany({
      where: { id: { in: options.userIds } },
    });
  }
};

/**
 * Performs a complete database cleanup for tests
 * WARNING: This removes ALL test data. Use with caution.
 * 
 * @returns Promise<void>
 */
export const performCompleteCleanup = async () => {
  const tables = [
    'ConversionTrack',
    'ClickTrack',
    'WidgetAnalytics',
    'Session',
    'Question',
    'Offer',
    'Survey',
    'User'
  ];

  for (const table of tables) {
    try {
      await (prisma as any)[table.toLowerCase()].deleteMany({});
    } catch (error) {
      console.warn(`Error cleaning up ${table}:`, error);
    }
  }
};

/**
 * Executes a function within a database transaction that is rolled back
 * Useful for isolating tests without affecting the actual database
 * 
 * @param fn - Function to execute within transaction
 * @returns Promise<T> - Result of the function
 */
export const withTransaction = async <T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(async (tx) => {
    const result = await fn(tx as PrismaClient);
    // Throw error to rollback transaction
    throw new Error('Transaction rollback for test isolation');
  }).catch((error) => {
    if (error.message === 'Transaction rollback for test isolation') {
      // This is expected - we're using this to rollback
      return undefined as T;
    }
    throw error;
  });
};

export { prisma };