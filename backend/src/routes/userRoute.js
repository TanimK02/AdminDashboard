import { getAllUsers, getUsersStats, getUser, updateUser, bulkUpdateUsers } from '../controllers/userController.js';
import { adminAuth } from '../middleware/authMiddleware.js';
import { Router } from 'express';

export const userRouter = Router();

// Apply adminAuth middleware to all routes
userRouter.use(adminAuth);

// Get all users
userRouter.get('/', getAllUsers);

// Get user stats (must come before /:id)
userRouter.get('/stats', getUsersStats);

// Bulk update user statuses (must come before /:id route)
userRouter.patch('/bulk', bulkUpdateUsers);

// Get user by ID
userRouter.get('/:id', getUser);

// Update user
userRouter.patch('/:id', updateUser);