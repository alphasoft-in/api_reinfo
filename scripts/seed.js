const { initDb, getUserByUsername, createUser } = require('../lib/db');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('--- Database Seed Starting (Neon) ---');
    try {
        // Ensure tables exist
        await initDb();
        console.log('OK: Tables initialized.');

        const adminEmail = 'admin@reinfo.pe';
        const adminUser = await getUserByEmail(adminEmail);
        
        if (!adminUser) {
            console.log(`Creating admin user: ${adminEmail}...`);
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await createUser({
                email: adminEmail,
                password: hashedPassword,
                role: 'user',
                plan: 'BASIC',
                quota_limit: 100
            });
            
            console.log('👤 Admin user created: admin@reinfo.pe / admin123');
        } else {
            console.log('INFO: Admin user already exists.');
        }
    } catch (error) {
        console.error('FAIL: Seed failed:', error);
    }
}

seed();
