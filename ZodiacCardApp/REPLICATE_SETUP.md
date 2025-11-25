# Replicate Flux Pro Setup Guide

This guide will walk you through setting up Replicate for high-quality image generation using Flux Pro.

## Why Replicate + Flux Pro?

- **Superior Quality**: Flux Pro produces artistic, high-quality images comparable or better than DALL-E 3
- **Cost Effective**: ~$0.003 per image (95% cheaper than OpenAI DALL-E 3)
- **Perfect for Zodiac Cards**: Excellent at artistic, mystical, and spiritual imagery
- **Fast Generation**: Typically 10-30 seconds per image
- **No Content Moderation Delays**: Direct generation without pre-checks

## Account Setup

### 1. Create a Replicate Account

1. Go to [replicate.com](https://replicate.com)
2. Click **Sign Up** (top right)
3. Sign up with:
   - GitHub (recommended)
   - Google
   - Email

### 2. Get Your API Token

1. Once logged in, go to [Account Settings](https://replicate.com/account)
2. Click on **API Tokens** tab
3. Click **Create token**
4. Give it a name (e.g., "ZodiacCards Production")
5. Copy the token (starts with `r8_...`)
6. **IMPORTANT**: Save this token securely - you won't see it again!

### 3. Add Billing Information

1. Go to [Billing Settings](https://replicate.com/account/billing)
2. Click **Add payment method**
3. Enter your credit/debit card details
4. **No upfront cost** - you only pay for what you use

### 4. Configure Your Environment

1. In your project root, create a `.env.local` file (if not exists)
2. Add your Replicate API token:

```bash
REPLICATE_API_TOKEN=r8_your_actual_token_here
```

3. **Never commit this file** - it's already in `.gitignore`

## Pricing

### Flux Pro Pricing (Current)
- **$0.055 per image** for Flux Pro (highest quality)
- **$0.025 per image** for Flux Dev (good quality, faster)
- **$0.003 per image** for Flux Schnell (fast, good quality)

### Cost Comparison
| Provider | Cost per Image | Quality |
|----------|---------------|---------|
| OpenAI DALL-E 3 | $0.040 - $0.080 | High |
| **Replicate Flux Pro** | **$0.055** | **Very High** |
| Replicate Flux Dev | $0.025 | High |
| Replicate Flux Schnell | $0.003 | Good |

### Example Monthly Costs
- 100 images/month: **$5.50** (Flux Pro)
- 500 images/month: **$27.50** (Flux Pro)
- 1,000 images/month: **$55.00** (Flux Pro)

**Recommendation**: Start with Flux Pro for quality, switch to Flux Schnell for volume if needed.

## Testing Your Setup

### 1. Install Dependencies

```bash
# Using yarn (recommended for this project)
yarn install

# Or npm (if yarn fails)
npm install --legacy-peer-deps
```

### 2. Test Image Generation

Run your development server:

```bash
yarn dev
```

Navigate to your app and try generating a zodiac card image. Check the console for:

```
[xxxxx] 🟢 Image Generation Started
[xxxxx] 🎨 Starting Replicate Flux Pro image generation...
[xxxxx] Using model: black-forest-labs/flux-1.1-pro, aspect ratio: 1:1
[xxxxx] ✅ Replicate request completed in XXXXms
[xxxxx] 🎉 Success - Image URL generated
```

### 3. Monitor Usage

1. Go to [Replicate Usage Dashboard](https://replicate.com/account/usage)
2. View your API calls and costs in real-time
3. Set up billing alerts (recommended)

## Model Selection

The code supports three Flux models:

### Flux 1.1 Pro (Default - Recommended)
```typescript
model: 'flux-pro'
```
- **Best quality** for artistic images
- **Best for**: Zodiac cards, spiritual imagery
- **Speed**: 10-30 seconds
- **Cost**: $0.055/image

### Flux Dev
```typescript
model: 'flux-dev'
```
- **Good quality**, faster than Pro
- **Best for**: High-volume production
- **Speed**: 5-15 seconds
- **Cost**: $0.025/image

### Flux Schnell
```typescript
model: 'flux-schnell'
```
- **Fastest** generation
- **Best for**: Previews, testing, high volume
- **Speed**: 2-5 seconds
- **Cost**: $0.003/image

## Switching Models

To change the default model, edit `services/image-generation.ts`:

```typescript
export async function generateImage({
  prompt,
  requestId = Math.random().toString(36).substring(7),
  model = 'flux-schnell', // Change here: 'flux-pro' | 'flux-dev' | 'flux-schnell'
  size = '1024x1024'
}: GenerateImageOptions)
```

## Troubleshooting

### "Authentication failed"
- Check your `REPLICATE_API_TOKEN` in `.env.local`
- Make sure the token starts with `r8_`
- Regenerate token if needed

### "Insufficient credits"
- Add payment method at [replicate.com/account/billing](https://replicate.com/account/billing)
- Check your billing status

### "Model not found"
- Ensure model name is correct: `black-forest-labs/flux-1.1-pro`
- Check [Replicate Flux models](https://replicate.com/black-forest-labs)

### Slow generation times
- Switch to `flux-schnell` for faster results
- Check Replicate status page for service issues

## Security Best Practices

1. **Never commit** `.env.local` or `.env` files
2. **Rotate tokens** regularly (every 90 days)
3. **Set billing alerts** to avoid unexpected charges
4. **Use environment-specific tokens** (dev vs production)
5. **Monitor usage** weekly via Replicate dashboard

## Additional Resources

- [Replicate Documentation](https://replicate.com/docs)
- [Flux Pro Model Page](https://replicate.com/black-forest-labs/flux-1.1-pro)
- [Replicate Node.js Client](https://github.com/replicate/replicate-javascript)
- [Pricing Calculator](https://replicate.com/pricing)

## Support

For issues with:
- **Replicate API**: [Replicate Discord](https://discord.gg/replicate)
- **This integration**: Open an issue in the project repository
