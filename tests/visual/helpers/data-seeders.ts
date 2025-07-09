/**
 * @fileoverview Deterministic data seeding utilities for visual testing
 * 
 * Provides utilities for creating consistent test data for surveys, questions,
 * offers, and analytics to ensure deterministic visual regression testing.
 */

/**
 * Deterministic test data configuration
 */
export interface DeterministicTestData {
  surveyId: string;
  questionId: string;
  offerId: string;
  userId: string;
  partnerId: string;
  sessionId: string;
}

/**
 * Survey data for testing
 */
export interface TestSurveyData {
  id: string;
  title: string;
  description: string;
  questions: TestQuestionData[];
  partnerId: string;
  isActive: boolean;
}

/**
 * Question data for testing
 */
export interface TestQuestionData {
  id: string;
  type: 'CTA' | 'FOLLOWUP' | 'RATING';
  text: string;
  order: number;
  offers?: TestOfferData[];
}

/**
 * Offer data for testing
 */
export interface TestOfferData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  targetUrl: string;
  epcScore: number;
  isActive: boolean;
}

/**
 * Dashboard metrics data for testing
 */
export interface TestDashboardMetrics {
  totalOffers: number;
  activeOffers: number;
  totalClicks: number;
  conversionRate: number;
  avgEpcScore: number;
  topPerformingOffers: string[];
  recentActivity: TestActivity[];
}

/**
 * Activity data for testing
 */
export interface TestActivity {
  id: string;
  type: 'click' | 'view' | 'conversion';
  timestamp: string;
  offerId: string;
  userId: string;
}

/**
 * Generate deterministic test data
 * CRITICAL: Use fixed UUIDs for consistent visual testing
 */
export function generateDeterministicTestData(): DeterministicTestData {
  return {
    surveyId: 'test-survey-12345',
    questionId: 'test-question-67890',
    offerId: 'test-offer-54321',
    userId: 'test-user-98765',
    partnerId: 'test-partner-11111',
    sessionId: 'test-session-22222'
  };
}

/**
 * Generate test survey data
 */
export function generateTestSurveyData(surveyId: string): TestSurveyData {
  return {
    id: surveyId,
    title: 'Test Survey for Visual Testing',
    description: 'A deterministic survey for visual regression testing',
    partnerId: 'test-partner-11111',
    isActive: true,
    questions: [
      {
        id: 'test-question-cta-1',
        type: 'CTA',
        text: 'Would you like to try our premium features?',
        order: 1,
        offers: [
          {
            id: 'test-offer-1',
            title: 'Premium Plan',
            description: 'Get access to all premium features',
            targetUrl: 'https://example.com/premium',
            epcScore: 0.85,
            isActive: true
          },
          {
            id: 'test-offer-2',
            title: 'Pro Plan',
            description: 'Perfect for professionals',
            targetUrl: 'https://example.com/pro',
            epcScore: 0.72,
            isActive: true
          },
          {
            id: 'test-offer-3',
            title: 'Basic Plan',
            description: 'Essential features for getting started',
            targetUrl: 'https://example.com/basic',
            epcScore: 0.56,
            isActive: true
          }
        ]
      },
      {
        id: 'test-question-followup-1',
        type: 'FOLLOWUP',
        text: 'How would you rate your experience?',
        order: 2
      }
    ]
  };
}

/**
 * Generate test offer data
 */
export function generateTestOfferData(count: number = 5): TestOfferData[] {
  const offers: TestOfferData[] = [];
  
  for (let i = 1; i <= count; i++) {
    offers.push({
      id: `test-offer-${i}`,
      title: `Test Offer ${i}`,
      description: `Description for test offer ${i} with consistent content`,
      targetUrl: `https://example.com/offer-${i}`,
      epcScore: Math.round((0.9 - (i * 0.1)) * 100) / 100, // Deterministic EPC scores
      isActive: true
    });
  }
  
  return offers;
}

/**
 * Generate test dashboard metrics
 */
export function generateTestDashboardMetrics(): TestDashboardMetrics {
  return {
    totalOffers: 12,
    activeOffers: 8,
    totalClicks: 1547,
    conversionRate: 0.034,
    avgEpcScore: 0.68,
    topPerformingOffers: ['test-offer-1', 'test-offer-2', 'test-offer-3'],
    recentActivity: [
      {
        id: 'activity-1',
        type: 'click',
        timestamp: '2024-01-01T12:00:00Z',
        offerId: 'test-offer-1',
        userId: 'test-user-1'
      },
      {
        id: 'activity-2',
        type: 'conversion',
        timestamp: '2024-01-01T12:05:00Z',
        offerId: 'test-offer-1',
        userId: 'test-user-1'
      },
      {
        id: 'activity-3',
        type: 'click',
        timestamp: '2024-01-01T12:10:00Z',
        offerId: 'test-offer-2',
        userId: 'test-user-2'
      }
    ]
  };
}

/**
 * Generate test analytics data
 */
export function generateTestAnalyticsData() {
  return {
    impressions: 2547,
    clicks: 1547,
    conversions: 53,
    ctr: 0.607,
    conversionRate: 0.034,
    revenue: 1234.56,
    avgOrderValue: 23.29,
    dailyStats: [
      { date: '2024-01-01', clicks: 245, conversions: 8 },
      { date: '2024-01-02', clicks: 198, conversions: 6 },
      { date: '2024-01-03', clicks: 312, conversions: 12 },
      { date: '2024-01-04', clicks: 267, conversions: 9 },
      { date: '2024-01-05', clicks: 298, conversions: 11 },
      { date: '2024-01-06', clicks: 156, conversions: 4 },
      { date: '2024-01-07', clicks: 71, conversions: 3 }
    ]
  };
}

/**
 * Generate test user data
 */
export function generateTestUserData() {
  return {
    id: 'test-user-98765',
    email: 'testuser@example.com',
    name: 'Test User',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-01T12:00:00Z'
  };
}

/**
 * Generate test admin user data
 */
export function generateTestAdminUserData() {
  return {
    id: 'test-admin-12345',
    email: 'admin@example.com',
    name: 'Test Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-01T12:00:00Z'
  };
}

/**
 * Generate test partner data
 */
export function generateTestPartnerData() {
  return {
    id: 'test-partner-11111',
    name: 'Test Partner',
    domain: 'example.com',
    apiKey: 'test-api-key-12345',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    settings: {
      defaultTheme: 'corporate',
      widgetPosition: 'bottom-right',
      enableAnalytics: true
    }
  };
}

/**
 * Generate test session data
 */
export function generateTestSessionData(surveyId: string, userId: string) {
  return {
    id: 'test-session-22222',
    surveyId,
    userId,
    startTime: '2024-01-01T12:00:00Z',
    endTime: '2024-01-01T12:05:00Z',
    currentQuestionId: 'test-question-cta-1',
    responses: [
      {
        questionId: 'test-question-cta-1',
        offerId: 'test-offer-1',
        timestamp: '2024-01-01T12:03:00Z'
      }
    ],
    metadata: {
      userAgent: 'Visual-Test-Browser/1.0',
      referrer: 'https://example.com',
      ipAddress: '127.0.0.1'
    }
  };
}

/**
 * Generate test widget configuration
 */
export function generateTestWidgetConfig(partnerId: string) {
  return {
    partnerId,
    theme: {
      primaryColor: '#3182ce',
      secondaryColor: '#e2e8f0',
      backgroundColor: '#ffffff',
      textColor: '#1a202c',
      buttonSize: 'medium',
      spacing: 'normal',
      borderRadius: '0.5rem',
      shadows: true,
      transitions: true
    },
    settings: {
      position: 'bottom-right',
      showBranding: true,
      autoHide: false,
      closeButton: true
    }
  };
}

/**
 * Create comprehensive test data set
 */
export function createComprehensiveTestDataSet(): {
  baseData: DeterministicTestData;
  survey: TestSurveyData;
  offers: TestOfferData[];
  metrics: TestDashboardMetrics;
  analytics: any;
  user: any;
  admin: any;
  partner: any;
  session: any;
  widgetConfig: any;
} {
  const baseData = generateDeterministicTestData();
  const survey = generateTestSurveyData(baseData.surveyId);
  const offers = generateTestOfferData(5);
  const metrics = generateTestDashboardMetrics();
  const analytics = generateTestAnalyticsData();
  const user = generateTestUserData();
  const admin = generateTestAdminUserData();
  const partner = generateTestPartnerData();
  const session = generateTestSessionData(baseData.surveyId, baseData.userId);
  const widgetConfig = generateTestWidgetConfig(baseData.partnerId);
  
  return {
    baseData,
    survey,
    offers,
    metrics,
    analytics,
    user,
    admin,
    partner,
    session,
    widgetConfig
  };
}

/**
 * Mock API responses for visual testing
 */
export function getMockApiResponses(testData: ReturnType<typeof createComprehensiveTestDataSet>) {
  return {
    [`/api/survey/${testData.baseData.surveyId}`]: {
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(testData.survey)
    },
    [`/api/offers`]: {
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(testData.offers)
    },
    [`/api/dashboard/metrics`]: {
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(testData.metrics)
    },
    [`/api/analytics`]: {
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(testData.analytics)
    },
    [`/api/user/profile`]: {
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(testData.user)
    }
  };
}