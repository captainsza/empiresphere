/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/api/files/[id]/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import { getApiKey } from '@/lib/getApiKey';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://103.15.157.253:3003/api';

// Define an interface for the route parameters
interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Ensure headers can be accessed safely
    const headers = new Headers(request.headers);
    const apiKey = getApiKey(headers);
    const { id } = params;

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