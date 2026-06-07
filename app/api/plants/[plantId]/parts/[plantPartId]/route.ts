import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { cookies } from 'next/headers';
import { api } from '@/app/api/api';
import { logErrorResponse } from '@/app/api/_utils/utils';

interface Props {
  params: Promise<{ plantId: string; plantPartId: string }>;
}

export async function PUT(req: NextRequest, { params }: Props) {
  const cookie = await cookies();

  const body = await req.json();
  try {
    const { plantId, plantPartId } = await params;
    const res = await api.put(`plants/${plantId}/parts/${plantPartId}`, body, {
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

export async function DELETE(req: NextRequest, { params }: Props) {
  const cookie = await cookies();

  try {
    const { plantId, plantPartId } = await params;
    const res = await api.delete(`plants/${plantId}/parts/${plantPartId}`, {
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
