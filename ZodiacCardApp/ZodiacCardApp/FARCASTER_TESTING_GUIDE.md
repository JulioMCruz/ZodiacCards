# Farcaster Testing Guide

This guide explains how to test the ZodiacCards app in both web browser and Farcaster environments.

## ✅ Full Upgrade Complete

The app has been upgraded from `@farcaster/frame-sdk` to `@farcaster/miniapp-sdk` with the following improvements:

### What Changed

1. **SDK Packages** ✅
   - `@farcaster/miniapp-sdk@0.2.1` (was `@farcaster/frame-sdk@0.0.34`)
   - `@farcaster/miniapp-wagmi-connector@1.1.0` (new)

2. **Enhanced SDK Initializer** ✅ ([sdk-initializer.tsx](components/sdk-initializer.tsx))
   - 3-method environment detection (isInMiniApp, context validation, user agent)
   - 3-second global timeout with fallback
   - 2-second per-step timeouts
   - Step-by-step progress tracking
   - Detailed console logging with timestamps
   - Development mode debug indicator
   - Smart `ready()` call only in Farcaster environment

3. **Farcaster Context Provider** ✅ ([FarcasterContext.tsx](contexts/FarcasterContext.tsx))
   - Auto-authentication on mount
   - User data extraction (fid, username, displayName, pfpUrl, addresses)
   - Global user state management
   - Graceful fallback for non-Farcaster environments

4. **Updated Wagmi Configuration** ✅ ([wagmi.ts](lib/wagmi.ts))
   - Using `farcasterMiniApp()` connector (was `farcasterFrame`)
   - Multi-chain support maintained (Celo + Base)

5. **Smart Connect Menu** ✅ ([connect-menu.tsx](components/connect-menu.tsx))
   - Auto-connect in Farcaster environment
   - Detects Farcaster context and connects automatically
   - Manual connect for web users
   - Proper connector selection based on environment

6. **App Layout Integration** ✅ ([layout.tsx](app/layout.tsx))
   - FarcasterProvider wraps the entire application
   - Proper provider nesting order

## Testing in Web Browser

### Expected Behavior

When you open the app in a regular web browser:

1. **Environment Detection**:
   - Console logs: `📍 SDK INITIALIZATION: Not in Farcaster environment, skipping ready() call`
   - SDK initializer step: `skipped-not-farcaster`

2. **User Authentication**:
   - FarcasterContext will not have user data
   - `isAuthenticated` will be `false`

3. **Wallet Connection**:
   - No auto-connect
   - User must manually click "Connect Wallet"
   - Will use WalletConnect or injected wallet (MetaMask, etc.)

### Steps to Test

```bash
cd ZodiacCardApp
npm run dev
```

Open http://localhost:3000 in your browser and:

1. ✅ Check browser console for SDK initialization logs
2. ✅ Verify no Farcaster user data in console
3. ✅ Click "Connect Wallet" button
4. ✅ Connect with WalletConnect or MetaMask
5. ✅ Verify wallet connects successfully
6. ✅ Test minting a Zodiac Card

## Testing in Farcaster

### Expected Behavior

When the app runs in Farcaster mobile app or as a Mini App:

1. **Environment Detection**:
   - Console logs: `✅ SDK INITIALIZATION: Context retrieved successfully`
   - Console logs: `🔍 SDK INITIALIZATION: Environment validation` with `finalResult: true`
   - Console logs: `✅ SDK INITIALIZATION: ready() call completed successfully!`
   - SDK initializer step: `complete`

2. **User Authentication**:
   - FarcasterContext automatically authenticates
   - Console logs: `✅ Farcaster user created:` with user data
   - User object contains: fid, username, displayName, pfpUrl, addresses

3. **Wallet Connection**:
   - Automatic wallet connection
   - Console logs: `🔗 Auto-connecting Farcaster wallet...`
   - Console logs: `✅ Auto-connected successfully`
   - No manual "Connect Wallet" click needed

### Steps to Test

1. **Deploy to a Public URL**:
   ```bash
   npm run build
   # Deploy to Vercel, Netlify, or your hosting service
   ```

2. **Create Farcaster Frame**:
   - Update your Frame metadata with the deployed URL
   - The app already has Frame metadata in `layout.tsx`

3. **Test in Farcaster Mobile App**:
   - Open Farcaster mobile app
   - Navigate to your Frame/Mini App
   - Watch for auto-authentication
   - Watch for auto-wallet connection
   - Test minting a Zodiac Card

## Console Log Reference

### Successful Farcaster Initialization

```
[timestamp] 🚀 SDK INITIALIZATION: Starting process...
[timestamp] 🌍 SDK INITIALIZATION: Environment details
[timestamp] ⏰ SDK INITIALIZATION: Starting after DOM ready delay
[timestamp] 📱 SDK INITIALIZATION: Step 1 - Getting SDK context...
[timestamp] ✅ SDK INITIALIZATION: Context retrieved successfully
[timestamp] 🔍 SDK INITIALIZATION: Environment validation
[timestamp] 📞 SDK INITIALIZATION: Step 3 - Calling sdk.actions.ready()...
[timestamp] ✅ SDK INITIALIZATION: ready() call completed successfully!
[timestamp] 🎉 SDK INITIALIZATION: Complete - SDK ready and splash screen should be hidden
```

### Successful Farcaster Authentication

```
🔐 Attempting to get Farcaster context...
📱 SDK context: {user: {...}, client: {...}}
✅ Farcaster user created: {fid: 123456, username: "...", ...}
```

### Successful Auto-Connect

```
🔗 Auto-connecting Farcaster wallet...
✅ Auto-connected successfully
```

### Web Browser (Non-Farcaster)

```
[timestamp] 📍 SDK INITIALIZATION: Not in Farcaster environment, skipping ready() call
```

## Debugging

### If SDK Initialization Fails

1. Check console for timeout messages
2. Verify you're in Farcaster environment
3. Check network connectivity
4. Review detailed error logs with stack traces

### If Auto-Connect Fails

1. Verify FarcasterContext has authenticated user
2. Check that `farcasterMiniApp` connector is available
3. Review console logs for connection errors
4. Ensure proper provider nesting in layout.tsx

### Development Mode Debug Indicator

When running in development mode (`NODE_ENV=development`), you'll see a debug indicator in the top-left corner showing:
- Current initialization step
- Any errors that occur
- Waiting status

This is automatically hidden in production.

## Benefits of This Upgrade

1. **Robust Environment Detection**: 3 independent checks ensure accurate Farcaster detection
2. **Improved User Experience**: Auto-authentication and auto-connect in Farcaster
3. **Better Error Handling**: Timeout mechanisms prevent hanging initialization
4. **Detailed Logging**: Timestamp-based logs make debugging easier
5. **Modern SDK**: Using latest Farcaster Mini App SDK with better support
6. **Graceful Fallbacks**: App works perfectly in both Farcaster and web environments

## Next Steps

1. ✅ Test in local development browser
2. ✅ Deploy to production environment
3. ✅ Test in Farcaster mobile app
4. ✅ Monitor console logs for any issues
5. ✅ Verify auto-authentication works
6. ✅ Verify auto-wallet connection works
7. ✅ Test complete NFT minting flow
