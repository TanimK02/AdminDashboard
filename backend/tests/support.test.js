import app from "../index.js"
import request from 'supertest';
import prisma from "../src/prisma.js"

// GET   /tickets?status=&priority=&cursor=&limit=10
// GET   /tickets/:id
// PATCH /tickets/:id
// PATCH /tickets/bulk  // optional

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

describe("Support Ticket Routes", () => {
    let adminToken;

    beforeAll(async () => {
        adminToken = await getAdminToken();
    });

    it("should return 10 tickets with default limit", async () => {
        const res = await request(app)
            .get('/tickets?limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.tickets.length).toBeLessThanOrEqual(10);
        expect(Array.isArray(res.body.tickets)).toBe(true);
    });

    it("should return a single ticket by ID", async () => {
        const ticketsRes = await request(app)
            .get('/tickets?limit=1')
            .set('Authorization', `Bearer ${adminToken}`);

        if (ticketsRes.body.tickets.length > 0) {
            const ticketId = ticketsRes.body.tickets[0].id;

            const res = await request(app)
                .get(`/tickets/${ticketId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.ticket.id).toBe(ticketId);
        }
    });

    it("should update a ticket's status", async () => {
        const ticketsRes = await request(app)
            .get('/tickets?limit=1')
            .set('Authorization', `Bearer ${adminToken}`);

        if (ticketsRes.body.tickets.length > 0) {
            const ticket = ticketsRes.body.tickets[0];
            const newStatus = ticket.status === 'OPEN' ? 'RESOLVED' : 'OPEN';

            const res = await request(app)
                .patch(`/tickets/${ticket.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: newStatus });
            expect(res.statusCode).toBe(200);
            expect(res.body.ticket.status).toBe(newStatus);
        }
    });

    it("should update a ticket's priority", async () => {
        const ticketsRes = await request(app)
            .get('/tickets?limit=1')
            .set('Authorization', `Bearer ${adminToken}`);

        if (ticketsRes.body.tickets.length > 0) {
            const ticket = ticketsRes.body.tickets[0];
            const newPriority = 'HIGH';

            const res = await request(app)
                .patch(`/tickets/${ticket.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ priority: newPriority });
            expect(res.statusCode).toBe(200);
            expect(res.body.ticket.priority).toBe(newPriority);
        }
    });

    it("should bulk update ticket statuses", async () => {
        const ticketsRes = await request(app)
            .get('/tickets?limit=3')
            .set('Authorization', `Bearer ${adminToken}`);

        if (ticketsRes.body.tickets.length > 0) {
            const ticketIds = ticketsRes.body.tickets.map(t => t.id);
            const newStatus = 'RESOLVED';

            const res = await request(app)
                .patch('/tickets/bulk')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ ticketIds, status: newStatus });
            expect(res.statusCode).toBe(200);
            expect(res.body.updatedCount).toBe(ticketIds.length);
        }
    });

    it("should filter tickets by status", async () => {
        const res = await request(app)
            .get('/tickets?status=OPEN&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        if (res.body.tickets.length > 0) {
            expect(res.body.tickets.every(ticket => ticket.status === 'OPEN')).toBe(true);
        }
    });

    it("should filter tickets by priority", async () => {
        const res = await request(app)
            .get('/tickets?priority=HIGH&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        if (res.body.tickets.length > 0) {
            expect(res.body.tickets.every(ticket => ticket.priority === 'HIGH')).toBe(true);
        }
    });

    it("should support cursor-based pagination", async () => {
        // Get first page
        const firstPageRes = await request(app)
            .get('/tickets?limit=5')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(firstPageRes.statusCode).toBe(200);

        if (firstPageRes.body.tickets.length >= 5) {
            // Use last ticket ID as cursor for next page
            const lastTicketId = firstPageRes.body.tickets[4].id;
            const secondPageRes = await request(app)
                .get(`/tickets?cursor=${lastTicketId}&limit=5`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(secondPageRes.statusCode).toBe(200);

            // Second page tickets should be different from first page
            const firstPageIds = firstPageRes.body.tickets.map(t => t.id);
            const secondPageIds = secondPageRes.body.tickets.map(t => t.id);
            expect(firstPageIds.some(id => secondPageIds.includes(id))).toBe(false);
        }
    });

    it("should combine status and priority filters", async () => {
        const res = await request(app)
            .get('/tickets?status=OPEN&priority=URGENT&limit=5')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        if (res.body.tickets.length > 0) {
            expect(res.body.tickets.every(ticket =>
                ticket.status === 'OPEN' && ticket.priority === 'URGENT'
            )).toBe(true);
        }
    });

    it("should return empty array when no tickets match filters", async () => {
        const res = await request(app)
            .get('/tickets?status=NONEXISTENT&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.tickets)).toBe(true);
    });

    it("should include ticket details like title and user info", async () => {
        const res = await request(app)
            .get('/tickets?limit=1')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);

        if (res.body.tickets.length > 0) {
            const ticket = res.body.tickets[0];
            expect(ticket).toHaveProperty('id');
            expect(ticket).toHaveProperty('title');
            expect(ticket).toHaveProperty('status');
            expect(ticket).toHaveProperty('priority');
            expect(ticket).toHaveProperty('userId');
            expect(ticket).toHaveProperty('createdAt');
        }
    });

});

