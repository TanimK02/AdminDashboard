import app from "../index.js"
import request from 'supertest';
import prisma from "../src/prisma.js"

// Activity Logs
// GET /activity?actorType=&entityType=&cursor=&limit=10
// GET /activity/:id

const getAdminToken = async () => {
    const data = await request(app).post('/api/auth/login')
        .send({
            password: process.env.ADMIN_PASSWORD
        });
    return data.body.token;
}

afterAll(async () => {
    await prisma.$disconnect();
});

describe("Activity Log Routes", () => {
    let adminToken;

    beforeAll(async () => {
        adminToken = await getAdminToken();
    });

    it("should return up to 10 activity logs", async () => {
        const res = await request(app)
            .get('/activity?limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.logs).toBeDefined();
        expect(Array.isArray(res.body.logs)).toBe(true);
        expect(res.body.logs.length).toBeLessThanOrEqual(10);
    });

    it("should return a single activity log by ID", async () => {
        const logsRes = await request(app)
            .get('/activity?limit=1')
            .set('Authorization', `Bearer ${adminToken}`);

        if (logsRes.body.logs.length > 0) {
            const logId = logsRes.body.logs[0].id;

            const res = await request(app)
                .get(`/activity/${logId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.log.id).toBe(logId);
        }
    });

    it("should filter activity logs by actorType", async () => {
        const res = await request(app)
            .get('/activity?actorType=ADMIN&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.logs.every(log => log.actorType === 'ADMIN')).toBe(true);
    });

    it("should filter activity logs by entityType", async () => {
        const res = await request(app)
            .get('/activity?entityType=USER&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        if (res.body.logs.length > 0) {
            expect(res.body.logs.every(log => log.entityType === 'USER')).toBe(true);
        }
    });

    it("should handle invalid actorType gracefully", async () => {
        const res = await request(app)
            .get('/activity?actorType=INVALID_ACTOR&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.logs)).toBe(true);
    });

    it("should handle invalid entityType gracefully", async () => {
        const res = await request(app)
            .get('/activity?entityType=INVALID_ENTITY&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.logs)).toBe(true);
    });

    it("should support cursor-based pagination", async () => {
        // Get first page
        const firstPageRes = await request(app)
            .get('/activity?limit=5')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(firstPageRes.statusCode).toBe(200);

        if (firstPageRes.body.logs.length > 0) {
            expect(firstPageRes.body.logs.length).toBeLessThanOrEqual(5);

            // Use last log ID as cursor for next page
            const lastLogId = firstPageRes.body.logs[firstPageRes.body.logs.length - 1].id;
            const secondPageRes = await request(app)
                .get(`/activity?cursor=${lastLogId}&limit=5`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(secondPageRes.statusCode).toBe(200);

            // Second page logs should be different from first page
            if (secondPageRes.body.logs.length > 0) {
                const firstPageIds = firstPageRes.body.logs.map(l => l.id);
                const secondPageIds = secondPageRes.body.logs.map(l => l.id);
                expect(firstPageIds.some(id => secondPageIds.includes(id))).toBe(false);
            }
        }
    });

    it("should combine multiple query parameters", async () => {
        const res = await request(app)
            .get('/activity?actorType=ADMIN&entityType=USER&limit=5')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        if (res.body.logs.length > 0) {
            expect(res.body.logs.every(log =>
                log.actorType === 'ADMIN' && log.entityType === 'USER'
            )).toBe(true);
        }
    });

    it("should return 404 for non-existent activity log ID", async () => {
        const res = await request(app)
            .get('/activity/non-existent-id')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Activity log not found');
    });

    it("should create activity logs when users are updated", async () => {
        // Get a user to update
        const usersRes = await request(app)
            .get('/users?limit=1')
            .set('Authorization', `Bearer ${adminToken}`);

        if (usersRes.body.users.length > 0) {
            const userId = usersRes.body.users[0].id;
            const newStatus = 'SUSPENDED';

            // Update user (which should create an activity log)
            const updateRes = await request(app)
                .patch(`/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: newStatus });
            expect(updateRes.statusCode).toBe(200);

            // Verify activity log was created
            const logsRes = await request(app)
                .get('/activity?entityType=USER&limit=20')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(logsRes.statusCode).toBe(200);
            expect(logsRes.body.logs.length).toBeGreaterThan(0);

            // Check that a log for this user update exists
            const userUpdateLog = logsRes.body.logs.find(log =>
                log.entityId === userId && log.action.includes('Updated user status')
            );
            expect(userUpdateLog).toBeDefined();
        }
    });

});
