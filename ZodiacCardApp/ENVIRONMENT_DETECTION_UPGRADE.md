# Environment Detection & Wallet Connection Upgrade Plan

## Summary
Upgrade ZodiacCardApp from `@farcaster/frame-sdk` to `@farcaster/miniapp-sdk` with enhanced environment detection and auto-connect functionality, based on working exampleApp implementation.

## Current Issues

### 1. Outdated SDK Package
- **Current**: `@farcaster/frame-sdk`
- **Should be**: `@farcaster/miniapp-sdk`
- **Impact**: Missing modern features, better Farcaster integration

### 2. No Environment Detection
- Cannot distinguish between web browser and Farcaster app
- No fallback handling for different environments
- Always attempts SDK initialization even outside Farcaster

### 3. No Auto-Authentication
- Users must manually connect wallet in Farcaster
- Farcaster users already have embedded wallet
- Poor UX - should auto-connect in Farcaster environment

### 4. SDK Initialization Lacks Robustness
- No timeout handling
- No step-by-step progress tracking
- No fallback for initialization failures
- Can block app indefinitely

### 5. Wrong Wagmi Connector
- Uses `farcasterFrame` (deprecated)
- Should use `farcasterMiniApp()` connector
- Missing Base Account connector option

## Proposed Solution

### Phase 1: Package Upgrade

**Install new SDK:**
\`\`\`bash
cd ZodiacCardApp
npm install @farcaster/miniapp-sdk @farcaster/miniapp-wagmi-connector
npm uninstall @farcaster/frame-sdk @farcaster/frame-wagmi-connector
\`\`\`

### Phase 2: Enhanced SDK Initializer

**Key Features:**
1. **Environment Detection**:
   - Check `sdk.isInMiniApp` (official SDK method)
   - Validate SDK context (clientFid, miniApp flags)
   - Check user agent for `FarcasterMobile`
   - Combine all checks for accurate detection

2. **Timeout Handling**:
   - 3-second timeout for SDK initialization
   - 2-second timeout per step (context, ready call)
   - Fallback to allow app to continue on timeout
   - Late retry attempts for failed calls

3. **Step-by-Step Progress**:
   - Detailed logging for each initialization step
   - Visual debug indicator in development mode
   - Clear error messages with context

4. **Smart Ready Call**:
   - Only call `sdk.actions.ready()` in Farcaster environment
   - Skip in regular web browser to avoid errors
   - Prevents unnecessary initialization failures

### Phase 3: Farcaster Context Provider

**Create `contexts/FarcasterContext.tsx`:**
- Extract user data from SDK context
- Auto-authenticate on component mount
- Provide user state globally
- Handle fallback for non-Farcaster environments

**User Data Available:**
- fid (Farcaster ID)
- username
- displayName
- pfpUrl (profile picture)
- custodyAddress
- connectedAddress
- bio, followerCount, followingCount

### Phase 4: Wagmi Config Update

**Update `lib/wagmi.ts`:**
1. Replace `farcasterFrame` with `farcasterMiniApp()`
2. Optional: Add `baseAccount()` connector for Base integration
3. Maintain multi-chain support (Celo + Base)
4. Keep WalletConnect for web browser users

### Phase 5: Auto-Connect Logic

**Enhanced `components/connect-menu.tsx`:**
- Detect Farcaster environment on mount
- Auto-connect using Farcaster connector if in app
- Skip manual connection step for Farcaster users
- Still allow manual connect for web users

## Implementation Priority

### High Priority (Must Have):
1. ✅ Package upgrade to `@farcaster/miniapp-sdk`
2. ✅ Enhanced SDK initializer with environment detection
3. ✅ Timeout handling for reliability
4. ✅ Wagmi connector update to `farcasterMiniApp()`

### Medium Priority (Should Have):
5. ⭐ Farcaster context provider for user data
6. ⭐ Auto-connect logic for Farcaster users
7. ⭐ Debug logging in development mode

### Low Priority (Nice to Have):
8. 🔹 Base Account connector integration
9. 🔹 Backend API logging (like exampleApp)
10. 🔹 Visual connection status indicators

## Testing Checklist

### Web Browser Testing:
- [ ] App loads without errors
- [ ] SDK initialization is skipped
- [ ] Manual wallet connect works
- [ ] Network switching functions properly
- [ ] No console errors about missing SDK

### Farcaster Mobile App Testing:
- [ ] SDK initializes successfully
- [ ] Splash screen closes after ready()
- [ ] User is auto-authenticated
- [ ] Wallet auto-connects with Farcaster connector
- [ ] User data is extracted from SDK context
- [ ] Network auto-switches to Celo

### Farcaster Desktop Testing:
- [ ] Similar to mobile app behavior
- [ ] Proper environment detection
- [ ] Auto-connect works

## Code Changes Overview

**Files to Modify:**
1. `package.json` - Update dependencies
2. `components/sdk-initializer.tsx` - Enhanced version with detection
3. `lib/wagmi.ts` - Update connector to farcasterMiniApp
4. `components/connect-menu.tsx` - Add auto-connect logic
5. `contexts/FarcasterContext.tsx` - NEW file for user data

**Files to Create:**
1. `contexts/FarcasterContext.tsx` - Farcaster user context
2. `hooks/useFarcaster.ts` - Optional custom hook

## Migration Strategy

### Option A: Full Upgrade (Recommended)
- Implement all changes at once
- Maximum compatibility and features
- Clean codebase aligned with exampleApp
- **Estimated time**: 2-3 hours

### Option B: Incremental Upgrade
- Phase 1: SDK package only
- Phase 2: Enhanced initializer
- Phase 3: Wagmi connector
- Phase 4: Context provider
- Phase 5: Auto-connect
- **Estimated time**: 1 hour per phase

## Expected Benefits

1. **Better UX in Farcaster**: Auto-authentication, no manual wallet connection
2. **Reliability**: Timeout handling prevents app from hanging
3. **Developer Experience**: Clear logging, debug indicators
4. **Future-Proof**: Using modern SDK packages
5. **Flexibility**: Works in both web browser and Farcaster app
6. **User Data**: Access to Farcaster profile information

## Risk Assessment

**Low Risk:**
- SDK package upgrade (well documented)
- Timeout handling (improves reliability)
- Environment detection (graceful fallbacks)

**Medium Risk:**
- Auto-connect logic (test thoroughly)
- Wagmi connector change (may affect existing users)

**Mitigation:**
- Comprehensive testing in all environments
- Fallback to manual connect if auto-connect fails
- Maintain WalletConnect as backup option
