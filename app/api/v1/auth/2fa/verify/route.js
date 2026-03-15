import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticator } from 'otplib';
import { getUserById, enableUser2FA } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
    try {
        const { code } = await request.json();
        const cookieStore = await cookies();
        const token = cookieStore.get('reinfo_session')?.value;
        
        if (!token) {
            return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ success: false, message: 'Sesión inválida' }, { status: 401 });
        }

        const user = await getUserById(decoded.id);
        if (!user || !user.two_factor_secret) {
            return NextResponse.json({ success: false, message: '2FA no configurado' }, { status: 400 });
        }

        // Verify the code
        const isValid = authenticator.verify({
            token: code,
            secret: user.two_factor_secret
        });

        if (!isValid) {
            return NextResponse.json({ success: false, message: 'Código inválido' }, { status: 400 });
        }

        // Enable 2FA for the user
        await enableUser2FA(user.id, true);

        return NextResponse.json({
            success: true,
            message: '2FA activado correctamente'
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
