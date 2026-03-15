import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, getUserByUsername } from '@/lib/db';

export async function POST(request) {
    try {
        let { username, password, email, plan } = await request.json();

        // 1. Input Validation & Sanitization
        if (typeof username !== 'string' || typeof password !== 'string' || typeof email !== 'string') {
            return NextResponse.json({ success: false, message: 'Formato de entrada inválido' }, { status: 400 });
        }

        username = username.trim().toLowerCase();
        email = email.trim().toLowerCase();

        if (!username || !password || !email) {
            return NextResponse.json({ success: false, message: 'Todos los campos son requeridos' }, { status: 400 });
        }

        if (username.length < 3 || username.length > 20) {
            return NextResponse.json({ success: false, message: 'El usuario debe tener entre 3 y 20 caracteres' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ success: false, message: 'Formato de correo inválido' }, { status: 400 });
        }

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

        const isSuperAdmin = email?.toLowerCase() === 'rtipiani@gmail.com';
        const role = isSuperAdmin ? 'superadmin' : 'user';
        const finalPlan = isSuperAdmin ? 'PLATFORM' : (plan || 'BASIC');
        if (isSuperAdmin) quota_limit = 999999999; // Unlimited effectively

        const hashedPassword = await bcrypt.hash(password, 10);
        const { id, apiKey } = await createUser({
            username,
            password: hashedPassword,
            email,
            role,
            plan: finalPlan,
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
