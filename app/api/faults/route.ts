import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { logErrorResponse } from '../_utils/utils';
import { api } from '../api';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookie = await cookies();
  const { searchParams } = new URL(req.url);
  console.log('Next.js Proxy Params:', searchParams.toString());
  try {
    const res = await api.get('/faults', {
      params: searchParams,
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

export async function POST(req: NextRequest) {
  const cookie = await cookies();

  const formData = await req.formData();

  try {
    const res = await api.post('/faults', formData, {
      headers: {
        Cookie: cookie.toString(),
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
