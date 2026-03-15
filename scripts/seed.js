const { initDb, getUserByUsername, createUser } = require('../lib/db');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('--- Database Seed Starting (Neon) ---');
    try {
        // Ensure tables exist
        await initDb();
        console.log('OK: Tables initialized.');

        // In real data mode, we only initialize tables.
        // Seeding users is removed to ensure only real company data is used.
        console.log('INFO: Infrastructure ready for real data.');
    } catch (error) {
        console.error('FAIL: Seed failed:', error);
    }
}

seed();
