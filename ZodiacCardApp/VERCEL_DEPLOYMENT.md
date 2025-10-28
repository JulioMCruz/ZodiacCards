# Vercel Deployment Guide - ZodiacCard App

## Prerequisites

1. Vercel account connected to your GitHub repository
2. All required API keys ready (OpenRouter, Pinata, AWS, WalletConnect)

---

## Step 1: Configure Environment Variables

In your Vercel project dashboard:

**Settings → Environment Variables**

Add the following variables for **Production**, **Preview**, and **Development**:

### Required Variables

```bash
# AI/LLM API
OPENROUTER_API_KEY=your-openrouter-key

# IPFS Storage
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key

# AWS S3 (Optional - for image storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_BUCKET_DIRECTORY=zodiac-images

# Wallet Connect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_IMAGE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SPLASH_IMAGE_URL=https://your-domain.vercel.app/splash.png

# Celo Network Configuration
NEXT_PUBLIC_CHAIN_ID=42220
NEXT_PUBLIC_RPC_URL_CELO=https://forno.celo.org
NEXT_PUBLIC_CELO_MINT_PRICE=1.0

# Contract Addresses (Celo Mainnet)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x415Df58904f56A159748476610B8830db2548158
NEXT_PUBLIC_PROXY_CONTRACT_ADDRESS=0x415Df58904f56A159748476610B8830db2548158
NEXT_PUBLIC_IMPLEMENTATION_CONTRACT_ADDRESS=0xd1846BE5C31604496C63be66CE33Af67d68ecf84

# API Routes (Use defaults)
NEXT_PUBLIC_IMAGE_GENERATION_URL=/api/generate-image
NEXT_PUBLIC_S3_UPLOAD_URL=/api/upload-to-s3
NEXT_PUBLIC_IPFS_UPLOAD_URL=/api/upload-to-ipfs
NEXT_PUBLIC_METADATA_UPLOAD_URL=/api/upload-metadata
```

---

## Step 2: Configure Build Settings

**Settings → General → Build & Development Settings**

```bash
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install --legacy-peer-deps
Root Directory: ZodiacCardApp
Node.js Version: 20.x
```

---

## Step 3: Fix Common Build Issues

### Issue 1: Dependency Conflicts

**Solution**: Use `--legacy-peer-deps` flag

Update `package.json` if needed:
```json
{
  "scripts": {
    "build": "next build",
    "vercel-build": "npm install --legacy-peer-deps && next build"
  }
}
```

### Issue 2: Missing Environment Variables

**Error**: Build succeeds but runtime errors occur

**Solution**: Verify all `NEXT_PUBLIC_*` variables are set in Vercel dashboard

### Issue 3: Module Not Found

**Error**: `Cannot find module '@/...'`

**Solution**: Check `tsconfig.json` paths configuration:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue 4: Image Optimization

**Error**: Image optimization errors

**Solution**: Configure `next.config.js`:
```javascript
module.exports = {
  images: {
    domains: ['gateway.pinata.cloud', 'your-s3-bucket.s3.amazonaws.com'],
    unoptimized: false
  }
}
```

---

## Step 4: Deploy

### Automatic Deployment (Recommended)

1. Push to `main` branch
2. Vercel auto-deploys
3. Check deployment logs for errors

### Manual Deployment

```bash
cd ZodiacCardApp
npm install -g vercel
vercel --prod
```

---

## Step 5: Verify Deployment

### Health Checks

1. **Homepage**: `https://your-domain.vercel.app`
2. **API Routes**:
   - `/api/generate-fortune` - POST with zodiac data
   - `/api/generate-image` - POST with fortune data
   - `/api/upload-to-ipfs` - POST with image URL
   - `/api/upload-metadata` - POST with metadata

3. **Frame Manifest**: `https://your-domain.vercel.app/.well-known/farcaster.json`

4. **Minting Flow**:
   - Connect wallet
   - Select zodiac sign
   - Generate fortune
   - Mint NFT (costs 10.0 CELO)

---

## Step 6: Post-Deployment Configuration

### Update Farcaster Frame Manifest

Edit `.well-known/farcaster.json`:
```json
{
  "accountAssociation": {
    "header": "...",
    "payload": "...",
    "signature": "..."
  },
  "frame": {
    "version": "1",
    "name": "Zodiac Card",
    "iconUrl": "https://your-domain.vercel.app/icon.png",
    "homeUrl": "https://your-domain.vercel.app",
    "imageUrl": "https://your-domain.vercel.app/splash.png",
    "buttonTitle": "Open",
    "splashImageUrl": "https://your-domain.vercel.app/splash.png",
    "splashBackgroundColor": "#000000",
    "webhookUrl": "https://your-domain.vercel.app/api/webhook"
  }
}
```

### Update WalletConnect Allowed Origins

In WalletConnect dashboard, add:
- `https://your-domain.vercel.app`
- `https://*.vercel.app` (for preview deployments)

---

## Troubleshooting

### Build Logs Show Warnings

**19 vulnerabilities (10 low, 5 moderate, 2 high, 2 critical)**

These are mostly from deprecated Pinata SDK dependencies:
- `@pinata/sdk@2.1.0` is deprecated
- `multiaddr`, `multicodec`, `multibase` dependencies

**Impact**: Low - app functions correctly
**Fix**: Consider migrating to `pinata-web3` SDK in future update

### Runtime Errors After Build

1. **Check Environment Variables**:
   ```bash
   vercel env pull .env.local
   ```

2. **Check Build Logs**:
   - Vercel Dashboard → Deployments → Click deployment → View Logs

3. **Check Runtime Logs**:
   - Vercel Dashboard → Deployments → Click deployment → Runtime Logs

### CORS Errors

Add allowed origins in API routes:
```typescript
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  const allowedOrigins = [
    'https://your-domain.vercel.app',
    'https://warpcast.com'
  ]
  
  // ... your API logic
}
```

---

## Performance Optimization

### Enable Edge Runtime (Optional)

For faster API responses:
```typescript
// app/api/generate-fortune/route.ts
export const runtime = 'edge'
```

### Configure Caching

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/.well-known/farcaster.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600'
          }
        ]
      }
    ]
  }
}
```

---

## Security Checklist

Before going live:

- [ ] All API keys added to Vercel environment variables
- [ ] No `.env` files committed to git
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] CORS properly configured
- [ ] WalletConnect origins whitelisted
- [ ] Rate limiting enabled (if needed)
- [ ] Contract addresses verified on Celoscan

---

## Monitoring

### Vercel Analytics (Recommended)

Enable in Vercel dashboard:
- **Analytics**: Track page views and performance
- **Speed Insights**: Monitor Core Web Vitals
- **Logs**: Real-time runtime logs

### Custom Monitoring

Add error tracking:
```typescript
// lib/logger.ts
export function logError(error: Error, context: string) {
  console.error(`[${context}]`, error)
  // Add Sentry, LogRocket, or other service here
}
```

---

## Continuous Deployment

### Branch-Based Deployments

- `main` branch → Production
- `develop` branch → Preview (configure in Vercel)
- Pull requests → Automatic preview deployments

### Environment-Specific Variables

Set different values per environment in Vercel dashboard:
- Production: Real API keys, mainnet contracts
- Preview: Test API keys, testnet contracts
- Development: Local development settings

---

## Quick Deploy Checklist

- [ ] Environment variables configured in Vercel
- [ ] Build command set to `npm run build` or custom `vercel-build`
- [ ] Install command set to `npm install --legacy-peer-deps`
- [ ] Root directory set to `ZodiacCardApp`
- [ ] Node.js version 20.x selected
- [ ] Domain configured (optional)
- [ ] Farcaster manifest updated with production URL
- [ ] WalletConnect allowed origins updated
- [ ] Test mint flow after deployment

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Farcaster Frames**: https://docs.farcaster.xyz/developers/frames
- **Celo Docs**: https://docs.celo.org

---

**Last Updated**: 2024
**Deployment Target**: Vercel
**Framework**: Next.js 15
**Network**: Celo Mainnet
