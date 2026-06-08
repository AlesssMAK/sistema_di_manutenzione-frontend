import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { cookies } from 'next/headers';
import { logErrorResponse } from '../../_utils/utils';
import { api } from '../../api';

export async function GET(req: NextRequest) {
  const cookie = await cookies();
  try {
    const types = req.nextUrl.searchParams.get('types') ?? undefined;
    const page = req.nextUrl.searchParams.get('page') ?? undefined;
    const perPage = req.nextUrl.searchParams.get('perPage') ?? undefined;
    const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') ?? undefined;

    const res = await api.get('/messages/announcements', {
      headers: { Cookie: cookie.toString() },
      params: {
        ...(types ? { types } : {}),
        ...(page ? { page } : {}),
        ...(perPage ? { perPage } : {}),
        ...(unreadOnly ? { unreadOnly } : {}),
      },
    });
    return NextResponse.json(res.data, { status: res.status });
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
