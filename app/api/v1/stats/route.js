import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getStats } from '@/lib/db';

const validateAuth = async (request) => {
    const authHeader = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('reinfo_session')?.value;

    if (apiKey === process.env.API_KEY || (apiKey && apiKey.startsWith('sk_'))) {
        return { success: true };
    }

    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (sessionCookie) {
        token = sessionCookie;
    }

    if (token) {
        const decoded = verifyToken(token);
        if (decoded) return { success: true };
    }

    return { success: false };
};

export async function GET(request) {
    const auth = await validateAuth(request);
    if (!auth.success) {
        return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    try {
        const stats = await getStats();
        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
