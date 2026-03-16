import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getUserByUsername, getTopQueriedRucs } from '@/lib/db';

export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('reinfo_session')?.value;

    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (sessionCookie) {
        token = sessionCookie;
    }

    if (!token) {
        return NextResponse.json({ success: false, message: 'No sesión' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return NextResponse.json({ success: false, message: 'Token inválido' }, { status: 401 });
    }

    try {
        const user = await getUserByUsername(decoded.username);
        const topRucs = await getTopQueriedRucs(5);

        return NextResponse.json({
            success: true,
            user: {
                username: user.username,
                plan: user.plan,
                quota_limit: user.quota_limit,
                quota_used: user.quota_used,
                subscription_end: user.subscription_end,
                active: user.active,
                two_factor_enabled: user.two_factor_enabled,
                payment_status: user.payment_status,
                requested_plan: user.requested_plan
            },
            analytics: user.role === 'superadmin' ? {
                topRucs
            } : null
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
