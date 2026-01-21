import { getAllSupportTickets, getTicketsStats, getSupportTicket, updateSupportTicketById, bulkUpdateSupportTicketsByIds } from '../controllers/supportController.js';
import { adminAuth } from '../middleware/authMiddleware.js';
import { Router } from 'express';

export const supportRouter = Router();

// Apply adminAuth middleware to all routes
supportRouter.use(adminAuth);

// Get all support tickets
supportRouter.get('/', getAllSupportTickets);

// Get ticket stats (must come before /:id)
supportRouter.get('/stats', getTicketsStats);

// Bulk update support tickets (must come before /:id)
supportRouter.patch('/bulk', bulkUpdateSupportTicketsByIds);

// Get support ticket by ID
supportRouter.get('/:id', getSupportTicket);

// Update support ticket
supportRouter.patch('/:id', updateSupportTicketById);