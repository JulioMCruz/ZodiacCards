import Replicate from 'replicate'

// Types
interface GenerateImageOptions {
  prompt: string
  requestId?: string
  model?: 'flux-pro' | 'flux-dev' | 'flux-schnell'
  size?: '1024x1024' | '1792x1024' | '1024x1792'
}

interface GenerateImageResponse {
  imageUrl: string
  duration: number
}

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

// Logger utility
function log(requestId: string, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${requestId}] ${message} - ${timestamp}`, data ? data : '')
}

export async function generateImage({
  prompt,
  requestId = Math.random().toString(36).substring(7),
  model = 'flux-pro',
  size = '1024x1024'
}: GenerateImageOptions): Promise<GenerateImageResponse> {
  log(requestId, '🟢 Image Generation Started')

  try {
    const startTime = Date.now()
    log(requestId, '🎨 Starting Replicate Flux image generation...')

    // Map size to aspect ratio for Flux
    const aspectRatioMap: Record<string, string> = {
      '1024x1024': '1:1',
      '1792x1024': '16:9',
      '1024x1792': '9:16'
    }
    const aspectRatio = aspectRatioMap[size] || '1:1'

    // Select model version - using specific versions for reliability
    const modelVersions: Record<string, string> = {
      'flux-pro': 'black-forest-labs/flux-1.1-pro',
      'flux-dev': 'black-forest-labs/flux-dev',
      'flux-schnell': 'black-forest-labs/flux-schnell'
    }
    const modelVersion = modelVersions[model] || modelVersions['flux-pro']

    log(requestId, `Using model: ${modelVersion}, aspect ratio: ${aspectRatio}`)

    // Run the model and wait for completion
    const output = await replicate.run(
      modelVersion as `${string}/${string}` | `${string}/${string}:${string}`,
      {
        input: {
          prompt,
          aspect_ratio: aspectRatio,
          output_format: 'png',
          output_quality: 100,
          ...(model === 'flux-pro' && {
            safety_tolerance: 2,
            prompt_upsampling: true
          })
        }
      }
    )

    const duration = Date.now() - startTime

    // Log the full output for debugging
    console.log(`[${requestId}] Full Replicate output:`, JSON.stringify(output, null, 2))
    log(requestId, `Raw output type: ${typeof output}, isArray: ${Array.isArray(output)}`)

    // Handle different output formats from Replicate
    let imageUrl: string | null = null

    // Flux models typically return a FileOutput object or array of FileOutput
    if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0]
      // Check if it's a FileOutput object with url/toString
      if (typeof firstItem === 'object' && firstItem !== null) {
        imageUrl = (firstItem as any).url || (firstItem as any).toString?.() || String(firstItem)
      } else if (typeof firstItem === 'string') {
        imageUrl = firstItem
      }
      log(requestId, `Got array output, extracted: ${imageUrl}`)
    } else if (typeof output === 'string') {
      imageUrl = output
      log(requestId, `Got string output: ${imageUrl}`)
    } else if (output && typeof output === 'object') {
      // Check for FileOutput object or URL property
      const outputObj = output as any
      if (typeof outputObj.toString === 'function' && outputObj.toString() !== '[object Object]') {
        imageUrl = outputObj.toString()
        log(requestId, `Got object with toString(): ${imageUrl}`)
      } else {
        imageUrl = outputObj.url || outputObj.image || outputObj.output || String(output)
        log(requestId, `Got object output, extracted: ${imageUrl}`)
      }
    }

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      console.error(`[${requestId}] Invalid output:`, JSON.stringify(output, null, 2))
      throw new Error(`No valid image URL returned from Replicate. Output type: ${typeof output}`)
    }

    log(requestId, `✅ Replicate request completed in ${duration}ms`)
    log(requestId, `🎉 Success - Image URL: ${imageUrl}`)

    return {
      imageUrl,
      duration
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error'
    const errorCode = error?.code || 'NO_CODE'

    console.error(`[${requestId}] 🔴 Error generating image:`, {
      message: errorMessage,
      code: errorCode,
      stack: error?.stack,
      type: error?.type,
      status: error?.status,
      prompt
    })

    throw error
  } finally {
    log(requestId, '🏁 Image Generation Completed')
  }
} 