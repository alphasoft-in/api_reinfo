import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateSecret, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { setUser2FASecret } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('reinfo_session')?.value;
        
        if (!token) {
            return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ success: false, message: 'Sesión inválida' }, { status: 401 });
        }

        const userId = decoded.id;
        const userEmail = decoded.email || 'user@reinfo.pro'; // Fallback if email not in token

        // Generate a new secret
        const secret = generateSecret();
        
        // Save temporary secret (optionally encrypted, but for now just saving)
        await setUser2FASecret(userId, secret);

        // Generate OTP Auth URL
        const otpauth = generateURI({ issuer: 'REINFO Pro', label: userEmail, secret });
        
        // Generate Data URL for QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

        return NextResponse.json({
            success: true,
            secret,
            qrCode: qrCodeDataUrl
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
