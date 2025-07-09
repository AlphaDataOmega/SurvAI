/**
 * @fileoverview Offer routes for affiliate offer management
 * 
 * Routes for managing affiliate offers, including CRUD operations,
 * pixel URL generation, and performance metrics.
 */

import { Router } from 'express';
import { offerController } from '../controllers/offerController';
import { authenticateUser, requireAdmin } from '../middleware/auth';
import {
  validateCreateOffer,
  validateUpdateOffer,
  validateListOffers,
  validateToggleOffer,
  validateOfferId
} from '../validators/offerValidator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser, requireAdmin);

/**
 * @route POST /api/offers
 * @desc Create a new offer
 * @access Admin
 * @body { title, description?, category, destinationUrl, config?, targeting? }
 */
router.post(
  '/',
  validateCreateOffer,
  offerController.createOffer.bind(offerController)
);

/**
 * @route GET /api/offers
 * @desc List offers with pagination and filtering
 * @access Admin
 * @query { page?, limit?, category?, status?, search?, sortBy?, sortOrder?, minEPC? }
 */
router.get(
  '/',
  validateListOffers,
  offerController.listOffers.bind(offerController)
);

/**
 * @route GET /api/offers/active-by-epc
 * @desc Get active offers ranked by EPC performance
 * @access Admin
 */
router.get(
  '/active-by-epc',
  offerController.getActiveOffersByEPC.bind(offerController)
);

/**
 * @route GET /api/offers/:id
 * @desc Get a single offer by ID
 * @access Admin
 * @param { id } Offer ID
 */
router.get(
  '/:id',
  validateOfferId,
  offerController.getOffer.bind(offerController)
);

/**
 * @route PATCH /api/offers/:id
 * @desc Update an existing offer
 * @access Admin
 * @param { id } Offer ID
 * @body { title?, description?, category?, status?, destinationUrl?, config?, targeting? }
 */
router.patch(
  '/:id',
  validateOfferId,
  validateUpdateOffer,
  offerController.updateOffer.bind(offerController)
);

/**
 * @route DELETE /api/offers/:id
 * @desc Delete an offer (soft delete - sets status to ARCHIVED)
 * @access Admin
 * @param { id } Offer ID
 */
router.delete(
  '/:id',
  validateOfferId,
  offerController.deleteOffer.bind(offerController)
);

/**
 * @route PATCH /api/offers/:id/toggle
 * @desc Toggle offer status between ACTIVE and PAUSED
 * @access Admin
 * @param { id } Offer ID
 * @body { status }
 */
router.patch(
  '/:id/toggle',
  validateOfferId,
  validateToggleOffer,
  offerController.toggleOfferStatus.bind(offerController)
);

/**
 * @route GET /api/offers/:id/pixel
 * @desc Generate a new pixel URL for an offer
 * @access Admin
 * @param { id } Offer ID
 */
router.get(
  '/:id/pixel',
  validateOfferId,
  offerController.generatePixelUrl.bind(offerController)
);

/**
 * @route GET /api/offers/:id/metrics
 * @desc Get offer analytics and metrics
 * @access Admin
 * @param { id } Offer ID
 */
router.get(
  '/:id/metrics',
  validateOfferId,
  offerController.getOfferMetrics.bind(offerController)
);

/**
 * @route PATCH /api/offers/bulk/status
 * @desc Bulk update offer statuses
 * @access Admin
 * @body { offerIds: string[], status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' }
 */
router.patch(
  '/bulk/status',
  offerController.bulkUpdateOfferStatus.bind(offerController)
);

export default router;