/**
 * @fileoverview Offer Management Visual Tests
 * 
 * Comprehensive visual regression testing for offer management interface:
 * - Offer list view with different states
 * - Offer creation and edit modals
 * - Offer status toggles and bulk operations
 * - Pagination and filtering
 * - Responsive design variations
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, createDeterministicTestData } from './auth-helpers';
import { setupBrowserContext, preparePageForVisualTesting } from './visual-setup';
import {
  navigateToOfferManagement,
  waitForOfferManagementToLoad,
  openOfferCreationModal,
  closeOfferModal,
  getOfferManagementContainer
} from './helpers/dashboard-helpers';
import { createComprehensiveTestDataSet } from './helpers/data-seeders';

// Global test data
let testData: ReturnType<typeof createComprehensiveTestDataSet>;

test.describe('Offer Management Visual Tests', () => {
  
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

  test.describe('Offer List View', () => {
    
    test('should capture offer list with all offers', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Take screenshot of offer list
      await expect(page).toHaveScreenshot('offer-list-all.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture offer list table', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Capture offer table specifically
      const offerTable = getOfferManagementContainer(page);
      if (await offerTable.count() > 0) {
        await expect(offerTable).toHaveScreenshot('offer-list-table.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Fallback to main page
        await expect(page).toHaveScreenshot('offer-list-table-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture offer list with active offers only', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Filter for active offers
      const activeFilter = page.locator('[data-testid="filter-active"], .filter-active, .status-filter[value="active"]').first();
      if (await activeFilter.count() > 0) {
        await activeFilter.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('offer-list-active-only.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture offer list with inactive offers only', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Filter for inactive offers
      const inactiveFilter = page.locator('[data-testid="filter-inactive"], .filter-inactive, .status-filter[value="inactive"]').first();
      if (await inactiveFilter.count() > 0) {
        await inactiveFilter.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('offer-list-inactive-only.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture offer list with search results', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Search for specific offer
      const searchInput = page.locator('[data-testid="offer-search"], .offer-search, .search-input').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('Premium');
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('offer-list-search-results.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Offer Creation Modal', () => {
    
    test('should capture offer creation modal', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Open offer creation modal
      await openOfferCreationModal(page);
      
      await expect(page).toHaveScreenshot('offer-creation-modal.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture offer creation form', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Open offer creation modal
      await openOfferCreationModal(page);
      
      // Capture form specifically
      const form = page.locator('[data-testid="offer-form"], .offer-form, .modal-form').first();
      if (await form.count() > 0) {
        await expect(form).toHaveScreenshot('offer-creation-form.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Fallback to modal
        const modal = page.locator('[data-testid="offer-modal"], .offer-modal, .modal').first();
        await expect(modal).toHaveScreenshot('offer-creation-form-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture offer creation form with validation errors', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Open offer creation modal
      await openOfferCreationModal(page);
      
      // Try to submit empty form to trigger validation
      const submitButton = page.locator('[data-testid="submit-offer"], .submit-offer, .save-button').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('offer-creation-validation-errors.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture offer creation form filled out', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Open offer creation modal
      await openOfferCreationModal(page);
      
      // Fill out form fields
      const titleField = page.locator('[data-testid="offer-title"], .offer-title, input[name="title"]').first();
      if (await titleField.count() > 0) {
        await titleField.fill('Test Offer Title');
      }
      
      const descField = page.locator('[data-testid="offer-description"], .offer-description, textarea[name="description"]').first();
      if (await descField.count() > 0) {
        await descField.fill('This is a test offer description for visual testing.');
      }
      
      const urlField = page.locator('[data-testid="offer-url"], .offer-url, input[name="url"]').first();
      if (await urlField.count() > 0) {
        await urlField.fill('https://example.com/offer');
      }
      
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('offer-creation-filled-form.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Offer Edit Modal', () => {
    
    test('should capture offer edit modal', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Click edit button on first offer
      const editButton = page.locator('[data-testid="edit-offer"], .edit-offer, .edit-button').first();
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('offer-edit-modal.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture offer edit form with existing data', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Click edit button on first offer
      const editButton = page.locator('[data-testid="edit-offer"], .edit-offer, .edit-button').first();
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Capture form with existing data
        const form = page.locator('[data-testid="offer-form"], .offer-form, .modal-form').first();
        if (await form.count() > 0) {
          await expect(form).toHaveScreenshot('offer-edit-form-with-data.png', {
            maxDiffPixelRatio: 0.001
          });
        } else {
          await expect(page).toHaveScreenshot('offer-edit-form-with-data-fallback.png', {
            maxDiffPixelRatio: 0.001
          });
        }
      }
    });

  });

  test.describe('Offer Status Operations', () => {
    
    test('should capture offer status toggle', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Click status toggle on first offer
      const statusToggle = page.locator('[data-testid="status-toggle"], .status-toggle, .offer-status-toggle').first();
      if (await statusToggle.count() > 0) {
        await statusToggle.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('offer-status-toggle.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture bulk operations panel', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Select multiple offers
      const checkboxes = page.locator('[data-testid="offer-checkbox"], .offer-checkbox, input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 0) {
        // Select first 2 offers
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('offer-bulk-operations.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture bulk delete confirmation', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Select multiple offers
      const checkboxes = page.locator('[data-testid="offer-checkbox"], .offer-checkbox, input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 0) {
        await checkboxes.nth(0).click();
        await page.waitForTimeout(200);
        
        // Click bulk delete button
        const deleteButton = page.locator('[data-testid="bulk-delete"], .bulk-delete, .delete-selected').first();
        if (await deleteButton.count() > 0) {
          await deleteButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      await expect(page).toHaveScreenshot('offer-bulk-delete-confirmation.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Pagination and Filtering', () => {
    
    test('should capture offer list with pagination', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Look for pagination controls
      const pagination = page.locator('[data-testid="pagination"], .pagination, .pager').first();
      if (await pagination.count() > 0) {
        await expect(pagination).toHaveScreenshot('offer-pagination.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Capture bottom of page where pagination would be
        await expect(page.locator('.offers-footer, .table-footer').first()).toHaveScreenshot('offer-pagination-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture offer list page 2', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Navigate to page 2
      const page2Button = page.locator('[data-testid="page-2"], .page-2, .pagination .page-item:nth-child(3)').first();
      if (await page2Button.count() > 0) {
        await page2Button.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('offer-list-page-2.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture offer filters panel', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Capture filters area
      const filtersPanel = page.locator('[data-testid="offer-filters"], .offer-filters, .filters-panel').first();
      if (await filtersPanel.count() > 0) {
        await expect(filtersPanel).toHaveScreenshot('offer-filters-panel.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Capture top area where filters would be
        await expect(page.locator('.offers-header, .table-header').first()).toHaveScreenshot('offer-filters-panel-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

  });

  test.describe('Responsive Design', () => {
    
    test('should capture mobile offer management', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      await expect(page).toHaveScreenshot('offer-management-mobile.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture tablet offer management', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      await expect(page).toHaveScreenshot('offer-management-tablet.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture mobile offer creation modal', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      await openOfferCreationModal(page);
      
      await expect(page).toHaveScreenshot('offer-creation-modal-mobile.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Empty and Error States', () => {
    
    test('should capture empty offer list', async ({ page }) => {
      // Mock empty offers response
      await page.route('/api/offers**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });
      
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      await expect(page).toHaveScreenshot('offer-list-empty.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture offer loading error', async ({ page }) => {
      // Mock error response
      await page.route('/api/offers**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to load offers' })
        });
      });
      
      await navigateToOfferManagement(page);
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('offer-list-error.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture offer creation error', async ({ page }) => {
      await navigateToOfferManagement(page);
      await waitForOfferManagementToLoad(page);
      
      // Mock create error response
      await page.route('/api/offers', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Failed to create offer' })
          });
        } else {
          route.continue();
        }
      });
      
      await openOfferCreationModal(page);
      
      // Try to submit a filled form
      const titleField = page.locator('[data-testid="offer-title"], .offer-title, input[name="title"]').first();
      if (await titleField.count() > 0) {
        await titleField.fill('Test Offer');
      }
      
      const submitButton = page.locator('[data-testid="submit-offer"], .submit-offer, .save-button').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
      
      await expect(page).toHaveScreenshot('offer-creation-error.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

});

/**
 * Offer management consistency tests
 */
test.describe('Offer Management UI Consistency', () => {
  
  test.beforeAll(async () => {
    testData = createComprehensiveTestDataSet();
  });

  test.beforeEach(async ({ context, page }) => {
    await setupBrowserContext(context);
    await preparePageForVisualTesting(page);
  });

  test('should maintain consistent table layout', async ({ page }) => {
    await navigateToOfferManagement(page);
    await waitForOfferManagementToLoad(page);
    
    // Test consistency after various operations
    const editButton = page.locator('[data-testid="edit-offer"], .edit-offer, .edit-button').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(500);
      await closeOfferModal(page);
    }
    
    await expect(page).toHaveScreenshot('offer-management-consistency.png', {
      maxDiffPixelRatio: 0.001
    });
  });

});