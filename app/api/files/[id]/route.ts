/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/api/files/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getApiKey } from '@/lib/getApiKey';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://103.15.157.253:3003/api';

export async function DELETE(
  request: NextRequest, 
  context: { params: { id: string } }
) {
  const { id } = context.params; // Destructure here instead of in the signature

  try {
    const apiKey = getApiKey(request.headers);

    const response = await axios.delete(`${API_BASE_URL}/api/files/${id}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error('Delete File Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: error.response?.status || 500 }
    );
  }
}
