/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

// Handle GET requests to fetch API keys
export async function GET(request: Request) {
  try {
    // Get the server-side session
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch API keys associated with the user
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        key: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Extract the key strings
    const keyList = apiKeys.map(apiKey => ({
      key: apiKey.key,
      createdAt: apiKey.createdAt
    }))

    return NextResponse.json(
      { apiKeys: keyList },
      { status: 200 }
    )

  } catch (error) {
    console.error('API Key Fetching Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// Handle POST requests to generate a new API key
export async function POST(request: Request) {
  try {
    // Get the server-side session
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate a unique API key
    const apiKey = `emp_${uuidv4()}`

    // Save the API key to the database
    await prisma.apiKey.create({
      data: {
        key: apiKey,
        userId: session.user.id
      }
    })

    return NextResponse.json(
      { apiKey, message: 'API Key generated successfully!' },
      { status: 201 }
    )

  } catch (error) {
    console.error('API Key Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    )
  }
}
