import { getAllSupportTickets, getSupportTicket, updateSupportTicketById, bulkUpdateSupportTicketsByIds } from '../controllers/supportController.js';
import { adminAuth } from '../middleware/authMiddleware.js';
import { Router } from 'express';

export const supportRouter = Router();

// Apply adminAuth middleware to all routes
supportRouter.use(adminAuth);

// Get all support tickets
supportRouter.get('/', getAllSupportTickets);

// Get support ticket by ID
supportRouter.get('/:id', getSupportTicket);

// Update support ticket
supportRouter.patch('/:id', updateSupportTicketById);

// Bulk update support tickets
supportRouter.patch('/bulk', bulkUpdateSupportTicketsByIds);