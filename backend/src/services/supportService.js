import prisma from "../prisma.js";

// Valid enum values from Prisma schema
const VALID_TICKET_STATUS = ['OPEN', 'RESOLVED'];
const VALID_TICKET_PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// GET   /tickets?status=&priority=&cursor=&limit=10
// GET   /tickets/:id
// PATCH /tickets/:id
// PATCH /tickets/bulk  // optional

//     generator client {
//   provider = "prisma-client-js"
//   output   = "../generated/prisma"
// }

// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
// }

// enum Role {
//   ADMIN
//   USER
// }

// enum UserStatus {
//   ACTIVE
//   SUSPENDED
// }

// enum SubscriptionStatus {
//   ACTIVE
//   CANCELED
//   FAILED
// }

// enum TicketStatus {
//   OPEN
//   RESOLVED
// }

// enum TicketPriority {
//   LOW
//   MEDIUM
//   HIGH
//   URGENT
// }

// enum ActorType {
//   USER
//   ADMIN
//   SYSTEM
// }

// enum EntityType {
//   USER
//   SUBSCRIPTION
//   TICKET
//   SYSTEM
// }

// model User {
//   id        String     @id @default(uuid())
//   email     String     @unique
//   role      Role       @default(USER)
//   status    UserStatus @default(ACTIVE)
//   createdAt DateTime   @default(now())
//   lastLogin DateTime?

//   // Relations
//   subscriptions  Subscription[]
//   activityLogs   ActivityLog[]   @relation("UserActivityLogs")
//   supportTickets SupportTicket[]
// }

// model Subscription {
//   id        String             @id @default(uuid())
//   userId    String
//   plan      String
//   price     Float
//   status    SubscriptionStatus @default(ACTIVE)
//   createdAt DateTime           @default(now())

//   // Relations
//   user User @relation(fields: [userId], references: [id], onDelete: Cascade)
// }

// model ActivityLog {
//   id String @id @default(uuid())

//   // Who caused the event
//   actorType ActorType @default(USER)
//   actorId   String? // optional, null for system events

//   // What happened
//   action String

//   // What entity was affected
//   entityType EntityType
//   entityId   String?

//   // Extra context
//   metadata Json?

//   createdAt DateTime @default(now())

//   // Optional relation to user for queries
//   user   User?   @relation("UserActivityLogs", fields: [userId], references: [id])
//   userId String?
// }

// model SupportTicket {
//   id        String         @id @default(uuid())
//   userId    String
//   title     String
//   status    TicketStatus   @default(OPEN)
//   priority  TicketPriority @default(MEDIUM)
//   createdAt DateTime       @default(now())

//   // Relations
//   user User @relation(fields: [userId], references: [id], onDelete: Cascade)
// }

export async function getSupportTickets({ status, priority, cursor, limit = 10 }) {
    const where = {};
    // Validate and only add status if it's a valid enum value
    if (status && VALID_TICKET_STATUS.includes(status)) where.status = status;
    // Validate and only add priority if it's a valid enum value
    if (priority && VALID_TICKET_PRIORITY.includes(priority)) where.priority = priority;

    const tickets = await prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // Fetch one extra to check for next page
        ...(cursor && {
            skip: 1, // Skip the cursor item
            cursor: { id: cursor }
        })
    });

    let nextCursor = null;
    if (tickets.length > limit) {
        const nextItem = tickets.pop();
        nextCursor = nextItem.id;
    }

    return {
        tickets,
        nextCursor
    };
}

export async function getSupportTicketById(id) {
    const ticket = await prisma.supportTicket.findUnique({
        where: { id },
    });
    return ticket;
}

export async function updateSupportTicket(id, updates) {
    const ticket = await prisma.supportTicket.update({
        where: { id },
        data: updates,
    });
    return ticket;
}

export async function bulkUpdateSupportTickets(ids, updates) {
    const tickets = await prisma.supportTicket.updateMany({
        where: { id: { in: ids } },
        data: updates,
    });
    return tickets;
}

export async function getTicketStats() {
    const [open, resolved, urgent] = await Promise.all([
        prisma.supportTicket.count({ where: { status: 'OPEN' } }),
        prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
        prisma.supportTicket.count({ where: { priority: 'URGENT' } }),
    ]);

    return { open, resolved, urgent };
}