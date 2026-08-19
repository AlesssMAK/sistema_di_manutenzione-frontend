import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { api } from '../../api';
import { logErrorResponse } from '../../_utils/utils';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookie = await cookies();
  try {
    const sp = req.nextUrl.searchParams;
    const warehouseId = sp.get('warehouseId') ?? '';
    const itemId = sp.get('itemId') ?? '';
    const search = sp.get('search') ?? '';
    const lowOnly = sp.get('lowOnly') === 'true';
    const page = Number(sp.get('page') ?? 1);
    const perPage = Number(sp.get('perPage') ?? 20);

    const res = await api.get('/warehouse/stock', {
      params: {
        ...(warehouseId ? { warehouseId } : {}),
        ...(itemId ? { itemId } : {}),
        ...(search ? { search } : {}),
        ...(lowOnly ? { lowOnly: true } : {}),
        page,
        perPage,
      },
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
