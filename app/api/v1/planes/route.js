import { NextResponse } from 'next/server';
import { getPlanes, updatePlan, initDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        await initDb();
        const planes = await getPlanes();
        // Ensure numeric fields are numbers
        const mappedPlanes = planes.map(p => ({
            ...p,
            price: Number(p.price.replace(/,/g, '')),
            limit: Number(p.limit.replace(/,/g, ''))
        }));
        return NextResponse.json({ success: true, planes: mappedPlanes });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const authHeader = req.headers.get('authorization');
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('reinfo_session')?.value;

        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (sessionCookie) {
            token = sessionCookie;
        }

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
