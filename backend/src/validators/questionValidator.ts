/**
 * @fileoverview Question validation schemas using Zod
 * 
 * TypeScript-first validation schemas for question operations
 * with Express middleware factory functions.
 */

import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { createBadRequestError } from '../middleware/errorHandler';

export const questionGenerateSchema = z.object({
  surveyId: z.string().min(1, 'Survey ID is required'),
  useAI: z.boolean().default(false),
  text: z.string().min(1, 'Question text is required').optional(),
  description: z.string().optional(),
  type: z.enum(['CTA_OFFER']).default('CTA_OFFER'),
  config: z.record(z.unknown()).optional(),
  options: z.array(z.unknown()).optional(),
  order: z.number().int().positive().optional(),
  required: z.boolean().default(false),
  logic: z.record(z.unknown()).optional(),
  // AI context fields when useAI is true
  aiContext: z.object({
    userIncome: z.string().optional(),
    employment: z.string().optional(),
    surveyType: z.string().optional(),
    targetAudience: z.string().optional(),
    previousAnswers: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional()
  }).optional()
});

export const questionUpdateSchema = z.object({
  text: z.string().min(1).optional(),
  description: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  options: z.array(z.unknown()).optional(),
  order: z.number().int().positive().optional(),
  required: z.boolean().optional(),
  logic: z.record(z.unknown()).optional()
});

export const surveyParamsSchema = z.object({
  surveyId: z.string().min(1, 'Survey ID is required')
});

export const questionParamsSchema = z.object({
  id: z.string().min(1, 'Question ID is required')
});

// Type inference exports
export type QuestionGenerateRequest = z.infer<typeof questionGenerateSchema>;
export type QuestionUpdateRequest = z.infer<typeof questionUpdateSchema>;
export type SurveyParamsRequest = z.infer<typeof surveyParamsSchema>;
export type QuestionParamsRequest = z.infer<typeof questionParamsSchema>;

/**
 * Middleware factory function for request body validation
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateRequest = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = result.error.issues
          .map(issue => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ');
        return next(createBadRequestError(`Validation failed: ${errorMessage}`));
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware factory function for request parameters validation
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateParams = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const errorMessage = result.error.issues
          .map(issue => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ');
        return next(createBadRequestError(`Parameter validation failed: ${errorMessage}`));
      }
      req.params = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware factory function for query parameters validation
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateQuery = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const errorMessage = result.error.issues
          .map(issue => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ');
        return next(createBadRequestError(`Query validation failed: ${errorMessage}`));
      }
      req.query = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Pre-configured middleware exports for convenience
export const validateQuestionGenerate = validateRequest(questionGenerateSchema);
export const validateQuestionUpdate = validateRequest(questionUpdateSchema);
export const validateSurveyParams = validateParams(surveyParamsSchema);
export const validateQuestionParams = validateParams(questionParamsSchema);