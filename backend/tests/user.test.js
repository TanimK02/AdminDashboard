import app from "../index.js"
import request from 'supertest';
import prisma from "../src/prisma.js"

// Users
// GET    /users?status=&role=&cursor=&limit=10
// GET    /users/:id
// PATCH  /users/:id
// PATCH  /users/bulk   // optional

const getAdminToken = async () => {
    const data = await request(app).post('/api/auth/login')
        .send({
            password: process.env.ADMIN_PASSWORD
        });
    return data.body.token;
}

describe("test if getAdminToken works", () => {
    it("should return a valid JWT token for admin", async () => {
        const token = await getAdminToken();
        expect(token).toBeDefined();
        expect(typeof token).toBe("string");
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe("User Routes", () => {
    let adminToken;

    beforeAll(async () => {
        adminToken = await getAdminToken();
    });

    it("should return up to 10 users", async () => {
        const res = await request(app)
            .get('/users?limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.users.length).toBeLessThanOrEqual(10);
        expect(Array.isArray(res.body.users)).toBe(true);
    });

    it("should return a single user by ID", async () => {
        const usersRes = await request(app)
            .get('/users?limit=1')
            .set('Authorization', `Bearer ${adminToken}`);
        const userId = usersRes.body.users[0].id;

        const res = await request(app)
            .get(`/users/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.user.id).toBe(userId);
    });

    it("should update a user's status", async () => {
        const usersRes = await request(app)
            .get('/users?limit=1')
            .set('Authorization', `Bearer ${adminToken}`);
        const user = usersRes.body.users[0];
        const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

        const res = await request(app)
            .patch(`/users/${user.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: newStatus });
        expect(res.statusCode).toBe(200);
        expect(res.body.user.status).toBe(newStatus);
    });

    it("should bulk update user statuses", async () => {
        const usersRes = await request(app)
            .get('/users?limit=3')
            .set('Authorization', `Bearer ${adminToken}`);
        const userIds = usersRes.body.users.map(u => u.id);
        const newStatus = 'SUSPENDED';

        const res = await request(app)
            .patch('/users/bulk')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ userIds, status: newStatus });
        expect(res.statusCode).toBe(200);
        expect(res.body.updatedCount).toBe(3);
    });

    it("should filter users by status", async () => {
        const res = await request(app)
            .get('/users?status=ACTIVE&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.users.every(user => user.status === 'ACTIVE')).toBe(true);
    });

    it("should filter users by role", async () => {
        const res = await request(app)
            .get('/users?role=ADMIN&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.users.every(user => user.role === 'ADMIN')).toBe(true);
    });

    it("should support cursor-based pagination", async () => {
        // Get first page
        const firstPageRes = await request(app)
            .get('/users?limit=5')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(firstPageRes.statusCode).toBe(200);
        expect(firstPageRes.body.users.length).toBe(5);

        // Use last user ID as cursor for next page
        const lastUserId = firstPageRes.body.users[4].id;
        const secondPageRes = await request(app)
            .get(`/users?cursor=${lastUserId}&limit=5`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(secondPageRes.statusCode).toBe(200);

        // Second page users should be different from first page
        const firstPageIds = firstPageRes.body.users.map(u => u.id);
        const secondPageIds = secondPageRes.body.users.map(u => u.id);
        expect(firstPageIds.some(id => secondPageIds.includes(id))).toBe(false);
    });

    it("should combine multiple query parameters", async () => {
        const res = await request(app)
            .get('/users?status=ACTIVE&role=USER&limit=5')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.users.every(user =>
            user.status === 'ACTIVE' && user.role === 'USER'
        )).toBe(true);
    });

    it("should return empty array when no users match filters", async () => {
        const res = await request(app)
            .get('/users?status=SUSPENDED&role=ADMIN&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.users)).toBe(true);
    });

});



