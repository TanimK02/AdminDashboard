import { getAllActivityLogs, getActivityLog } from '../controllers/activityLogController.js';
import { adminAuth } from '../middleware/authMiddleware.js';
import { Router } from 'express';

export const activityLogRouter = Router();

// Apply adminAuth middleware to all routes
activityLogRouter.use(adminAuth);

// Get all activity logs
activityLogRouter.get('/', getAllActivityLogs);

// Get activity log by ID
activityLogRouter.get('/:id', getActivityLog);
