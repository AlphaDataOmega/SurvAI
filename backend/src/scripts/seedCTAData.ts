/**
 * @fileoverview Seed script for CTA survey data
 * 
 * Creates sample surveys, questions, and offers for testing
 * the Dynamic Question Engine implementation.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCTAData() {
  console.log('🌱 Seeding CTA survey data...');

  try {
    // Create sample survey
    const survey = await prisma.survey.create({
      data: {
        title: 'Financial Services Interest Survey',
        description: 'Help us understand your financial service needs',
        status: 'ACTIVE',
        config: {
          timeout: 300000, // 5 minutes
          showProgress: false,
          allowBack: false,
          styling: {
            primaryColor: '#3182ce',
            secondaryColor: '#38a169',
            backgroundColor: '#ffffff',
          },
        },
      },
    });

    console.log(`✅ Created survey: ${survey.title} (${survey.id})`);

    // Create sample offers
    const offers = await Promise.all([
      prisma.offer.create({
        data: {
          title: 'Personal Financial Planning',
          description: 'Get expert advice on managing your personal finances',
          category: 'FINANCE',
          status: 'ACTIVE',
          destinationUrl: 'https://example.com/financial-planning?click_id={click_id}&survey_id={survey_id}&utm_source=survai',
          pixelUrl: 'https://tracking.example.com/conversion?click_id={click_id}',
          config: {
            payout: 35.00,
            currency: 'USD',
            dailyClickCap: 1000,
            totalClickCap: 10000,
            cooldownPeriod: 3600, // 1 hour
          },
          targeting: {
            geoTargeting: ['US', 'CA', 'UK'],
            deviceTargeting: ['DESKTOP', 'MOBILE'],
            timeTargeting: {
              daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
              hourRange: { start: 9, end: 17 }, // 9 AM to 5 PM
              timezone: 'America/New_York',
            },
          },
          metrics: {
            totalClicks: 0,
            totalConversions: 0,
            totalRevenue: 0,
            conversionRate: 0,
            epc: 0,
            lastUpdated: new Date(),
          },
        },
      }),
      prisma.offer.create({
        data: {
          title: 'Life Insurance Quotes',
          description: 'Compare life insurance policies and get instant quotes',
          category: 'INSURANCE',
          status: 'ACTIVE',
          destinationUrl: 'https://example.com/life-insurance?click_id={click_id}&survey_id={survey_id}&source=cta',
          pixelUrl: 'https://tracking.example.com/conversion?click_id={click_id}',
          config: {
            payout: 45.00,
            currency: 'USD',
            dailyClickCap: 500,
            totalClickCap: 5000,
            cooldownPeriod: 7200, // 2 hours
          },
          targeting: {
            geoTargeting: ['US'],
            deviceTargeting: ['DESKTOP', 'MOBILE'],
          },
          metrics: {
            totalClicks: 0,
            totalConversions: 0,
            totalRevenue: 0,
            conversionRate: 0,
            epc: 0,
            lastUpdated: new Date(),
          },
        },
      }),
      prisma.offer.create({
        data: {
          title: 'Investment Portfolio Review',
          description: 'Free portfolio analysis by certified financial advisors',
          category: 'FINANCE',
          status: 'ACTIVE',
          destinationUrl: 'https://example.com/portfolio-review?click_id={click_id}&survey_id={survey_id}&campaign=cta_survey',
          pixelUrl: 'https://tracking.example.com/conversion?click_id={click_id}',
          config: {
            payout: 25.00,
            currency: 'USD',
            dailyClickCap: 750,
            totalClickCap: 7500,
            cooldownPeriod: 1800, // 30 minutes
          },
          targeting: {
            geoTargeting: ['US', 'CA'],
            deviceTargeting: ['DESKTOP', 'MOBILE', 'TABLET'],
          },
          metrics: {
            totalClicks: 0,
            totalConversions: 0,
            totalRevenue: 0,
            conversionRate: 0,
            epc: 0,
            lastUpdated: new Date(),
          },
        },
      }),
    ]);

    console.log(`✅ Created ${offers.length} offers`);

    // Create sample CTA questions
    const questions = await Promise.all([
      prisma.question.create({
        data: {
          surveyId: survey.id,
          type: 'CTA_OFFER',
          text: 'What\'s your biggest financial concern right now?',
          description: 'We\'ll show you relevant resources based on your selection.',
          config: {
            maxButtons: 3,
            buttonLayout: 'vertical',
            ctaStyle: {
              primaryColor: '#3182ce',
              secondaryColor: '#38a169',
              buttonSize: 'large',
            },
          },
          options: [
            {
              id: 'option-retirement',
              text: 'Retirement Planning',
              offerId: offers[0].id,
              style: 'primary',
              order: 1,
            },
            {
              id: 'option-protection',
              text: 'Life Insurance & Protection',
              offerId: offers[1].id,
              style: 'secondary',
              order: 2,
            },
            {
              id: 'option-investment',
              text: 'Investment & Portfolio Growth',
              offerId: offers[2].id,
              style: 'accent',
              order: 3,
            },
          ],
          order: 1,
          required: false,
          logic: {
            conditions: [
              {
                optionId: 'option-retirement',
                action: 'SHOW_OFFER',
                target: offers[0].id,
              },
              {
                optionId: 'option-protection',
                action: 'SHOW_OFFER',
                target: offers[1].id,
              },
              {
                optionId: 'option-investment',
                action: 'SHOW_OFFER',
                target: offers[2].id,
              },
            ],
            defaultNext: undefined,
          },
          aiVersions: [
            {
              id: 'v1',
              text: 'What\'s your biggest financial concern right now?',
              options: [
                {
                  id: 'ai-option-1',
                  text: 'Planning for retirement',
                  offerId: offers[0].id,
                  style: 'primary',
                  order: 1,
                },
                {
                  id: 'ai-option-2',
                  text: 'Protecting my family',
                  offerId: offers[1].id,
                  style: 'secondary',
                  order: 2,
                },
                {
                  id: 'ai-option-3',
                  text: 'Growing my investments',
                  offerId: offers[2].id,
                  style: 'accent',
                  order: 3,
                },
              ],
              isActive: true,
              createdAt: new Date(),
              metrics: {
                impressions: 0,
                responses: 0,
                conversionRate: 0,
                avgCompletionTime: 0,
              },
            },
          ],
        },
      }),
      prisma.question.create({
        data: {
          surveyId: survey.id,
          type: 'CTA_OFFER',
          text: 'How soon are you looking to take action?',
          description: 'This helps us prioritize the most relevant options for you.',
          config: {
            maxButtons: 3,
            buttonLayout: 'vertical',
            ctaStyle: {
              primaryColor: '#3182ce',
              secondaryColor: '#38a169',
              buttonSize: 'medium',
            },
          },
          options: [
            {
              id: 'option-immediate',
              text: 'Within the next 30 days',
              offerId: offers[0].id,
              style: 'primary',
              order: 1,
            },
            {
              id: 'option-soon',
              text: 'Within the next 3 months',
              offerId: offers[1].id,
              style: 'secondary',
              order: 2,
            },
            {
              id: 'option-exploring',
              text: 'Just exploring options',
              offerId: offers[2].id,
              style: 'secondary',
              order: 3,
            },
          ],
          order: 2,
          required: false,
          logic: {
            conditions: [
              {
                optionId: 'option-immediate',
                action: 'SHOW_OFFER',
                target: offers[0].id,
              },
              {
                optionId: 'option-soon',
                action: 'SHOW_OFFER',
                target: offers[1].id,
              },
              {
                optionId: 'option-exploring',
                action: 'END_SURVEY',
                target: '',
              },
            ],
          },
        },
      }),
    ]);

    console.log(`✅ Created ${questions.length} CTA questions`);

    // Create sample survey responses and clicks for analytics
    const sampleSessions = [
      'session-demo-001',
      'session-demo-002',
      'session-demo-003',
    ];

    for (const sessionId of sampleSessions) {
      const response = await prisma.surveyResponse.create({
        data: {
          surveyId: survey.id,
          sessionData: {
            sessionId,
            clickId: `click-${sessionId}`,
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            referrer: 'https://google.com',
            utmParams: {
              utm_source: 'demo',
              utm_medium: 'cta',
              utm_campaign: 'financial_survey',
            },
          },
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Create sample clicks
      await prisma.clickTrack.create({
        data: {
          offerId: offers[Math.floor(Math.random() * offers.length)].id,
          responseId: response.id,
          clickId: `click-${sessionId}-${Date.now()}`,
          sessionData: {
            sessionId,
            clickId: `click-${sessionId}`,
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            deviceInfo: {
              type: 'DESKTOP',
              isMobile: false,
              os: 'Windows',
              browser: 'Chrome',
            },
          },
          status: 'VALID',
          converted: Math.random() > 0.7, // 30% conversion rate
          revenue: Math.random() > 0.7 ? Math.random() * 50 : null,
          metadata: {
            questionId: questions[0].id,
            buttonVariantId: `button-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
          },
        },
      });
    }

    console.log(`✅ Created ${sampleSessions.length} sample sessions with clicks`);

    console.log('🎉 CTA survey data seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- Survey ID: ${survey.id}`);
    console.log(`- Questions: ${questions.length}`);
    console.log(`- Offers: ${offers.length}`);
    console.log(`- Sample sessions: ${sampleSessions.length}`);
    console.log('\nYou can now test the Dynamic Question Engine with this data!');

  } catch (error) {
    console.error('❌ Error seeding CTA data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedCTAData()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedCTAData };