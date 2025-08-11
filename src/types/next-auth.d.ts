import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      franchiseId?: string
      franchiseRole?: string
      franchiseName?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    franchiseId?: string
    franchiseRole?: string
    franchiseName?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    franchiseId?: string
    franchiseRole?: string
    franchiseName?: string
  }
}