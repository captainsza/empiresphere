/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/api/files/[id]/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';
import { getApiKey } from '@/lib/getApiKey';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://103.15.157.253:3003/api';

// Fix: Update parameter types to match Next.js route handler signature
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const apiKey = getApiKey(request.headers);
    const { id } = context.params;

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
      { status: 500 }
    );
  }
}