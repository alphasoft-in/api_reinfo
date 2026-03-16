import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { adminUpdateUser, getUserByUsername } from '@/lib/db';

export async function POST(request) {
    try {
        const { plan } = await request.json();
        const cookieStore = await cookies();
        const token = cookieStore.get('reinfo_session')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'No sesión' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        const user = await getUserByUsername(decoded.username);

        if (!user) {
            return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 401 });
        }

        // Map plan to quotas
        const quotas = {
            'FREE': 5,
            'PROFESSIONAL': 5000,
            'ENTERPRISE': 20000
        };

        const quotaLimit = quotas[plan.toUpperCase()] || 100;
        
        // Update user: only register the request
        await adminUpdateUser(user.id, {
            ...user,
            requested_plan: plan.toUpperCase(),
            payment_status: 'pending_approval'
        });
 
        return NextResponse.json({ 
            success: true, 
            message: `Solicitud de plan ${plan} registrada. Pendiente de aprobación del administrador.`,
            user: { ...user, requested_plan: plan.toUpperCase(), payment_status: 'pending_approval' }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
