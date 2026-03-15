import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getUserByUsername } from '@/lib/db';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('reinfo_session')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'No session' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
        }

        const user = await getUserByUsername(decoded.username);
        if (!user || !user.active) {
            return NextResponse.json({ success: false, message: 'User not found or inactive' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            user: {
                username: user.username,
                email: user.email,
                role: user.role,
                apiKey: user.api_key,
                quota: {
                    limit: user.quota_limit,
                    used: user.quota_used
                }
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
