import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { cookies } from 'next/headers';
import { logErrorResponse } from '../../../_utils/utils';
import { api } from '../../../api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ faultId: string }> }
) {
  const cookie = await cookies();
  const { faultId } = await params;
  try {
    const res = await api.post(
      `/faults/${faultId}/seen`,
      {},
      { headers: { Cookie: cookie.toString() } }
    );
    if ([204, 205, 304].includes(res.status)) {
      return new NextResponse(null, { status: res.status });
    }
    return NextResponse.json(res.data ?? null, { status: res.status });
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
