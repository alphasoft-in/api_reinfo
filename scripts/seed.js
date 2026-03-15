const { initDb, getUserByUsername, createUser } = require('../lib/db');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('--- Database Seed Starting (Neon) ---');
    try {
        // Ensure tables exist
        await initDb();
        console.log('OK: Tables initialized.');

        const adminUsername = 'admin';
        const adminUser = await getUserByUsername(adminUsername);
        
        if (!adminUser) {
            console.log(`Creating admin user: ${adminUsername}...`);
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await createUser({
                username: adminUsername,
                password: hashedPassword,
                email: 'admin@reinfo.pe',
                role: 'user',
                plan: 'BASIC',
                quota_limit: 100
            });
            
            console.log('👤 Admin user created: admin / admin123');
        } else {
            console.log('INFO: Admin user already exists.');
        }
    } catch (error) {
        console.error('FAIL: Seed failed:', error);
    }
}

seed();
