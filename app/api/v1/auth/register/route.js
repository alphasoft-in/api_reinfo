import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, getUserByUsername } from '@/lib/db';

export async function POST(request) {
    try {
        const { username, password, email, plan } = await request.json();

        // Validate if user exists
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: 'El usuario ya existe' },
                { status: 400 }
            );
        }

        let quota_limit = 100;
        if (plan === 'PROFESSIONAL') quota_limit = 10000;
        if (plan === 'ENTERPRISE') quota_limit = 1000000;

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days subscription

        const hashedPassword = await bcrypt.hash(password, 10);
        const { id, apiKey } = await createUser({
            username,
            password: hashedPassword,
            email,
            role: 'user',
            plan: plan || 'FREE',
            quota_limit,
            subscription_end: expiryDate.toISOString()
        });

        return NextResponse.json({
            success: true,
            message: 'Usuario registrado correctamente',
            userId: id,
            apiKey
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
