import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { logErrorResponse } from '../_utils/utils';
import { api } from '../api';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookie = await cookies();

  try {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const rawRole = req.nextUrl.searchParams.get('role') ?? '';
    const role = rawRole === 'all' ? '' : rawRole;
    const rawStatus = req.nextUrl.searchParams.get('status') ?? '';
    const status = rawStatus === 'all' ? '' : rawStatus;
    const page = Number(req.nextUrl.searchParams.get('page') ?? 1);
    const perPage = Number(req.nextUrl.searchParams.get('perPage') ?? 10);

    const res = await api.get('/users', {
      params: {
        ...(search ? { search } : {}),
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        page,
        perPage,
      },
      headers: {
        Cookie: cookie.toString(),
      },
    });
    return NextResponse.json(res.data.users);
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
