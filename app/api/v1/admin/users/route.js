import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getAllUsers, adminUpdateUser, getUserByUsername } from '@/lib/db';

const validateAdmin = async (request) => {
    const authHeader = request.headers.get('authorization');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('reinfo_session')?.value;

    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (sessionCookie) {
        token = sessionCookie;
    }

    if (!token) return { error: 'Sesión no encontrada' };
    
    const decoded = verifyToken(token);
    if (!decoded) return { error: 'Token inválido o expirado' };
    
    if (decoded.role === 'superadmin') return { user: decoded };

    // Fallback: Check DB in case role changed but JWT is old
    const user = await getUserByUsername(decoded.username);
    if (user && user.role === 'superadmin') return { user };

    return { error: 'Permisos de super-administrador requeridos' };
};

export async function GET(request) {
    const auth = await validateAdmin(request);
    if (auth.error) {
        return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    try {
        const users = await getAllUsers();
        return NextResponse.json({ success: true, users });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = await validateAdmin(request);
    if (auth.error) {
        return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    try {
        const { userId, plan, quota_limit, subscription_end, active, role, payment_status } = await request.json();
        await adminUpdateUser(userId, { plan, quota_limit, subscription_end, active, role, payment_status });
        return NextResponse.json({ success: true, message: 'Usuario actualizado correctamente' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
