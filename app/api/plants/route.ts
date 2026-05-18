import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { api } from '../api';
import { logErrorResponse } from '../_utils/utils';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const rawStatus = req.nextUrl.searchParams.get('status') ?? '';
    const status = rawStatus === 'all' ? '' : rawStatus;
    const page = Number(req.nextUrl.searchParams.get('page') ?? 1);
    const perPage = Number(req.nextUrl.searchParams.get('perPage') ?? 10);

    const res = await api.get('/plants', {
      params: {
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        page,
        perPage,
      },
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cookie = await cookies();

    const res = await api.post('/plants', body, {
      headers: {
        Cookie: cookie.toString(),
      },
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
