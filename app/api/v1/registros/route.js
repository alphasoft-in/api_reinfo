import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getRegistros, countRegistros, getStats, getUserByUsername, getUserByApiKey, updateQuota, logConsulta } from '@/lib/db';

const validateAuth = async (request) => {
    const apiKey = request.headers.get('x-api-key');
    const authHeader = request.headers.get('authorization');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('reinfo_session')?.value;

    let user;
    
    // 1. Check API Key
    if (apiKey) {
        user = await getUserByApiKey(apiKey);
        if (user) return { success: true, mode: 'api_key', user };
    }

    // 2. Check JWT
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (sessionCookie) {
        token = sessionCookie;
    }

    if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
            user = await getUserByUsername(decoded.username);
            if (user) return { success: true, mode: 'jwt', user };
        }
    }

    return { success: false };
};

export async function GET(request) {
    const auth = await validateAuth(request);
    if (!auth.success) {
        return NextResponse.json({ success: false, message: 'No autorizado o API Key inválida' }, { status: 401 });
    }

    const { user } = auth;

    // Quota and Subscription Check - Universal check for all modes
    // 1. Plan/Expiry check
    if (user.subscription_end && new Date(user.subscription_end) < new Date()) {
        return NextResponse.json({ success: false, message: 'Suscripción expirada' }, { status: 403 });
    }

    // 2. Quota check
    if (user.quota_used >= user.quota_limit) {
        return NextResponse.json({ success: false, message: 'Cuota de consultas excedida' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const ruc = searchParams.get('ruc');
        const name = searchParams.get('name');
        const codigoUnico = searchParams.get('codigoUnico');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit')) || 25;
        const offset = parseInt(searchParams.get('offset')) || 0;

        const filter = { ruc, minero: name, codigoUnico };
        if (status === 'vigente') filter.estado = 'VIGENTE';
        if (status === 'suspendido') filter.estado = 'SUSPENDIDO';

        const data = await getRegistros(filter, limit, offset);
        const filteredCount = await countRegistros(filter);
        const stats = await getStats();

        // Perform Logging and Quota Update if Search happened (any search)
        if (ruc || name || codigoUnico) {
            await updateQuota(user.id);
            if (ruc) await logConsulta(user.id, ruc);
        }

        return NextResponse.json({
            success: true,
            count: data.length,
            totalCount: stats.total,
            filteredCount,
            data
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

