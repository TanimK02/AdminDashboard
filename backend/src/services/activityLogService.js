import prisma from "../prisma.js";

// Valid enum values from Prisma schema
const VALID_ACTOR_TYPE = ['USER', 'ADMIN', 'SYSTEM'];
const VALID_ENTITY_TYPE = ['USER', 'SUBSCRIPTION', 'TICKET', 'SYSTEM'];

const getActivityLogs = async (actorType = null, entityType = null, cursor = null, limit = 10) => {
    const where = {};

    // Validate and only add actorType if it's a valid enum value
    if (actorType && VALID_ACTOR_TYPE.includes(actorType)) {
        where.actorType = actorType;
    }

    // Validate and only add entityType if it's a valid enum value
    if (entityType && VALID_ENTITY_TYPE.includes(entityType)) {
        where.entityType = entityType;
    }

    const queryOptions = {
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
    };

    if (cursor) {
        queryOptions.cursor = { id: cursor };
        queryOptions.skip = 1; // Skip the cursor item itself
    }

    const logs = await prisma.activityLog.findMany(queryOptions);
    return logs;
};

const getActivityLogById = async (logId) => {
    return await prisma.activityLog.findUnique({
        where: { id: logId },
    });
};

const createActivityLog = async (actorType, action, entityType, entityId, actorId = null, metadata = null) => {
    return await prisma.activityLog.create({
        data: {
            actorType,
            action,
            entityType,
            entityId,
            actorId,
            metadata,
        },
    });
};

const getActivityStats = async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [last24h] = await Promise.all([
        prisma.activityLog.count({ where: { createdAt: { gte: since } } }),
    ]);

    return { last24h };
};

export { getActivityLogs, getActivityLogById, createActivityLog, getActivityStats };
