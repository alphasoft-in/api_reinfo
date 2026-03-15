import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getUserByUsername, getSql } from '@/lib/db';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('reinfo_session')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'No sesión' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ success: false, message: 'Sesión inválida' }, { status: 401 });
        }

        const user = await getUserByUsername(decoded.username);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 404 });
        }

        const newApiKey = 'sk_reinfo_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        const sql = getSql();
        await sql`UPDATE usuarios SET api_key = ${newApiKey} WHERE id = ${user.id}`;

        return NextResponse.json({
            success: true,
            message: 'API Key regenerada correctamente',
            apiKey: newApiKey
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
