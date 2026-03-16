import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getUserByUsername, getUserNotifications, markNotificationsAsRead } from '@/lib/db';

export async function GET(request) {
    try {
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

        const notifications = await getUserNotifications(user.id);
        return NextResponse.json({ success: true, notifications });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
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

        await markNotificationsAsRead(user.id);
        return NextResponse.json({ success: true, message: 'Notificaciones marcadas como leídas' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
