import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { logErrorResponse } from '../../_utils/utils';
import { cookies } from 'next/headers';
import { api } from '../../api';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ faultId: string }> }
) {
  const cookie = await cookies();
  const resolvedParams = await params;
  const idForRequest = resolvedParams.faultId;

  try {
    const res = await api.get(`/faults/${idForRequest}`, {
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

export async function PATCH(req: NextRequest) {
  const cookie = await cookies();
  const body = await req.json();

  try {
    const res = await api.patch('/maintenance-worker/fault', body, {
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
