import { NextRequest } from 'next/server';
import { handle } from '@/lib/paseo/api';
export const runtime = 'nodejs';
export const maxDuration = 60;
async function handler(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(req, (await context.params).path);
}
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
