# 🚀 NEBULA STRIKE

[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Web-blue.svg)](https://github.com/yourusername/nebula-strike)
[![Language](https://img.shields.io/badge/Kotlin%20%7C%20JavaScript-orange.svg)](https://kotlinlang.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![API](https://img.shields.io/badge/API-24%2B-34A853?logo=android)](https://developer.android.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)

**A fast-paced 3D sci-fi space shooter with stunning graphics, available on Android and Web.**

Play instantly in your browser or install the native Android app for the best experience. Both versions share the same assets, gameplay, and progression system.

&lt;p align="center"&gt;
  &lt;img src="shared-assets/raw/textures/ui/logo.png" alt="Nebula Strike" width="400"&gt;
&lt;/p&gt;

---

## 🎮 Features

### Core Gameplay (Both Platforms)
- **Intense 3D Action** — Smooth 60fps with OpenGL ES (Android) or WebGL (PWA)
- **Touch & Mouse Controls** — Intuitive drag-to-move with ship banking physics
- **Procedural Enemies** — Dynamic asteroids with unique shapes and behaviors
- **Particle Effects** — Explosive visual feedback with glowing fire and electric sparks
- **Parallax Starfield** — Immersive 3D background with depth scrolling

### Cross-Platform Progression
- **Unified Save System** — Progress syncs between Android and Web via QR code
- **12 Languages** — Full localization: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi
- **9 Challenging Levels** — Increasing difficulty with boss battle at level 9
- **Dual Economy** — Earn coins in-game or purchase with real money

### Platform-Specific Features

| Feature | Android (Kotlin) | PWA (WebGL) |
|---------|-----------------|-------------|
| **Performance** | Native OpenGL ES 2.0 | WebGL 2.0 with fallback |
| **Install** | Google Play / APK | Browser install, no store |
| **Offline Play** | Full offline career | Cached levels 1-3 offline |
| **File Size** | ~15MB optimized | ~8MB initial, stream rest |
| **IAP** | Google Play Billing | Stripe / Web Payments API |
| **Notifications** | Push + Local | Web Push API |
| **Haptics** | Vibration feedback | Vibration API (limited) |
| **Updates** | Play Store | Instant (service worker) |

---

## 📱 Play Now

### Android
&lt;a href="https://play.google.com/store/apps/details?id=com.nebulastrike.spacefighter"&gt;
  &lt;img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" height="80"&gt;
&lt;/a&gt;

**Or sideload:** [Download APK](https://github.com/yourusername/nebula-strike/releases)

### Web / PWA
🌐 **[Play Instantly](https://nebulastrike.app)** — No install required

**Install as App:**
- **Chrome/Edge:** Click "Install" in address bar
- **Safari iOS:** Share → Add to Home Screen
- **Samsung:** Menu → Add to Home screen

---

## 🛠️ Tech Stack

### Android (Kotlin)
- **Language:** Kotlin 1.9+
- **Graphics:** OpenGL ES 2.0 with custom shaders
- **Architecture:** MVVM + Component-based game engine
- **Billing:** Google Play Billing Library 6.1+
- **Persistence:** Room Database + SharedPreferences
- **Async:** Kotlin Coroutines & Flow

### PWA (JavaScript)
- **Language:** ES2022+ (modules)
- **Graphics:** WebGL 2.0 (with WebGL 1 fallback)
- **Build:** Vanilla JS (no framework dependency)
- **Storage:** IndexedDB + localStorage
- **Sync:** Background Sync API
- **Install:** Web App Manifest + Service Worker

### Shared Pipeline
- **Assets:** Single source in `shared-assets/raw/`
- **Textures:** PNG → ETC2 (Android) / WebP (Web)
- **Audio:** WAV → OGG (Android) / MP3 (Web)
- **Models:** Blender → Binary (Android) / JSON (Web)
- **Data:** JSON with platform-specific converters

---

## 🚀 Getting Started

### Prerequisites

| Tool | Android | PWA | Both |
|------|---------|-----|------|
| Android Studio Hedgehog+ | ✅ | | |
| Android SDK 24+ | ✅ | | |
| Node.js 18+ | | ✅ | |
| Python 3.9+ | | | ✅ |
| FFmpeg | | | ✅ (audio) |
| ImageMagick | | | ✅ (textures) |

