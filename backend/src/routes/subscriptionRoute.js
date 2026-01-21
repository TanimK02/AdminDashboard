import { getAllSubscriptions, getSubscription, getSubscriptionsStats } from '../controllers/subscriptionController.js';
import { adminAuth } from '../middleware/authMiddleware.js';
import { Router } from 'express';

export const subscriptionRouter = Router();

// Apply adminAuth middleware to all routes
subscriptionRouter.use(adminAuth);

// Get all subscriptions
subscriptionRouter.get('/', getAllSubscriptions);

// Get subscription stats (must come before /:id)
subscriptionRouter.get('/stats', getSubscriptionsStats);

// Get subscription by ID
subscriptionRouter.get('/:id', getSubscription);