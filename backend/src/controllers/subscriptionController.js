import { getSubscriptions, getSubscriptionById } from "../services/subscriptionService.js";

// Get all subscriptions
export const getAllSubscriptions = async (req, res) => {
    const { status, cursor, limit } = req.query;
    try {
        const subscriptions = await getSubscriptions({
            status,
            cursor,
            limit: parseInt(limit) || 10,
        });
        res.json({ subscriptions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
};

// Get subscription by ID
export const getSubscription = async (req, res) => {
    const subscriptionId = req.params.id;
    try {
        const subscription = await getSubscriptionById(subscriptionId);
        if (subscription) {
            res.json({ subscription });
        } else {
            res.status(404).json({ error: 'Subscription not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
};