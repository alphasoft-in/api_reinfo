import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getAllUsers, adminUpdateUser, getUserByUsername, initDb, deleteUser } from '@/lib/db';

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
    
    if (decoded.role === 'superadmin') {
        console.log('Admin validated via JWT:', decoded.username);
        return { user: decoded };
    }

    // Fallback: Check DB in case role changed but JWT is old
    const user = await getUserByUsername(decoded.username);
    if (user && user.role === 'superadmin') {
        console.log('Admin validated via DB fallback:', user.username);
        return { user };
    }

    console.warn('Admin validation failed for:', decoded.username, 'Role:', decoded.role);
    return { error: 'Permisos de super-administrador requeridos' };
};

export async function GET(request) {
    const auth = await validateAdmin(request);
    if (auth.error) {
        return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    try {
        await initDb();
        const users = await getAllUsers();
        console.log('Admin API: Fetched', users.length, 'users');
        return NextResponse.json({ success: true, users });
    } catch (error) {
        console.error('Admin API ERROR:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = await validateAdmin(request);
    if (auth.error) {
        return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    try {
        const updates = await request.json();
        const { userId } = updates;
        
        // If we are activating payment and there's a requested plan, apply it
        if (updates.payment_status === 'active' && updates.requested_plan) {
            updates.plan = updates.requested_plan;
            updates.requested_plan = null;
            
            // Set quota based on actual plan configuration in DB
            const planesList = await getPlanes();
            const matchingPlan = planesList.find(p => p.name.toUpperCase() === updates.plan.toUpperCase());
            
            if (matchingPlan) {
                updates.quota_limit = Number(matchingPlan.limit.replace(/,/g, ''));
            } else {
                // Fallback
                const fallbackQuotas = { 'FREE': 5, 'PROFESSIONAL': 10000, 'ENTERPRISE': 1000000 };
                updates.quota_limit = fallbackQuotas[updates.plan.toUpperCase()] || 5;
            }
        }

        await adminUpdateUser(userId, updates);
        return NextResponse.json({ success: true, message: 'Usuario actualizado correctamente' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
export async function DELETE(request) {
    const auth = await validateAdmin(request);
    if (auth.error) {
        return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');
        
        if (!userId) {
            return NextResponse.json({ success: false, message: 'ID de usuario requerido' }, { status: 400 });
        }

        await deleteUser(userId);
        return NextResponse.json({ success: true, message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Admin API DELETE ERROR:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
