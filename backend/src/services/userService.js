import prisma from "../prisma.js";

// Valid enum values from Prisma schema
const VALID_USER_STATUS = ['ACTIVE', 'SUSPENDED'];
const VALID_ROLES = ['ADMIN', 'USER'];

const getUsers = async (status = null, role = null, cursor = null, limit = 10) => {
    const where = {};

    // Validate and only add status if it's a valid enum value
    if (status && VALID_USER_STATUS.includes(status)) {
        where.status = status;
    }

    // Validate and only add role if it's a valid enum value  
    if (role && VALID_ROLES.includes(role)) {
        where.role = role;
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

    const users = await prisma.user.findMany(queryOptions);
    return users;
};

const getUserById = async (userId) => {
    return await prisma.user.findUnique({
        where: { id: userId },
    });
};

const updateUserStatus = async (userId, status) => {
    return await prisma.user.update({
        where: { id: userId },
        data: { status },
    });
};

const bulkUpdateUserStatus = async (userIds, status) => {
    const result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { status },
    });
    return result.count; // number of records updated
};

const getUserStats = async () => {
    const [active, suspended, admins, regularUsers] = await Promise.all([
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { status: 'SUSPENDED' } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { role: 'USER' } }),
    ]);

    return { active, suspended, admins, users: regularUsers };
};

export { getUsers, getUserById, updateUserStatus, bulkUpdateUserStatus, getUserStats };



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
