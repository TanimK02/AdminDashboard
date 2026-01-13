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

    // Clear existing data
    await prisma.supportTicket.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Cleared existing data');

    // Create 50 users
    const users = [];
    for (let i = 0; i < 50; i++) {
        const user = await prisma.user.create({
            data: {
                email: faker.internet.email(),
                role: i < 5 ? 'ADMIN' : 'USER', // First 5 users are admins
                status: faker.helpers.weightedArrayElement([
                    { weight: 0.9, value: 'ACTIVE' },
                    { weight: 0.1, value: 'SUSPENDED' }
                ]),
                lastLogin: faker.datatype.boolean(0.8)
                    ? faker.date.recent({ days: 30 })
                    : null,
            }
        });
        users.push(user);
    }

    console.log(`✅ Created ${users.length} users`);

    // Create subscriptions for about 70% of users
    const subscriptionPlans = [
        { plan: 'Basic', price: 9.99 },
        { plan: 'Pro', price: 19.99 },
        { plan: 'Premium', price: 39.99 },
        { plan: 'Enterprise', price: 99.99 }
    ];

    let subscriptionCount = 0;
    for (const user of users) {
        if (faker.datatype.boolean(0.7)) { // 70% chance of having subscription
            const selectedPlan = faker.helpers.arrayElement(subscriptionPlans);
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    plan: selectedPlan.plan,
                    price: selectedPlan.price,
                    status: faker.helpers.weightedArrayElement([
                        { weight: 0.85, value: 'ACTIVE' },
                        { weight: 0.10, value: 'CANCELED' },
                        { weight: 0.05, value: 'FAILED' }
                    ]),
                    createdAt: faker.date.recent({ days: 365 })
                }
            });
            subscriptionCount++;
        }
    }

    console.log(`✅ Created ${subscriptionCount} subscriptions`);

    // Create support tickets for about 30% of users
    const ticketTitles = [
        'Login Issues',
        'Payment Problem',
        'Feature Request',
        'Bug Report',
        'Account Suspension Appeal',
        'Billing Question',
        'Technical Support',
        'Password Reset Help',
        'Data Export Request',
        'Account Deletion Request'
    ];

    let ticketCount = 0;
    for (const user of users) {
        if (faker.datatype.boolean(0.3)) { // 30% chance of having ticket
            await prisma.supportTicket.create({
                data: {
                    userId: user.id,
                    title: faker.helpers.arrayElement(ticketTitles),
                    status: faker.helpers.weightedArrayElement([
                        { weight: 0.3, value: 'OPEN' },
                        { weight: 0.7, value: 'RESOLVED' }
                    ]),
                    priority: faker.helpers.weightedArrayElement([
                        { weight: 0.4, value: 'LOW' },
                        { weight: 0.4, value: 'MEDIUM' },
                        { weight: 0.15, value: 'HIGH' },
                        { weight: 0.05, value: 'URGENT' }
                    ]),
                    createdAt: faker.date.recent({ days: 90 })
                }
            });
            ticketCount++;
        }
    }

    console.log(`✅ Created ${ticketCount} support tickets`);
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