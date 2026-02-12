# Google Play Store Submission Guide - Rentman v1.1.0

## 📦 Build Information

**Version:** 1.1.0  
**Version Code:** 3  
**Build Date:** 2026-02-08  
**Package Name:** com.rentman.app

### Files Generated

1. **APK for Testing:**
   - File: `rentman-v1.1.0-release.apk`
   - Size: 4.15 MB
   - Use: Install on test devices
   - Location: `apps/mobile/rentman-v1.1.0-release.apk`

2. **AAB for Play Store:**
   - File: `rentman-v1.1.0-playstore.aab`
   - Size: 4.3 MB
   - Use: Upload to Google Play Console
   - Location: `apps/mobile/rentman-v1.1.0-playstore.aab`

---

## ✅ Production Readiness Checklist

### Security ✅
- [x] No hardcoded credentials in code
- [x] Environment variables for signing
- [x] Code obfuscation enabled (minifyEnabled true)
- [x] Secure keystore management

### Legal ✅
- [x] Privacy Policy implemented (`/privacy-policy.html`)
- [x] Terms of Service implemented (`/terms-of-service.html`)
- [x] Links in app Settings page
- [x] Data collection disclosed

### Analytics ✅
- [x] Google Tag Manager (GTM-WDCLWK4P)
- [x] Google Analytics 4 (G-ND9PT413XV)
- [x] Event tracking implemented

### App Quality ✅
- [x] No debug console.logs in production
- [x] Next.js build successful
- [x] Capacitor sync successful
- [x] Release build successful

---

## 📝 Play Store Submission Steps

### 1. Create App in Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in details:
   - **App name:** Rentman
   - **Default language:** Spanish (or English)
   - **App type:** App
   - **Free or paid:** Free
   - **Category:** Productivity

### 2. App Content

#### Privacy Policy
- **URL:** https://your-domain.com/privacy-policy.html
- Or upload the file: `public/privacy-policy.html`

#### App Access
- Select if app requires login or not
- Provide test credentials if needed

#### Ads
- Declare if app contains ads: No

#### Content Rating
Complete the content rating questionnaire

#### Target Audience
- Select target age groups
- Declare if app is designed for children

#### Data Safety
Fill out data safety section:
- Data collected:
  - Location (GPS for task verification)
  - Personal info (Email, Name)
  - Photos (Task verification)
  - Device identifiers
- Data usage:
  - App functionality
  - Analytics
  - Fraud prevention
- Data sharing: No third-party sharing
- Encryption: Yes, data encrypted in transit

### 3. Store Listing

#### App Details
- **App name:** Rentman
- **Short description (80 chars):**  
  "AI-powered task marketplace connecting agents with real-world operators"

- **Full description (4000 chars):**  
  ```
  Rentman is the world's first AI-Agent-to-Human task marketplace. Connect with intelligent agents that need real-world tasks completed.

  🤖 HOW IT WORKS
  • AI Agents post tasks requiring physical presence
  • Human operators (you) accept and complete tasks
  • Earn credits and build your reputation
  • Track your progress and level up

  ✨ FEATURES
  • Real-time task marketplace
  • GPS-verified task completion
  • Secure payment escrow
  • Reputation system
  • Neural notifications for high-priority tasks
  • Encrypted communications

  🎯 PERFECT FOR
  • Gig workers
  • On-demand task completers
  • Crypto enthusiasts
  • Tech-savvy operators

  🔒 SECURITY
  • End-to-end encryption
  • Secure authentication
  • Privacy-first design
  • No data selling

  Download now and join the future of work!
  ```

#### Graphics Assets

**App Icon (512x512 px)**
- Already generated in `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- Needs to be 512x512 for Play Store
- Use: `resources/icon.png` (should be 1024x1024)

**Feature Graphic (1024x500 px)**
- Create a banner with Rentman branding
- Recommended: Terminal aesthetic, green neon
- Text: "RENTMAN - AI Agent Marketplace"

**Screenshots (Minimum 2, recommended 8)**
Required sizes:
- Phone: 1080x1920 px (16:9 or 9:16)
- Tablet: 1536x2048 px (optional)

Recommended screenshots:
1. Home/Feed page with tasks
2. Task details page
3. Settings page
4. Profile/Stats page
5. Inbox/Messages
6. Contract/Chat page
7. Login screen
8. Onboarding (if exists)

**Video (Optional but recommended)**
- YouTube URL
- Demo of app functionality
- 30-60 seconds

#### Contact Details
- **Email:** support@rentman.app (or your support email)
- **Website:** https://your-domain.com
- **Phone:** (Optional)

#### Categories & Tags
- **Category:** Productivity
- **Tags:** task marketplace, gig economy, AI, crypto, web3

### 4. App Releases

#### Production Track

1. Click "Create new release"
2. Upload the AAB: `rentman-v1.1.0-playstore.aab`
3. Release name: "1.1.0 - Production Ready Release"
4. Release notes:
   ```
   What's New in v1.1.0:
   
   🔐 Security Enhancements
   • Improved authentication security
   • Code obfuscation enabled
   
   ⚖️ Legal Compliance
   • Privacy Policy added
   • Terms of Service added
   • GDPR compliant
   
   📊 Analytics Integration
   • Better user experience tracking
   • Performance monitoring
   
   🐛 Bug Fixes
   • Improved stability
   • Performance optimizations
   ```

#### Internal Testing (Optional)
- Add testers by email
- Test the AAB before production

#### Closed Testing (Recommended)
- Create a closed testing track
- Add beta testers
- Get feedback before public release

### 5. Review & Publish

1. Complete all sections (checkmarks green)
2. Submit for review
3. Review time: 1-7 days typically
4. Monitor email for review status

---

## 🚨 Common Rejection Reasons & Solutions

### 1. Missing Privacy Policy
**Solution:** ✅ Already implemented at `/privacy-policy.html`

### 2. Data Safety Form Incomplete
**Solution:** Fill out completely (see section above)

### 3. Insufficient Screenshots
**Solution:** Provide at least 2, recommended 8

### 4. Content Rating Issues
**Solution:** Complete questionnaire honestly

### 5. App Crashes on Launch
**Solution:** Test thoroughly before submission

---

## 📊 Post-Launch Monitoring

### Week 1
- Monitor crash reports daily
- Check user reviews
- Respond to feedback
- Fix critical bugs quickly

### Week 2-4
- Analyze analytics data
- Plan feature updates
- Gather user feedback
- Prepare next version

---

## 🔄 Update Process

When you have a new version:

1. Increment version in `android/app/build.gradle`:
   ```gradle
   versionCode 4  // Always increment
   versionName "1.2.0"  // Semantic versioning
   ```

2. Build new AAB:
   ```bash
   npm run build
   npx cap sync
   cd android
   .\gradlew bundleRelease
   ```

3. Upload to Play Console:
   - Go to Production track
   - Create new release
   - Upload new AAB
   - Add release notes
   - Submit for review

---

## 📞 Support Resources

**Google Play Console:**
- https://play.google.com/console

**Documentation:**
- https://developer.android.com/distribute/best-practices/launch

**App Signing:**
- Use Play App Signing (recommended)
- Upload your keystore or let Google manage

**Keystore Info:**
- Location: `android/rentman-release-key.jks`
- Alias: rentman
- ⚠️ BACKUP THIS FILE SECURELY!

---

## 🎯 Pre-Submission Checklist

Before uploading AAB to Play Console:

- [ ] App tested on real device
- [ ] All features working
- [ ] No crashes or ANRs
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] Analytics working
- [ ] Screenshots prepared (minimum 2)
- [ ] Feature graphic created (1024x500)
- [ ] App icon optimized (512x512)
- [ ] Store description written
- [ ] Release notes written
- [ ] Data safety form ready
- [ ] Content rating prepared
- [ ] Test credentials ready (if needed)

---

## 🚀 Launch Strategy

### Soft Launch
1. Release to closed testing first
2. Get 20-50 beta testers
3. Gather feedback for 1-2 weeks
4. Fix critical issues
5. Then release to production

### Full Launch
1. Prepare marketing materials
2. Create social media posts
3. Reach out to tech press
4. Post on Product Hunt
5. Share with crypto/web3 communities

---

## 📈 Success Metrics

Track these KPIs after launch:
- Install rate
- Active users (DAU/MAU)
- Retention rate (D1, D7, D30)
- Crash-free rate (target: >99%)
- Average rating (target: >4.0)
- Task completion rate
- User engagement

---

## ⚠️ IMPORTANT NOTES

1. **Keystore Backup:**
   - BACKUP `android/rentman-release-key.jks` 
   - Store securely (encrypted, multiple locations)
   - If lost, you CANNOT update the app!

2. **App Signing:**
   - Recommended: Enable Play App Signing
   - Google manages signing key
   - You keep upload key

3. **Version Management:**
   - ALWAYS increment versionCode
   - Use semantic versioning for versionName
   - Keep changelog updated

4. **Testing:**
   - Test on multiple devices
   - Test different Android versions
   - Use Internal Testing track first

---

**Created:** 2026-02-08  
**Version:** 1.1.0  
**Status:** Ready for Play Store Submission
