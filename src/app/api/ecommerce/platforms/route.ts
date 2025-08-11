import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PREDEFINED_PLATFORMS } from '@/types/ecommerce'

export async function GET() {
  try {
    // Get all platforms from database
    const platforms = await db.ecommercePlatform.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    // If no platforms exist, seed the predefined ones
    if (platforms.length === 0) {
      for (const platform of PREDEFINED_PLATFORMS) {
        await db.ecommercePlatform.create({
          data: {
            ...platform,
            configTemplate: JSON.stringify(platform.configTemplate)
          }
        })
      }
      
      // Fetch the newly created platforms
      const newPlatforms = await db.ecommercePlatform.findMany({
        orderBy: {
          name: 'asc'
        }
      })
      
      // Parse configTemplate for each platform
      const parsedPlatforms = newPlatforms.map(platform => {
        try {
          return {
            ...platform,
            configTemplate: JSON.parse(platform.configTemplate)
          }
        } catch (parseError) {
          console.error(`Error parsing configTemplate for platform ${platform.name}:`, parseError)
          return {
            ...platform,
            configTemplate: [] // Fallback to empty array
          }
        }
      })
      
      return NextResponse.json(parsedPlatforms)
    }

    // Parse configTemplate for each platform
    const parsedPlatforms = platforms.map(platform => {
      try {
        return {
          ...platform,
          configTemplate: JSON.parse(platform.configTemplate)
        }
      } catch (parseError) {
        console.error(`Error parsing configTemplate for platform ${platform.name}:`, parseError)
        return {
          ...platform,
          configTemplate: [] // Fallback to empty array
        }
      }
    })

    return NextResponse.json(parsedPlatforms)
  } catch (error) {
    console.error('Error fetching e-commerce platforms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch e-commerce platforms' },
      { status: 500 }
    )
  }
}