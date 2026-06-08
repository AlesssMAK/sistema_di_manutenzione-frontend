import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { logErrorResponse } from '@/app/api/_utils/utils';
import { api } from '@/app/api/api';

interface Props {
  params: Promise<{ plantId: string }>;
}

export async function GET(req: NextRequest, { params }: Props) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? '';
    const rawStatus = req.nextUrl.searchParams.get('status') ?? '';
    const status = rawStatus === 'all' ? '' : rawStatus;
    const page = Number(req.nextUrl.searchParams.get('page') ?? 1);
    const perPage = Number(req.nextUrl.searchParams.get('perPage') ?? 5);

    const { plantId } = await params;
    const res = await api.get(`/plants/${plantId}/parts`, {
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
