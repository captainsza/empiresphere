/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// /app/api/files/[id]/share/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

// Initialize Prisma Client
const prisma = new PrismaClient();
export async function POST(
        request: Request,
        context: { params: { id: string } }
      ) {
        try {
          // Destructure params inside the function to avoid synchronous access issues
          const { id: fileId } = context.params;
      
          // Get the current user session
          const session = await getServerSession(authOptions);
          if (!session || !session.user?.id) {
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
          }
      
          const userId = session.user.id;
      
          // Parse the request body
          const body = await request.json();
          const { expiresIn } = body; // in hours
      
          // Validate expiresIn
          if (!expiresIn || typeof expiresIn !== 'number') {
            return NextResponse.json(
              { error: 'Invalid expiresIn value' },
              { status: 400 }
            );
          }
      
          // Check if the file exists and belongs to the user
          const file = await prisma.file.findUnique({
            where: { id: fileId },
          });
      
          if (!file) {
            return NextResponse.json(
              { error: 'File not found' },
              { status: 404 }
            );
          }
      
          if (file.userId !== userId) {
            return NextResponse.json(
              { error: 'Forbidden' },
              { status: 403 }
            );
          }
      
          // Generate a unique share token
          const shareToken = uuidv4();
      
          // Calculate expiration date
          const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000); // expiresIn hours from now
      
          // Create a share link in the database
          const shareLink = await prisma.shareLink.create({
            data: {
              token: shareToken,
              fileId: file.id,
              expiresAt,
            },
          });
      
          // Construct the share URL
          const apiBaseUrl =
            process.env.NEXT_PUBLIC_API_BASE_URL || 'http://103.15.157.253:3003'; // Ensure this matches your backend's API base URL
      
          const shareUrl = `${apiBaseUrl}/api/share/${shareToken}`; // Corrected to avoid double /api
      
          return NextResponse.json(
            { shareUrl, expiresAt },
            { status: 201 }
          );
        } catch (error: any) {
          console.error('Error creating share link:', error);
          return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        }
      }