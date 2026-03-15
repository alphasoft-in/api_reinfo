import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete('reinfo_session');
    
    return NextResponse.json({ success: true, message: 'Sesión cerrada' });
}
