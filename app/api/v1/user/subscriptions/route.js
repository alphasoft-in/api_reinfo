import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getUserByUsername, getUserSubscriptions, initDb } from '@/lib/db';

export async function GET() {
    try {
        await initDb();
        const cookieStore = await cookies();
        const token = cookieStore.get('reinfo_session')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'No sesión' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ success: false, message: 'Token inválido' }, { status: 401 });
        }

        const user = await getUserByUsername(decoded.username);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 401 });
        }

        const history = await getUserSubscriptions(user.id);

        return NextResponse.json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Subscription History API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
