import { getUsers, getUserById, updateUserStatus, bulkUpdateUserStatus } from '../services/userService.js';
import { createActivityLog } from '../services/activityLogService.js';

// Get all users
export const getAllUsers = async (req, res) => {
    const { status, role, cursor, limit } = req.query;
    try {
        const users = await getUsers(status, role, cursor, parseInt(limit) || 10);
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Get user by ID
export const getUser = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await getUserById(userId);
        if (user) {
            res.json({ user });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

// Update user status
export const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { status } = req.body;
    try {
        const updatedUser = await updateUserStatus(userId, status);
        // Log the activity
        await createActivityLog('ADMIN', `Updated user status to ${status}`, 'USER', userId);
        res.json({ user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user status' });
    }
};

// Bulk update user statuses
export const bulkUpdateUsers = async (req, res) => {
    const { userIds, status } = req.body;
    try {
        const updatedCount = await bulkUpdateUserStatus(userIds, status);
        // Log the activity
        await createActivityLog('ADMIN', `Bulk updated ${updatedCount} users to status ${status}`, 'USER', null, null, { userIds, count: updatedCount });
        res.json({ updatedCount });
    } catch (error) {
        res.status(500).json({ error: 'Failed to bulk update user statuses' });
    }
};