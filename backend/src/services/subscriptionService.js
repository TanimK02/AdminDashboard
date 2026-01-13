import prisma from "../prisma.js";

// Valid enum values from Prisma schema
const VALID_SUBSCRIPTION_STATUS = ['ACTIVE', 'CANCELED', 'FAILED'];

// GET /subscriptions?status=&cursor=&limit=10
// GET /subscriptions/:id      // optional


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

export async function getSubscriptions({ status, cursor, limit = 10 }) {
    // Build query filters
    const filters = {};
    // Validate and only add status if it's a valid enum value
    if (status && VALID_SUBSCRIPTION_STATUS.includes(status)) {
        filters.status = status;
    }
    if (cursor) {
        filters.id = { gt: cursor }; // Assuming cursor is the last fetched ID
    }

    // Fetch multiple subscriptions with filters and pagination
    const subscriptions = await prisma.subscription.findMany({
        where: filters,
        orderBy: { id: 'asc' },
        take: limit,
    });
    return subscriptions;

}

export async function getSubscriptionById(subscriptionId) {
    // Fetch a single subscription by ID
    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
    });
    return subscription;
}