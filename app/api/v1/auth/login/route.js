import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { getUserByEmail, updateLoginStats } from '@/lib/db';

export async function POST(request) {
    try {
        let { email, password } = await request.json();

        // 1. Input Validation & Sanitization
        if (typeof email !== 'string' || typeof password !== 'string') {
            return NextResponse.json({ success: false, message: 'Formato de entrada inválido' }, { status: 400 });
        }

        email = email.trim().toLowerCase();
        if (!email || !password) {
            return NextResponse.json({ success: false, message: 'Correo y contraseña son requeridos' }, { status: 400 });
        }

        // Basic email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ success: false, message: 'Formato de correo inválido' }, { status: 400 });
        }

        const user = await getUserByEmail(email);

        if (!user) {
            return NextResponse.json({ success: false, message: 'Credenciales inválidas' }, { status: 401 });
        }

        // 1. Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
            return NextResponse.json(
                { success: false, message: `Cuenta bloqueada temporalmente. Intente en ${minutesLeft} min.` },
                { status: 429 }
            );
        }

        // 2. Validate Password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            const newAttempts = (user.failed_attempts || 0) + 1;
            let lockedUntil = null;
            
            if (newAttempts >= 5) {
                const lockDate = new Date();
                lockDate.setMinutes(lockDate.getMinutes() + 15); // Lock for 15 mins
                lockedUntil = lockDate.toISOString();
            }
            
            await updateLoginStats(user.id, newAttempts, lockedUntil);
            
            const remaining = 5 - newAttempts;
            return NextResponse.json(
                { success: false, message: remaining > 0 ? `Credenciales inválidas. ${remaining} intentos restantes.` : 'Cuenta bloqueada por seguridad (15 min).' },
                { status: 401 }
            );
        }

        if (!user.active) {
            return NextResponse.json({ success: false, message: 'Cuenta suspendida' }, { status: 403 });
        }

        // 3. Success: Reset stats and set Session
        await updateLoginStats(user.id, 0, null);

        // Check if 2FA is enabled
        if (user.two_factor_enabled) {
            // Return a temporary token for 2FA verification
            const mfaToken = signToken({
                id: user.id,
                username: user.username,
                role: user.role,
                mfa_pending: true
            });

            return NextResponse.json({
                success: true,
                mfaRequired: true,
                mfaToken
            });
        }

        const token = signToken({
            id: user.id,
            username: user.username,
            role: user.role
        });

        const response = NextResponse.json({
            success: true,
            user: {
                username: user.username,
                email: user.email,
                role: user.role,
                apiKey: user.api_key,
                quota: {
                    limit: user.quota_limit,
                    used: user.quota_used
                }
            }
        });

        // 4. Set HTTP-ONLY Cookie
        (await cookies()).set('reinfo_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
