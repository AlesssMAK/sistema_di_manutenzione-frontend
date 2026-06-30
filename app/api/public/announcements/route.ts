import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { logErrorResponse } from '../../_utils/utils';
import { api } from '../../api';

// Public board — no cookie/auth forwarded; anyone can read.
export async function GET(req: NextRequest) {
  try {
    const page = req.nextUrl.searchParams.get('page') ?? undefined;
    const perPage = req.nextUrl.searchParams.get('perPage') ?? undefined;

    const res = await api.get('/public/announcements', {
      params: {
        ...(page ? { page } : {}),
        ...(perPage ? { perPage } : {}),
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
