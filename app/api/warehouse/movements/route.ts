import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { api } from '../../api';
import { logErrorResponse } from '../../_utils/utils';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookie = await cookies();
  try {
    const sp = req.nextUrl.searchParams;
    const itemId = sp.get('itemId') ?? '';
    const warehouseId = sp.get('warehouseId') ?? '';
    const faultId = sp.get('faultId') ?? '';
    const type = sp.get('type') ?? '';
    const dateFrom = sp.get('dateFrom') ?? '';
    const dateTo = sp.get('dateTo') ?? '';
    const page = Number(sp.get('page') ?? 1);
    const perPage = Number(sp.get('perPage') ?? 20);

    const res = await api.get('/warehouse/movements', {
      params: {
        ...(itemId ? { itemId } : {}),
        ...(warehouseId ? { warehouseId } : {}),
        ...(faultId ? { faultId } : {}),
        ...(type ? { type } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
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
