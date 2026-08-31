import crypto from 'crypto';

const SECRET_KEY = process.env.QR_SECRET_KEY || 'event-wristband-secret-2026';

export function generateQrHash(ticketId: string, icPassport: string): string {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${ticketId}:${icPassport.trim().toUpperCase()}`)
    .digest('hex');
}

export function verifyQrHash(ticketId: string, icPassport: string, hash: string): boolean {
  const expectedHash = generateQrHash(ticketId, icPassport);
  return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(hash));
}

export function generateShortTicketNumber(): string {
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TCK-${randomHex}`;
}
