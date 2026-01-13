import seed from '../seed.js';

export default async function () {
    console.log('🌱 Global test setup: Seeding database...');
    await seed();
    console.log('✅ Global test setup complete');
}