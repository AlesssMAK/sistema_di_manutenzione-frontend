import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { cookies } from 'next/headers';
import { logErrorResponse } from '../../_utils/utils';
import { api } from '../../api';

export async function GET(req: NextRequest) {
  const cookie = await cookies();
  const { searchParams } = new URL(req.url);

  try {
    // BE route is /audit-log (not /admin/audit-log) — /admin is owned
    // by the AdminJS panel. This Next proxy path stays /api/admin/...
    // since there's no AdminJS on the Next side to collide with.
    const res = await api.get('/audit-log', {
      params: searchParams,
      headers: { Cookie: cookie.toString() },
    });
    return NextResponse.json(res.data);
  } catch (error) {
    if (isAxiosError(error)) {
      logErrorResponse(error.response?.data);
      return NextResponse.json(
        { error: error.response?.data },
        { status: error.response?.status || 500 }
      );
    }
    logErrorResponse({ message: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
