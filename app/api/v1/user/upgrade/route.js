import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { adminUpdateUser, getUserByUsername } from '@/lib/db';

export async function POST(request) {
    try {
        const { plan, amount, type, reference } = await request.json();
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

        // Update user: register the request and payment proof
        await adminUpdateUser(user.id, {
            ...user,
            requested_plan: plan.toUpperCase(),
            payment_status: 'pending_approval',
            payment_amount: amount,
            payment_type: type,
            payment_reference: reference
        });
 
        return NextResponse.json({ 
            success: true, 
            message: `Solicitud de plan ${plan} registrada. Pendiente de aprobación del administrador.`,
            user: { 
                ...user, 
                requested_plan: plan.toUpperCase(), 
                payment_status: 'pending_approval',
                payment_amount: amount,
                payment_type: type,
                payment_reference: reference
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
