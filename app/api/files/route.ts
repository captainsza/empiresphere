/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/api/files/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';
import { getApiKey } from '@/lib/getApiKey';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://103.15.157.253:3003/api';

export async function GET(request: Request) {
        try {
                console.log('GET /api/files - Start');
                const apiKey = getApiKey(request.headers);
                console.log('API Key retrieved');

                // Extract query parameters
                const { searchParams } = new URL(request.url);
                const page = searchParams.get('page') || '1';
                const limit = searchParams.get('limit') || '100';
                const folder = searchParams.get('folder') || 'default';
                console.log('Query params:', { page, limit, folder });

                const response = await axios.get(`${API_BASE_URL}/api/files`, {
                        headers: {
                                'x-api-key': apiKey,
                                'x-folder': folder,
                        },
                        params: {
                                page,
                                limit,
                                folder,
                        },
                });
                console.log('API response status:', response.status);

                return NextResponse.json(response.data, { status: response.status });
        } catch (error: any) {
                console.error('Fetch Files Error:', error.message);
                console.error('Full error:', error);
                return NextResponse.json(
                        { error: error.message || 'Failed to fetch files' },
                        { status: 500 }
                );
        }
}
