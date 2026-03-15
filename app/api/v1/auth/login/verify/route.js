import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySync } from 'otplib';
import { signToken, verifyToken } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export async function POST(request) {
    try {
        const { code, mfaToken } = await request.json();

        if (!mfaToken) {
            return NextResponse.json({ success: false, message: 'Token de MFA requerido' }, { status: 400 });
        }

        const decoded = verifyToken(mfaToken);
        if (!decoded || !decoded.mfa_pending) {
            return NextResponse.json({ success: false, message: 'Token de MFA inválido o expirado' }, { status: 401 });
        }

        const user = await getUserById(decoded.id);
        if (!user || !user.two_factor_secret) {
            return NextResponse.json({ success: false, message: 'Usuario no encontrado o 2FA no configurado' }, { status: 404 });
        }

        // Verify the code
        const isValid = verifySync({
            token: code,
            secret: user.two_factor_secret
        });

        if (!isValid) {
            return NextResponse.json({ success: false, message: 'Código de verificación inválido' }, { status: 401 });
        }

        // Success: Sign final token
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
                },
                two_factor_enabled: user.two_factor_enabled
            }
        });

        // Set HTTP-ONLY Cookie
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
