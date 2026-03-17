/**
 * Nebula Strike Web Asset Loader
 * Loads JSON/WebP assets optimized for web delivery
 */

export class AssetLoader {
  constructor() {
    this.manifest = null;
    this.textureCache = new Map();
    this.modelCache = new Map();
    this.audioCache = new Map();
    this.loadingPromises = new Map();
    
    // WebGL context for texture loading
    this.gl = null;
  }
  
  /**
   * Initialize with WebGL context
   */
  async initialize(gl) {
    this.gl = gl;
    
    try {
      const response = await fetch('assets/asset-manifest.json');
      if (!response.ok) throw new Error('Manifest not found');
      
      this.manifest = await response.json();
      console.log('[AssetLoader] Manifest loaded:', this.manifest.version);
      return true;
    } catch (error) {
      console.error('[AssetLoader] Failed to load manifest:', error);
      return false;
    }
  }
  
  /**
   * Load texture as WebGL texture
   */
  async loadTexture(name, options = {}) {
    // Return cached texture
    if (this.textureCache.has(name)) {
      return this.textureCache.get(name);
    }
    
    // Return existing promise if loading
    if (this.loadingPromises.has(`texture:${name}`)) {
      return this.loadingPromises.get(`texture:${name}`);
    }
    
    const promise = this._loadTextureInternal(name, options);
    this.loadingPromises.set(`texture:${name}`, promise);
    
    try {
      const texture = await promise;
      this.textureCache.set(name, texture);
      return texture;
    } finally {
      this.loadingPromises.delete(`texture:${name}`);
    }
  }
  
  async _loadTextureInternal(name, options) {
    const config = this.manifest?.assets?.textures?.[name];
    if (!config) {
      throw new Error(`Texture not found: ${name}`);
    }
    
    const path = config.web;
    const { generateMipmaps = true, wrapS = 'CLAMP_TO_EDGE', wrapT = 'CLAMP_TO_EDGE' } = options;
    
    try {
      // Try WebP first, fallback to PNG
      const image = await this.loadImage(path);
      
      const texture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      
      // Set parameters
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl[wrapS]);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl[wrapT]);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, generateMipmaps ? this.gl.LINEAR_MIPMAP_LINEAR : this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      
      // Upload image
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
      
      if (generateMipmaps) {
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
      }
      
      console.log(`[AssetLoader] Texture loaded: ${name} (${image.width}x${image.height})`);
      return texture;
      
    } catch (error) {
      console.error(`[AssetLoader] Failed to load texture: ${name}`, error);
      return this.createFallbackTexture();
    }
  }
  
  /**
   * Load image with cross-origin support
   */
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Try PNG fallback
        const pngSrc = src.replace('.webp', '.png');
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        fallbackImg.src = pngSrc;
      };
      img.src = src;
    });
  }
  
  /**
   * Create 1x1 pink fallback texture
   */
  createFallbackTexture() {
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    
    const pixel = new Uint8Array([255, 0, 255, 255]); // Magenta
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
    
    return texture;
  }
  
  /**
   * Load 3D model from JSON
   */
  async loadModel(name) {
    if (this.modelCache.has(name)) {
      return this.modelCache.get(name);
    }
    
    if (this.loadingPromises.has(`model:${name}`)) {
      return this.loadingPromises.get(`model:${name}`);
    }
    
    const promise = this._loadModelInternal(name);
    this.loadingPromises.set(`model:${name}`, promise);
    
    try {
      const model = await promise;
      this.modelCache.set(name, model);
      return model;
    } finally {
      this.loadingPromises.delete(`model:${name}`);
    }
  }
  
  async _loadModelInternal(name) {
    const config = this.manifest?.assets?.models?.[name];
    if (!config) {
      throw new Error(`Model not found: ${name}`);
    }
    
    try {
      const response = await fetch(config.web);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Convert to typed arrays for WebGL
      const model = {
        positions: new Float32Array(data.vertices),
        normals: data.normals ? new Float32Array(data.normals) : null,
        uvs: data.uvs ? new Float32Array(data.uvs) : null,
        indices: new Uint16Array(data.faces.flat()),
        vertexCount: data.vertices.length / 3,
        indexCount: data.faces.length * 3
      };
      
      console.log(`[AssetLoader] Model loaded: ${name} (${model.vertexCount} vertices)`);
      return model;
      
    } catch (error) {
      console.error(`[AssetLoader] Failed to load model: ${name}`, error);
      return this.createFallbackModel();
    }
  }
  
  /**
   * Create simple triangle fallback model
   */
  createFallbackModel() {
    return {
      positions: new Float32Array([
        0, 0.5, 0,
        -0.5, -0.5, 0,
        0.5, -0.5, 0
      ]),
      normals: new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1
      ]),
      uvs: new Float32Array([
        0.5, 1,
        0, 0,
        1, 0
      ]),
      indices: new Uint16Array([0, 1, 2]),
      vertexCount: 3,
      indexCount: 3
    };
  }
  
  /**
   * Load audio file
   */
  async loadAudio(name, options = {}) {
    if (this.audioCache.has(name)) {
      return this.audioCache.get(name);
    }
    
    const config = this.manifest?.assets?.audio?.[name];
    if (!config) {
      console.warn(`[AssetLoader] Audio not found: ${name}`);
      return null;
    }
    
    const { volume = 1, loop = false } = options;
    
    try {
      const audio = new Audio(config.web);
      audio.volume = volume;
      audio.loop = loop;
      
      // Preload
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', reject, { once: true });
        audio.load();
      });
      
      this.audioCache.set(name, audio);
      return audio;
      
    } catch (error) {
      console.error(`[AssetLoader] Failed to load audio: ${name}`, error);
      return null;
    }
  }
  
  /**
   * Load level data
   */
  async loadLevels() {
    const config = this.manifest?.assets?.data?.levels;
    if (!config) return [];
    
    try {
      const response = await fetch(config.web);
      const data = await response.json();
      return data.levels || [];
    } catch (error) {
      console.error('[AssetLoader] Failed to load levels:', error);
      return [];
    }
  }
  
  /**
   * Get atlas sprite coordinates
   */
  getSpriteUVs(atlasName, spriteName) {
    const config = this.manifest?.assets?.textures?.[atlasName];
    if (!config?.isAtlas) return null;
    
    const sprite = config.sprites?.[spriteName];
    if (!sprite) return null;
    
    const { x, y, w, h } = sprite;
    const atlasW = config.width;
    const atlasH = config.height;
    
    return {
      u0: x / atlasW,
      v0: 1 - (y + h) / atlasH,
      u1: (x + w) / atlasW,
      v1: 1 - y / atlasH
    };
  }
  
  /**
   * Preload critical assets for a level
   */
  async preloadLevel(levelId) {
    const levels = await this.loadLevels();
    const level = levels.find(l => l.id === levelId);
    if (!level) return;
    
    const assetsToLoad = [
      this.loadTexture(level.backgroundTexture),
      this.loadAudio(level.musicTrack, { loop: true }),
      this.loadModel('spaceship'),
      this.loadModel('asteroid-small'),
      this.loadModel('asteroid-medium'),
      this.loadTexture('particle-fire'),
      this.loadTexture('particle-spark')
    ];
    
    await Promise.all(assetsToLoad);
    console.log(`[AssetLoader] Level ${levelId} assets preloaded`);
  }
  
  /**
   * Get loading progress
   */
  getLoadingProgress() {
    const total = this.loadingPromises.size + this.textureCache.size + this.modelCache.size;
    const loaded = this.textureCache.size + this.modelCache.size;
    return total > 0 ? loaded / total : 1;
  }
  
  /**
   * Clear all caches
   */
  clearCache() {
    // Delete WebGL textures
    for (const texture of this.textureCache.values()) {
      this.gl.deleteTexture(texture);
    }
    
    this.textureCache.clear();
    this.modelCache.clear();
    this.audioCache.clear();
    
    console.log('[AssetLoader] All caches cleared');
  }
}
