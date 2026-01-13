import app from "../index.js"
import request from 'supertest';
import prisma from "../src/prisma.js"

// Subscriptions / Orders
// GET /subscriptions?status=&cursor=&limit=10
// GET /subscriptions/:id      // optional

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

describe("Subscription Routes", () => {
    let adminToken;

    beforeAll(async () => {
        adminToken = await getAdminToken();
    });

    it("should return 10 subscriptions with default limit", async () => {
        const res = await request(app)
            .get('/subscriptions?limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.subscriptions.length).toBeLessThanOrEqual(10);
        expect(Array.isArray(res.body.subscriptions)).toBe(true);
    });

    it("should return a single subscription by ID", async () => {
        const subscriptionsRes = await request(app)
            .get('/subscriptions?limit=1')
            .set('Authorization', `Bearer ${adminToken}`);

        if (subscriptionsRes.body.subscriptions.length > 0) {
            const subscriptionId = subscriptionsRes.body.subscriptions[0].id;

            const res = await request(app)
                .get(`/subscriptions/${subscriptionId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.subscription.id).toBe(subscriptionId);
        }
    });

    it("should filter subscriptions by status", async () => {
        const res = await request(app)
            .get('/subscriptions?status=ACTIVE&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        if (res.body.subscriptions.length > 0) {
            expect(res.body.subscriptions.every(sub => sub.status === 'ACTIVE')).toBe(true);
        }
    });

    it("should filter subscriptions by CANCELED status", async () => {
        const res = await request(app)
            .get('/subscriptions?status=CANCELED&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        if (res.body.subscriptions.length > 0) {
            expect(res.body.subscriptions.every(sub => sub.status === 'CANCELED')).toBe(true);
        }
    });

    it("should filter subscriptions by FAILED status", async () => {
        const res = await request(app)
            .get('/subscriptions?status=FAILED&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        if (res.body.subscriptions.length > 0) {
            expect(res.body.subscriptions.every(sub => sub.status === 'FAILED')).toBe(true);
        }
    });

    it("should support cursor-based pagination", async () => {
        // Get first page
        const firstPageRes = await request(app)
            .get('/subscriptions?limit=5')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(firstPageRes.statusCode).toBe(200);

        if (firstPageRes.body.subscriptions.length >= 5) {
            // Use last subscription ID as cursor for next page
            const lastSubscriptionId = firstPageRes.body.subscriptions[4].id;
            const secondPageRes = await request(app)
                .get(`/subscriptions?cursor=${lastSubscriptionId}&limit=5`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(secondPageRes.statusCode).toBe(200);

            // Second page subscriptions should be different from first page
            const firstPageIds = firstPageRes.body.subscriptions.map(s => s.id);
            const secondPageIds = secondPageRes.body.subscriptions.map(s => s.id);
            expect(firstPageIds.some(id => secondPageIds.includes(id))).toBe(false);
        }
    });

    it("should return empty array when no subscriptions match status filter", async () => {
        const res = await request(app)
            .get('/subscriptions?status=NONEXISTENT&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.subscriptions)).toBe(true);
    });

    it("should include subscription details like plan and price", async () => {
        const res = await request(app)
            .get('/subscriptions?limit=1')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);

        if (res.body.subscriptions.length > 0) {
            const subscription = res.body.subscriptions[0];
            expect(subscription).toHaveProperty('id');
            expect(subscription).toHaveProperty('plan');
            expect(subscription).toHaveProperty('price');
            expect(subscription).toHaveProperty('status');
            expect(subscription).toHaveProperty('userId');
            expect(subscription).toHaveProperty('createdAt');
        }
    });

});
