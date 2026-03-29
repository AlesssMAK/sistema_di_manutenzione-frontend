import { NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { api } from '../../api';
import { logErrorResponse } from '../../_utils/utils';

export async function POST() {
  try {
    const res = await api.post('/plants/parts');
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
