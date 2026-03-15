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
            'FREE': 100,
            'PROFESSIONAL': 10000,
            'ENTERPRISE': 1000000
        };

        const quotaLimit = quotas[plan.toUpperCase()] || 100;
        
        // Update user (In a real app, this would happen AFTER payment)
        await adminUpdateUser(user.id, {
            plan: plan.toUpperCase(),
            quota_limit: quotaLimit,
            subscription_end: user.subscription_end, // Keep current or extend
            active: true,
            role: user.role
        });

        return NextResponse.json({ 
            success: true, 
            message: `Plan actualizado a ${plan}`,
            user: { ...user, plan: plan.toUpperCase(), quota_limit: quotaLimit }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
