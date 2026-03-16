import { NextResponse } from 'next/server';
import { getPlanes, updatePlan, initDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        await initDb();
        const planes = await getPlanes();
        return NextResponse.json({ success: true, planes });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;
        const decoded = await verifyToken(token);

        if (!decoded || decoded.role !== 'superadmin') {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const { id, price, limit, features } = await req.json();
        await updatePlan(id, { price, limit, features });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
