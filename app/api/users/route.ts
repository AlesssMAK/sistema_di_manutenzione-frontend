import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { logErrorResponse } from '../_utils/utils';
import { api } from '../api';

export async function GET(req: NextRequest) {
  try {
    const res = await api.get('/users');
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
