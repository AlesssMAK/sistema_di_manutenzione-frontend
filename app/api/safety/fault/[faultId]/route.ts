import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { cookies } from 'next/headers';
import { logErrorResponse } from '../../../_utils/utils';
import { api } from '../../../api';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ faultId: string }> }
) {
  const cookie = await cookies();
  const { faultId } = await params;
  const body = await req.json();

  try {
    const res = await api.patch(`/safety/fault/${faultId}`, body, {
      headers: { Cookie: cookie.toString() },
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
