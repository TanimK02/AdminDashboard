import { getActivityLogs, getActivityLogById, getActivityStats } from '../services/activityLogService.js';

// Get all activity logs
export const getAllActivityLogs = async (req, res) => {
    const { actorType, entityType, cursor, limit } = req.query;
    try {
        const logs = await getActivityLogs(actorType, entityType, cursor, parseInt(limit) || 10);
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
};

// Get activity log by ID
export const getActivityLog = async (req, res) => {
    const logId = req.params.id;
    try {
        const log = await getActivityLogById(logId);
        if (log) {
            res.json({ log });
        } else {
            res.status(404).json({ error: 'Activity log not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity log' });
    }
};

// Get activity stats (counts)
export const getActivityLogsStats = async (req, res) => {
    try {
        const stats = await getActivityStats();
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity stats' });
    }
};
