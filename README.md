# 🚀 Nebula Strike

[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20PWA-blue.svg)](https://github.com/chinabel/nebula-strike)  
[![Language](https://img.shields.io/badge/JavaScript-ES2022-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)  
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)  
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)

**A 3D sci-fi space shooter with fast-paced action, stunning graphics, and cross-platform progression. Play instantly in your browser or install as a PWA.**

<p align="center">
  <img src="shared-assets/raw/textures/ui/logo.png" alt="Nebula Strike" width="400">
</p>

---

## 🎮 Game Features

### Core Gameplay
- **Fast-Paced 3D Action** — Smooth 60fps using WebGL  
- **Touch & Mouse Controls** — Drag-to-move with realistic ship physics  
- **Procedural Enemies** — Dynamic asteroids and enemy patterns  
- **Stunning Visuals** — Explosions, sparks, glowing particle effects  
- **Immersive Starfield** — Multi-layer parallax for depth perception  

### Progression & Economy
- **Cross-Platform Save** — Sync progress via QR code  
- **Levels & Bosses** — 9 challenging levels with unique bosses  
- **Dual Economy** — Earn coins in-game or purchase premium currency  
- **Achievements & Rewards** — Unlock badges and exclusive ships  

### Platform Highlights

| Feature | Web / PWA |
|---------|-----------|
| **Graphics** | WebGL 2.0 (fallback to 1.0) |
| **Install** | Browser install, PWA ready |
| **Offline Play** | Cached levels 1–3 offline |
| **IAP** | Stripe / Web Payments API |
| **Notifications** | Web Push API |
| **Vibration** | Limited vibration API |
| **Updates** | Instant via Service Worker |

---

## 📱 Play Now

🌐 **[Play Instantly](https://nebulastrike.app)** — No install required  

**Install as App:**  
- **Chrome/Edge:** Click "Install" in address bar  
- **Safari iOS:** Share → Add to Home Screen  
- **Samsung:** Menu → Add to Home Screen  

---

## 💎 Premium Assets
- **UI Pack:** `ui/premium-screen.png`, `ui/upgrade-button.png`, `ui/coin-icon.png`, `ui/premium-badge.png`, `ui/locked-level.png`, `ui/shop-premium.png`  
- **Exclusive Ships & Skins** — Unlockable via in-game achievements or IAP  

---

## 🛠️ Tech Stack

### Web / PWA (JavaScript)
- **Language:** ES2022+ (vanilla JS modules)  
- **Graphics:** WebGL 2.0 (with fallback to 1.0)  
- **Storage:** IndexedDB + localStorage  
- **Sync:** Background Sync API  
- **Install:** Web App Manifest + Service Worker  

### Shared Pipeline
- **Assets:** `shared-assets/raw/`  
- **Textures:** PNG → WebP  
- **Audio:** WAV → MP3  
- **Models:** Blender → JSON  
- **Data:** JSON with platform-specific converters  

---

## 🚀 Getting Started

### Prerequisites
| Tool | Web | Both |
|------|-----|------|
| Node.js 18+ | ✅ | |
| Python 3.9+ | | ✅ |
| FFmpeg | | ✅ (audio) |
| ImageMagick | | ✅ (textures) |
