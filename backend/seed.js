import prisma from './src/prisma.js';
import { faker } from '@faker-js/faker';

let isSeeding = false;
let hasSeeded = false;

export default async function seed() {
    // Prevent concurrent seeding
    if (isSeeding || hasSeeded) {
        console.log('🌱 Seed already running or completed, skipping...');
        return;
    }

    isSeeding = true;
    console.log('🌱 Starting database seed...');

    // Make output deterministic between runs
    faker.seed(42);

    // Clear existing data (delete in safe order for relations)
    await prisma.activityLog.deleteMany();
    await prisma.supportTicket.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Cleared existing data');

    const now = new Date();
    const daysAgo = (n) => {
        const d = new Date(now);
        d.setDate(d.getDate() - n);
        return d;
    };

    const pickWeighted = (pairs) => faker.helpers.weightedArrayElement(pairs);
    const bool = (probability) => faker.datatype.boolean({ probability });

    // Create users (a few predictable admin accounts + realistic users)
    const userCount = 120;
    const adminCount = 8;
    const users = [];
    const admins = [];

    for (let i = 0; i < userCount; i++) {
        const role = i < adminCount ? 'ADMIN' : 'USER';
        const createdAt = faker.date.between({ from: daysAgo(365), to: now });
        const status = pickWeighted([
            { weight: 0.88, value: 'ACTIVE' },
            { weight: 0.12, value: 'SUSPENDED' },
        ]);

        // Ensure lastLogin is after createdAt (or null)
        const lastLogin =
            bool(0.78) && status === 'ACTIVE'
                ? faker.date.between({ from: createdAt, to: now })
                : null;

        const email =
            role === 'ADMIN'
                ? `admin${i + 1}@example.com`
                : faker.internet.email({ provider: 'example.com' }).toLowerCase();

        const user = await prisma.user.create({
            data: {
                email,
                role,
                status,
                createdAt,
                lastLogin,
            },
        });

        users.push(user);
        if (role === 'ADMIN') admins.push(user);
    }

    console.log(`✅ Created ${users.length} users`);

    // Create subscriptions for about 70% of USERS (not admins)
    const subscriptionPlans = [
        { plan: 'Starter', price: 9.99 },
        { plan: 'Pro', price: 19.99 },
        { plan: 'Business', price: 39.99 },
        { plan: 'Enterprise', price: 99.99 },
    ];

    let subscriptionCount = 0;
    const subscriptionsByUserId = new Map();

    for (const user of users.filter((u) => u.role === 'USER')) {
        if (bool(0.7)) { // 70% chance of having subscription
            const selectedPlan = faker.helpers.arrayElement(subscriptionPlans);
            const status = pickWeighted([
                { weight: 0.82, value: 'ACTIVE' },
                { weight: 0.12, value: 'CANCELED' },
                { weight: 0.06, value: 'FAILED' },
            ]);

            const createdAt = faker.date.between({ from: user.createdAt, to: now });

            const subscription = await prisma.subscription.create({
                data: {
                    userId: user.id,
                    plan: selectedPlan.plan,
                    price: selectedPlan.price,
                    status,
                    createdAt,
                },
            });
            subscriptionCount++;
            subscriptionsByUserId.set(user.id, subscription);
        }
    }

    console.log(`✅ Created ${subscriptionCount} subscriptions`);

    // Create support tickets for about 35% of USERS, with some having multiple tickets
    const ticketTitles = [
        'Login issue after password reset',
        'Billing question about recent charge',
        'Feature request: export to CSV',
        'Bug: dashboard not loading',
        'Account suspension appeal',
        'Payment failed but card is valid',
        'Can’t update profile email',
        'Need help upgrading plan',
        'Refund request',
        'Data export request',
    ];

    let ticketCount = 0;
    const ticketsById = new Map();

    for (const user of users) {
        if (user.role !== 'USER') continue;
        if (!bool(0.35)) continue;

        const howMany = pickWeighted([
            { weight: 0.75, value: 1 },
            { weight: 0.20, value: 2 },
            { weight: 0.05, value: 3 },
        ]);

        for (let i = 0; i < howMany; i++) {
            const status = pickWeighted([
                { weight: 0.35, value: 'OPEN' },
                { weight: 0.65, value: 'RESOLVED' },
            ]);

            const priority = pickWeighted([
                { weight: 0.35, value: 'LOW' },
                { weight: 0.40, value: 'MEDIUM' },
                { weight: 0.18, value: 'HIGH' },
                { weight: 0.07, value: 'URGENT' },
            ]);

            const createdAt = faker.date.between({ from: user.createdAt, to: now });
            const ticket = await prisma.supportTicket.create({
                data: {
                    userId: user.id,
                    title: faker.helpers.arrayElement(ticketTitles),
                    status,
                    priority,
                    createdAt,
                },
            });

            ticketsById.set(ticket.id, ticket);
            ticketCount++;
        }
    }

    console.log(`✅ Created ${ticketCount} support tickets`);

    // Activity logs (mix of admin, user, and system events)
    const activityActions = {
        user: [
            'User signed up',
            'User updated profile',
            'User changed password',
            'User upgraded subscription',
            'User canceled subscription',
            'User created support ticket',
        ],
        admin: [
            'Admin login successful',
            'Admin updated user status',
            'Admin resolved support ticket',
            'Admin bulk updated users',
            'Admin bulk updated tickets',
        ],
        system: [
            'System scheduled job completed',
            'System failed admin login attempt',
            'System maintenance window started',
        ],
    };

    let activityCount = 0;

    // Per-user activity logs
    for (const user of users.filter((u) => u.role === 'USER')) {
        const count = faker.number.int({ min: 0, max: 6 });
        for (let i = 0; i < count; i++) {
            const createdAt = faker.date.between({ from: user.createdAt, to: now });
            const action = faker.helpers.arrayElement(activityActions.user);

            // Try to attach an entity when it makes sense
            let entityType = 'USER';
            let entityId = user.id;
            let metadata = null;

            if (action.includes('subscription')) {
                const sub = subscriptionsByUserId.get(user.id);
                if (sub) {
                    entityType = 'SUBSCRIPTION';
                    entityId = sub.id;
                    metadata = { plan: sub.plan, status: sub.status };
                }
            } else if (action.includes('support ticket')) {
                // find any ticket for this user (best-effort)
                const ticket = Array.from(ticketsById.values()).find((t) => t.userId === user.id);
                if (ticket) {
                    entityType = 'TICKET';
                    entityId = ticket.id;
                    metadata = { status: ticket.status, priority: ticket.priority };
                }
            } else if (action.includes('signed up')) {
                metadata = { source: faker.helpers.arrayElement(['web', 'mobile', 'referral']) };
            }

            await prisma.activityLog.create({
                data: {
                    actorType: 'USER',
                    actorId: user.id,
                    userId: user.id,
                    action,
                    entityType,
                    entityId,
                    metadata,
                    createdAt,
                },
            });
            activityCount++;
        }
    }

    // Admin/system activity logs
    const adminLogs = faker.number.int({ min: 15, max: 35 });
    for (let i = 0; i < adminLogs; i++) {
        const createdAt = faker.date.between({ from: daysAgo(60), to: now });
        const admin = faker.helpers.arrayElement(admins);
        const action = faker.helpers.arrayElement(activityActions.admin);

        await prisma.activityLog.create({
            data: {
                actorType: 'ADMIN',
                actorId: admin.id,
                action,
                entityType: faker.helpers.arrayElement(['USER', 'TICKET', 'SUBSCRIPTION', 'SYSTEM']),
                entityId: null,
                metadata: { adminEmail: admin.email },
                createdAt,
            },
        });
        activityCount++;
    }

    const systemLogs = faker.number.int({ min: 5, max: 12 });
    for (let i = 0; i < systemLogs; i++) {
        const createdAt = faker.date.between({ from: daysAgo(30), to: now });
        const action = faker.helpers.arrayElement(activityActions.system);
        await prisma.activityLog.create({
            data: {
                actorType: 'SYSTEM',
                actorId: null,
                action,
                entityType: 'SYSTEM',
                entityId: null,
                metadata: action.includes('failed') ? { ip: faker.internet.ipv4() } : null,
                createdAt,
            },
        });
        activityCount++;
    }

    console.log(`✅ Created ${activityCount} activity logs`);
    console.log('🎉 Database seeded successfully!');

    hasSeeded = true;
    isSeeding = false;
}

seed()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });