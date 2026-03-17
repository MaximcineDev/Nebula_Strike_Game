#!/usr/bin/env node
/**
 * Nebula Strike Texture Atlas Packer
 * Packs multiple sprites into optimized atlases for Android and Web
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');

// Configuration
const CONFIG = {
  maxAtlasSize: 2048,
  padding: 2,
  formats: {
    android: 'etc2',
    web: 'webp'
  },
  quality: {
    webp: 85,
    png: 9
  }
};

class TexturePacker {
  constructor(inputDir, outputDir) {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.sprites = [];
    this.atlases = [];
  }

  async pack() {
    console.log('🎨 Texture Packer Starting...');
    
    // Scan input directory
    await this.scanSprites();
    
    if (this.sprites.length === 0) {
      console.log('⚠️  No sprites found');
      return;
    }
    
    console.log(`📦 Found ${this.sprites.length} sprites`);
    
    // Sort by size (largest first) for better packing
    this.sprites.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
    // Pack into atlases
    this.packAtlases();
    
    // Generate output files
    await this.generateAtlases();
    
    console.log('✅ Texture packing complete!');
  }

  async scanSprites() {
    const files = fs.readdirSync(this.inputDir);
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;
      
      const filePath = path.join(this.inputDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) continue;
      
      try {
        const image = await loadImage(filePath);
        this.sprites.push({
          name: path.basename(file, ext),
          path: filePath,
          width: image.width,
          height: image.height,
          image: image
        });
      } catch (err) {
        console.error(`❌ Failed to load: ${file}`);
      }
    }
  }

  packAtlases() {
    let currentAtlas = {
      width: 0,
      height: 0,
      sprites: [],
      canvas: null,
      context: null
    };
    
    const maxSize = CONFIG.maxAtlasSize;
    
    for (const sprite of this.sprites) {
      const paddedWidth = sprite.width + CONFIG.padding * 2;
      const paddedHeight = sprite.height + CONFIG.padding * 2;
      
      // Check if sprite fits in current atlas
      const fit = this.findPosition(currentAtlas, paddedWidth, paddedHeight, maxSize);
      
      if (!fit) {
        // Save current atlas and start new one
        if (currentAtlas.sprites.length > 0) {
          this.atlases.push(currentAtlas);
        }
        
        currentAtlas = {
          width: 0,
          height: 0,
          sprites: [],
          canvas: null,
          context: null
        };
        
        // Try again with new atlas
        const newFit = this.findPosition(currentAtlas, paddedWidth, paddedHeight, maxSize);
        if (!newFit) {
          console.error(`❌ Sprite too large: ${sprite.name} (${sprite.width}x${sprite.height})`);
          continue;
        }
        
        sprite.x = newFit.x + CONFIG.padding;
        sprite.y = newFit.y + CONFIG.padding;
        currentAtlas.sprites.push(sprite);
        this.updateAtlasSize(currentAtlas, newFit.x, newFit.y, paddedWidth, paddedHeight);
      } else {
        sprite.x = fit.x + CONFIG.padding;
        sprite.y = fit.y + CONFIG.padding;
        currentAtlas.sprites.push(sprite);
        this.updateAtlasSize(currentAtlas, fit.x, fit.y, paddedWidth, paddedHeight);
      }
    }
    
    // Add final atlas
    if (currentAtlas.sprites.length > 0) {
      this.atlases.push(currentAtlas);
    }
  }

  findPosition(atlas, width, height, maxSize) {
    if (atlas.sprites.length === 0) {
      // First sprite - place at origin
      if (width <= maxSize && height <= maxSize) {
        return { x: 0, y: 0 };
      }
      return null;
    }
    
    // Simple shelf packing algorithm
    const shelfHeight = Math.max(...atlas.sprites.map(s => s.height + CONFIG.padding * 2));
    const shelfY = Math.max(0, ...atlas.sprites.map(s => s.y + s.height + CONFIG.padding));
    
    // Try placing next to existing sprites on same shelf
    const shelfX = Math.max(0, ...atlas.sprites
      .filter(s => s.y < shelfY)
      .map(s => s.x + s.width + CONFIG.padding * 2));
    
    if (shelfX + width <= maxSize && shelfY + height <= maxSize) {
      return { x: shelfX, y: shelfY - height }; // Adjust for top-left origin
    }
    
    // Try new shelf
    if (shelfY + height <= maxSize && width <= maxSize) {
      return { x: 0, y: shelfY };
    }
    
    return null;
  }

  updateAtlasSize(atlas, x, y, width, height) {
    atlas.width = Math.max(atlas.width, x + width);
    atlas.height = Math.max(atlas.height, y + height);
  }

  async generateAtlases() {
    for (let i = 0; i < this.atlases.length; i++) {
      const atlas = this.atlases[i];
      const atlasName = `ui-atlas-${i + 1}`;
      
      console.log(`\n📋 Generating ${atlasName} (${atlas.width}x${atlas.height})`);
      
      // Create canvas
      atlas.canvas = createCanvas(atlas.width, atlas.height);
      atlas.context = atlas.canvas.getContext('2d');
      
      // Clear with transparent
      atlas.context.clearRect(0, 0, atlas.width, atlas.height);
      
      // Draw sprites
      for (const sprite of atlas.sprites) {
        atlas.context.drawImage(sprite.image, sprite.x, sprite.y);
        console.log(`   ✓ ${sprite.name} @ (${sprite.x}, ${sprite.y})`);
      }
      
      // Generate metadata
      const metadata = {
        name: atlasName,
        width: atlas.width,
        height: atlas.height,
        sprites: atlas.sprites.map(s => ({
          name: s.name,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
          rotated: false
        }))
      };
      
      // Save outputs
      await this.saveAtlas(atlas, metadata, atlasName);
    }
  }

  async saveAtlas(atlas, metadata, name) {
    // Ensure output directories exist
    const androidDir = path.join(this.outputDir, 'android', 'textures');
    const webDir = path.join(this.outputDir, 'web', 'textures');
    
    fs.mkdirSync(androidDir, { recursive: true });
    fs.mkdirSync(webDir, { recursive: true });
    
    // Save metadata (JSON)
    const metadataPath = path.join(this.outputDir, `${name}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Save WebP (Web)
    const webpPath = path.join(webDir, `${name}.webp`);
    const webpBuffer = await sharp(atlas.canvas.toBuffer('raw'))
      .webp({ quality: CONFIG.quality.webp, effort: 6 })
      .toBuffer();
    fs.writeFileSync(webpPath, webpBuffer);
    console.log(`   🌐 WebP: ${webpPath}`);
    
    // Save PNG (fallback for both)
    const pngPath = path.join(webDir, `${name}.png`);
    const pngBuffer = await sharp(atlas.canvas.toBuffer('raw'))
      .png({ compressionLevel: CONFIG.quality.png })
      .toBuffer();
    fs.writeFileSync(pngPath, pngBuffer);
    console.log(`   🖼️  PNG: ${pngPath}`);
    
    // Save ETC2 (Android) - using PNG as base, compress at runtime
    const androidPath = path.join(androidDir, `${name}.png`);
    fs.copyFileSync(pngPath, androidPath);
    console.log(`   📱 Android: ${androidPath}`);
    
    // Also save raw RGBA for ETC2 compression tools
    const rawPath = path.join(androidDir, `${name}.raw`);
    const rawBuffer = await sharp(atlas.canvas.toBuffer('raw'))
      .raw()
      .toBuffer();
    fs.writeFileSync(rawPath, rawBuffer);
    
    // Generate ETC2 if tool available
    await this.generateETC2(rawPath, path.join(androidDir, `${name}.etc2`), atlas.width, atlas.height);
  }

  async generateETC2(inputPath, outputPath, width, height) {
    // Check for etcpack or similar tool
    const { execSync } = require('child_process');
    
    try {
      // Try etcpack
      execSync(`which etcpack`, { stdio: 'ignore' });
      execSync(`etcpack ${inputPath} ${path.dirname(outputPath)} -c ETC2_RGBA -m`);
      console.log(`   🔧 ETC2: ${outputPath}`);
    } catch {
      // Try Mali Texture Compression Tool
      try {
        execSync(`which CompressonatorCLI`, { stdio: 'ignore' });
        execSync(`CompressonatorCLI -fd ETC2_RGBA ${inputPath} ${outputPath}`);
        console.log(`   🔧 ETC2: ${outputPath}`);
      } catch {
        console.log(`   ⚠️  No ETC2 tool found, using PNG fallback`);
      }
    }
  }
}

// CLI Interface
if (require.main === module) {
  const inputDir = process.argv[2] || 'shared-assets/raw/textures/ui';
  const outputDir = process.argv[3] || 'shared-assets/processed';
  
  const packer = new TexturePacker(inputDir, outputDir);
  packer.pack().catch(console.error);
}

module.exports = { TexturePacker };
