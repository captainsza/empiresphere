//api/auth/[...nextauth]/auth.ts
import NextAuth, { NextAuthOptions, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Extend Session type
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      username: string
    } & DefaultSession["user"]
  }
}

export type AuthUser = {
  id: string
  username: string
  apiKeys?: {
    id: string
    key: string
  }[]
  files?: {
    id: string
    name: string
    path: string
  }[]
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            throw new Error('Missing credentials')
          }

          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
            select: {
              id: true,
              username: true,
              password: true,
              apiKeys: {
                select: {
                  id: true,
                  key: true
                }
              },
              files: {
                select: {
                  id: true,
                  name: true,
                  path: true
                }
              }
            }
          })

          if (!user) {
            throw new Error('User not found')
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!passwordMatch) {
            throw new Error('Invalid password')
          }

          return {
            id: user.id,
            username: user.username,
            apiKeys: user.apiKeys,
            files: user.files
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as AuthUser).id
        token.username = (user as AuthUser).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
    signOut: '/auth/signout'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }