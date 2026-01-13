import { getSupportTicketById, getSupportTickets, updateSupportTicket, bulkUpdateSupportTickets } from "../services/supportService.js";
import { createActivityLog } from '../services/activityLogService.js';

// Get all support tickets with optional filters and pagination
export const getAllSupportTickets = async (req, res) => {
    const { status, priority, cursor, limit } = req.query;
    try {
        const { tickets, nextCursor } = await getSupportTickets({
            status,
            priority,
            cursor,
            limit: parseInt(limit) || 10,
        });
        res.json({ tickets, nextCursor });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
};

// Get support ticket by ID
export const getSupportTicket = async (req, res) => {
    const ticketId = req.params.id;
    try {
        const ticket = await getSupportTicketById(ticketId);
        if (ticket) {
            res.json({ ticket });
        } else {
            res.status(404).json({ error: 'Support ticket not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch support ticket' });
    }
};

// Update support ticket by ID
export const updateSupportTicketById = async (req, res) => {
    const ticketId = req.params.id;
    const updates = req.body;
    try {
        const updatedTicket = await updateSupportTicket(ticketId, updates);
        // Log the activity
        const updateFields = Object.keys(updates).join(', ');
        await createActivityLog('ADMIN', `Updated ticket: ${updateFields}`, 'TICKET', ticketId, null, { updates });
        res.json({ ticket: updatedTicket });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update support ticket' });
    }
};

// Bulk update support tickets
export const bulkUpdateSupportTicketsByIds = async (req, res) => {
    const { ticketIds, status } = req.body;
    try {
        const updatedCount = await bulkUpdateSupportTickets(ticketIds, { status });
        // Log the activity
        await createActivityLog('ADMIN', `Bulk updated ${updatedCount} tickets to status ${status}`, 'TICKET', null, null, { ticketIds, status, count: updatedCount });
        res.json({ updatedCount });
    } catch (error) {
        res.status(500).json({ error: 'Failed to bulk update support tickets' });
    }
};