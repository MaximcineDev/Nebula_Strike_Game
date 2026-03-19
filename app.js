/**
 * NEBULA STRIKE - Main Game Engine
 * WebGL-based space shooter with PWA support
 */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  GAME: {
    WIDTH: 1080,
    HEIGHT: 1920,
    FPS: 60,
    DEBUG: false
  },
  PLAYER: {
    SPEED: 8,
    FIRE_RATE: 150, // ms between shots
    INVULNERABILITY_TIME: 2000
  },
  LASER: {
    SPEED: 15,
    DAMAGE: 1
  },
  ASTEROID: {
    SPAWN_RATE: 1500, // ms
    MIN_SPEED: 2,
    MAX_SPEED: 6,
    ROTATION_SPEED: 2
  },
  POWERUPS: {
    SHIELD_DURATION: 5000,
    LASER_DURATION: 8000
  }
};

// ============================================
// GAME STATE MANAGER
// ============================================

class GameState {
  constructor() {
    this.coins = parseInt(localStorage.getItem('nebula_coins')) || 0;
    this.highScore = parseInt(localStorage.getItem('nebula_highscore')) || 0;
    this.currentLevel = parseInt(localStorage.getItem('nebula_level')) || 1;
    this.unlockedLevels = JSON.parse(localStorage.getItem('nebula_unlocked')) || [1, 2, 3];
    this.ownedShips = JSON.parse(localStorage.getItem('nebula_ships')) || ['standard'];
    this.selectedShip = localStorage.getItem('nebula_selected_ship') || 'standard';
    this.inventory = JSON.parse(localStorage.getItem('nebula_inventory')) || {
      shields: 2,
      laserUpgrades: 1
    };

    this.premiumUnlocked = localStorage.getItem('nebula_premium') === "true";
    this.levelLock = 10;
    
    this.sessionScore = 0;
    this.lives = 3;
    this.isPlaying = false;
    this.isPaused = false;
  }
  
  addCoins(amount) {
    this.coins += amount;
    this.save();
    this.updateUI();
  }
  
  spendCoins(amount) {
    if (this.coins >= amount) {
      this.coins -= amount;
      this.save();
      this.updateUI();
      return true;
    }
    return false;
  }
  
  addScore(points) {
    this.sessionScore += points;
    if (this.sessionScore > this.highScore) {
      this.highScore = this.sessionScore;
      this.save();
    }
    this.updateUI();
  }
  
  useItem(item) {
    if (this.inventory[item] > 0) {
      this.inventory[item]--;
      this.save();
      return true;
    }
    return false;
  }
  
  addItem(item, count = 1) {
    this.inventory[item] = (this.inventory[item] || 0) + count;
    this.save();
  }
  
  resetSession() {
    this.sessionScore = 0;
    this.lives = 3;
    this.isPlaying = false;
    this.isPaused = false;
  }
  
  save() {
    localStorage.setItem('nebula_coins', this.coins);
    localStorage.setItem('nebula_highscore', this.highScore);
    localStorage.setItem('nebula_level', this.currentLevel);
    localStorage.setItem('nebula_unlocked', JSON.stringify(this.unlockedLevels));
    localStorage.setItem('nebula_ships', JSON.stringify(this.ownedShips));
    localStorage.setItem('nebula_selected_ship', this.selectedShip);
    localStorage.setItem('nebula_inventory', JSON.stringify(this.inventory));

    localStorage.setItem('nebula_premium', this.premiumUnlocked);
  }
  
  updateUI() {
    // Update menu stats
    const coinEl = document.getElementById('menu-coins');
    const highScoreEl = document.getElementById('menu-highscore');
    if (coinEl) coinEl.textContent = this.coins.toLocaleString();
    if (highScoreEl) highScoreEl.textContent = this.highScore.toLocaleString();
  }
}

// ============================================
// WEBGL RENDERER
// ============================================

class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }
    
    this.resize();
    this.initShaders();
    this.initBuffers();
    
    this.projectionMatrix = new Float32Array(16);
    this.viewMatrix = new Float32Array(16);
    this.modelMatrix = new Float32Array(16);
    
    this.setupMatrices();
  }
  
  resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.aspect = this.canvas.width / this.canvas.height;
  }
  
  initShaders() {
    const vsSource = `
      attribute vec4 aPosition;
      attribute vec4 aColor;
      attribute vec2 aTexCoord;
      
      uniform mat4 uProjectionMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uModelMatrix;
      
      varying vec4 vColor;
      varying vec2 vTexCoord;
      
      void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
        vColor = aColor;
        vTexCoord = aTexCoord;
      }
    `;
    
    const fsSource = `
      precision mediump float;
      
      varying vec4 vColor;
      varying vec2 vTexCoord;
      
      uniform sampler2D uTexture;
      uniform float uUseTexture;
      
      void main() {
        if (uUseTexture > 0.5) {
          gl_FragColor = texture2D(uTexture, vTexCoord) * vColor;
        } else {
          gl_FragColor = vColor;
        }
      }
    `;
    
    this.program = this.createProgram(vsSource, fsSource);
    this.gl.useProgram(this.program);
    
    // Get attribute/uniform locations
    this.locations = {
      position: this.gl.getAttribLocation(this.program, 'aPosition'),
      color: this.gl.getAttribLocation(this.program, 'aColor'),
      texCoord: this.gl.getAttribLocation(this.program, 'aTexCoord'),
      projection: this.gl.getUniformLocation(this.program, 'uProjectionMatrix'),
      view: this.gl.getUniformLocation(this.program, 'uViewMatrix'),
      model: this.gl.getUniformLocation(this.program, 'uModelMatrix'),
      useTexture: this.gl.getUniformLocation(this.program, 'uUseTexture')
    };
  }
  
  createProgram(vsSource, fsSource) {
    const vs = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
    const fs = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
    
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(program));
    }
    
    return program;
  }
  
  compileShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  initBuffers() {
    // Create geometry buffers
    this.buffers = {
      position: this.gl.createBuffer(),
      color: this.gl.createBuffer(),
      index: this.gl.createBuffer()
    };
  }
  
  setupMatrices() {
    // Orthographic projection
    const left = -this.aspect * 5;
    const right = this.aspect * 5;
    const bottom = -5;
    const top = 5;
    const near = 0.1;
    const far = 100;
    
    this.setIdentity(this.projectionMatrix);
    this.projectionMatrix[0] = 2 / (right - left);
    this.projectionMatrix[5] = 2 / (top - bottom);
    this.projectionMatrix[10] = -2 / (far - near);
    this.projectionMatrix[12] = -(right + left) / (right - left);
    this.projectionMatrix[13] = -(top + bottom) / (top - bottom);
    this.projectionMatrix[14] = -(far + near) / (far - near);
    
    // View matrix (camera)
    this.setIdentity(this.viewMatrix);
    this.viewMatrix[14] = -10; // Move camera back
  }
  
  setIdentity(matrix) {
    for (let i = 0; i < 16; i++) {
      matrix[i] = i % 5 === 0 ? 1 : 0;
    }
  }
  
  multiply(out, a, b) {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += a[i * 4 + k] * b[k * 4 + j];
        }
        out[i * 4 + j] = sum;
      }
    }
  }
  
  translate(matrix, x, y, z) {
    matrix[12] += x;
    matrix[13] += y;
    matrix[14] += z;
  }
  
  rotateZ(matrix, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m00 = matrix[0];
    const m01 = matrix[1];
    const m10 = matrix[4];
    const m11 = matrix[5];
    
    matrix[0] = m00 * c + m10 * s;
    matrix[1] = m01 * c + m11 * s;
    matrix[4] = m10 * c - m00 * s;
    matrix[5] = m11 * c - m01 * s;
  }
  
  scale(matrix, x, y, z) {
    matrix[0] *= x;
    matrix[1] *= x;
    matrix[2] *= x;
    matrix[4] *= y;
    matrix[5] *= y;
    matrix[6] *= y;
    matrix[8] *= z;
    matrix[9] *= z;
    matrix[10] *= z;
  }
  
  clear() {
    this.gl.clearColor(0.04, 0.04, 0.1, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }
  
  drawTriangles(vertices, colors, indices, transform = null) {
    // Set uniforms
    this.gl.uniformMatrix4fv(this.locations.projection, false, this.projectionMatrix);
    this.gl.uniformMatrix4fv(this.locations.view, false, this.viewMatrix);
    
    // Set model matrix
    this.setIdentity(this.modelMatrix);
    if (transform) {
      this.translate(this.modelMatrix, transform.x || 0, transform.y || 0, transform.z || 0);
      if (transform.rotation) this.rotateZ(this.modelMatrix, transform.rotation);
      if (transform.scale) this.scale(this.modelMatrix, transform.scale, transform.scale, 1);
    }
    this.gl.uniformMatrix4fv(this.locations.model, false, this.modelMatrix);
    this.gl.uniform1f(this.locations.useTexture, 0);
    
    // Position buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(this.locations.position);
    this.gl.vertexAttribPointer(this.locations.position, 3, this.gl.FLOAT, false, 0, 0);
    
    // Color buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.color);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(this.locations.color);
    this.gl.vertexAttribPointer(this.locations.color, 4, this.gl.FLOAT, false, 0, 0);
    
    // Index buffer
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
    
    // Draw
    this.gl.drawElements(this.gl.TRIANGLES, indices.length, this.gl.UNSIGNED_SHORT, 0);
  }
  
  drawPoints(positions, colors, pointSize = 2) {
    this.gl.uniformMatrix4fv(this.locations.projection, false, this.projectionMatrix);
    this.gl.uniformMatrix4fv(this.locations.view, false, this.viewMatrix);
    this.setIdentity(this.modelMatrix);
    this.gl.uniformMatrix4fv(this.locations.model, false, this.modelMatrix);
    this.gl.uniform1f(this.locations.useTexture, 0);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(this.locations.position);
    this.gl.vertexAttribPointer(this.locations.position, 3, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.color);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(this.locations.color);
    this.gl.vertexAttribPointer(this.locations.color, 4, this.gl.FLOAT, false, 0, 0);
    
    this.gl.drawArrays(this.gl.POINTS, 0, positions.length / 3);
  }
}

// ============================================
// GAME ENTITIES
// ============================================

class Player {
  constructor() {
    this.x = 0;
    this.y = -3;
    this.targetX = 0;
    this.targetY = -3;
    this.width = 0.8;
    this.height = 1.0;
    this.speed = CONFIG.PLAYER.SPEED;
    this.lastShot = 0;
    this.invulnerable = 0;
    this.shieldActive = false;
    this.laserUpgrade = false;
    
    // Visual properties
    this.bankAngle = 0;
    this.engineGlow = 0;
  }
  
  update(deltaTime, input) {
    // Smooth movement
    this.targetX = input.x;
    this.targetY = input.y;
    
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    
    this.x += dx * this.speed * deltaTime;
    this.y += dy * this.speed * deltaTime;
    
    // Clamp to screen
    this.x = Math.max(-4.5, Math.min(4.5, this.x));
    this.y = Math.max(-4, Math.min(3.5, this.y));
    
    // Banking animation
    this.bankAngle = -dx * 2;
    this.engineGlow = (Math.sin(Date.now() * 0.01) + 1) * 0.5;
    
    // Invulnerability countdown
    if (this.invulnerable > 0) {
      this.invulnerable -= deltaTime;
    }
  }
  
  canShoot() {
    const now = Date.now();
    const fireRate = this.laserUpgrade ? CONFIG.PLAYER.FIRE_RATE * 0.6 : CONFIG.PLAYER.FIRE_RATE;
    if (now - this.lastShot > fireRate) {
      this.lastShot = now;
      return true;
    }
    return false;
  }
  
  getLasers() {
    if (this.laserUpgrade) {
      return [
        { x: this.x - 0.3, y: this.y + 0.5 },
        { x: this.x, y: this.y + 0.6 },
        { x: this.x + 0.3, y: this.y + 0.5 }
      ];
    }
    return [{ x: this.x, y: this.y + 0.5 }];
  }
  
  hit() {
    if (this.shieldActive) {
      this.shieldActive = false;
      return false;
    }
    if (this.invulnerable > 0) return false;
    
    this.invulnerable = CONFIG.PLAYER.INVULNERABILITY_TIME / 1000;
    return true;
  }
  
  render(renderer) {
    const vertices = this.getVertices();
    const colors = this.getColors();
    const indices = [0, 1, 5, 0, 5, 2, 1, 3, 5, 5, 4, 2];
    
    renderer.drawTriangles(vertices, colors, indices, {
      x: this.x,
      y: this.y,
      rotation: this.bankAngle,
      scale: 1
    });
    
    // Engine glow
    if (this.engineGlow > 0.3) {
      this.renderEngineGlow(renderer);
    }
    
    // Shield effect
    if (this.shieldActive) {
      this.renderShield(renderer);
    }
  }
  
  getVertices() {
    return [
      0, 0.5, 0,      // nose
      -0.4, -0.2, 0,  // left wing
      0.4, -0.2, 0,   // right wing
      -0.2, -0.4, 0,  // left engine
      0.2, -0.4, 0,   // right engine
      0, -0.1, 0      // center
    ];
  }
  
  getColors() {
    const alpha = this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0 ? 0.3 : 1;
    return [
      0, 0.8, 1, alpha,
      0, 0.6, 0.8, alpha,
      0, 0.6, 0.8, alpha,
      1, 0.4, 0, alpha,
      1, 0.4, 0, alpha,
      0.1, 0.4, 0.6, alpha
    ];
  }
  
  renderEngineGlow(renderer) {
    const glowSize = 0.3 + this.engineGlow * 0.2;
    const vertices = [
      -0.2, -0.4, 0,
      -0.2 - glowSize, -0.4 - glowSize * 2, 0,
      -0.2 + glowSize, -0.4 - glowSize * 2, 0,
      0.2, -0.4, 0,
      0.2 - glowSize, -0.4 - glowSize * 2, 0,
      0.2 + glowSize, -0.4 - glowSize * 2, 0
    ];
    const colors = [
      1, 0.6, 0, 0.8,
      1, 0.2, 0, 0,
      1, 0.8, 0, 0,
      1, 0.6, 0, 0.8,
      1, 0.2, 0, 0,
      1, 0.8, 0, 0
    ];
    const indices = [0, 1, 2, 3, 4, 5];
    
    renderer.drawTriangles(vertices, colors, indices, { x: this.x, y: this.y });
  }
  
  renderShield(renderer) {
    const time = Date.now() * 0.002;
    const pulse = Math.sin(time) * 0.1 + 0.9;
    
    const vertices = [];
    const colors = [];
    const indices = [];
    const segments = 16;
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * 0.8 * pulse;
      const y = Math.sin(angle) * 0.8 * pulse;
      vertices.push(x, y, 0);
      colors.push(0.3, 0.5, 1, 0.3);
      if (i < segments) {
        indices.push(0, i + 1, i + 2);
      }
    }
    
    renderer.drawTriangles(vertices, colors, indices, { x: this.x, y: this.y });
  }
}

class Laser {
  constructor(x, y, isUpgraded = false) {
    this.x = x;
    this.y = y;
    this.width = isUpgraded ? 0.15 : 0.08;
    this.height = 0.6;
    this.speed = CONFIG.LASER.SPEED;
    this.damage = isUpgraded ? 2 : 1;
    this.active = true;
    this.isUpgraded = isUpgraded;
  }
  
  update(deltaTime) {
    this.y += this.speed * deltaTime;
    if (this.y > 6) this.active = false;
  }
  
  render(renderer) {
    const vertices = [
      -this.width / 2, this.height / 2, 0,
      -this.width / 2, -this.height / 2, 0,
      this.width / 2, -this.height / 2, 0,
      this.width / 2, this.height / 2, 0
    ];
    
    const r = this.isUpgraded ? 1 : 0;
    const g = this.isUpgraded ? 0.5 : 1;
    const b = 1;
    
    const colors = [
      r, g, b, 1,
      r, g, b, 0.5,
      r, g, b, 0.5,
      r, g, b, 1
    ];
    
    const indices = [0, 1, 2, 0, 2, 3];
    
    renderer.drawTriangles(vertices, colors, indices, {
      x: this.x,
      y: this.y
    });
  }
  
  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y + this.height / 2,
      bottom: this.y - this.height / 2
    };
  }
}

class Asteroid {
  constructor(x, y, size = 'medium') {
    this.x = x;
    this.y = y;
    this.size = size;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * CONFIG.ASTEROID.ROTATION_SPEED;
    this.speed = CONFIG.ASTEROID.MIN_SPEED + Math.random() * (CONFIG.ASTEROID.MAX_SPEED - CONFIG.ASTEROID.MIN_SPEED);
    this.active = true;
    this.vertices = this.generateShape();
    
    switch (size) {
      case 'small':
        this.radius = 0.3;
        this.health = 1;
        this.score = 100;
        break;
      case 'large':
        this.radius = 0.7;
        this.health = 3;
        this.score = 300;
        break;
      default:
        this.radius = 0.5;
        this.health = 2;
        this.score = 200;
    }
  }
  
  generateShape() {
    const vertices = [];
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = 0.7 + Math.random() * 0.6;
      vertices.push(Math.cos(angle) * r, Math.sin(angle) * r, 0);
    }
    return vertices;
  }
  
  update(deltaTime) {
    this.y -= this.speed * deltaTime;
    this.rotation += this.rotationSpeed * deltaTime;
    if (this.y < -6) this.active = false;
  }
  
  render(renderer) {
    const colors = [];
    for (let i = 0; i < this.vertices.length / 3; i++) {
      colors.push(0.55, 0.45, 0.35, 1);
    }
    
    const indices = [];
    for (let i = 1; i < this.vertices.length / 3 - 1; i++) {
      indices.push(0, i, i + 1);
    }
    
    renderer.drawTriangles(this.vertices, colors, indices, {
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      scale: this.radius
    });
  }
  
  hit(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }
  
  getBounds() {
    return {
      left: this.x - this.radius,
      right: this.x + this.radius,
      top: this.y + this.radius,
      bottom: this.y - this.radius
    };
  }
}

class Particle {
  constructor(x, y, type = 'explosion') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.life = 1;
    this.maxLife = 1;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    this.size = 0.1 + Math.random() * 0.2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    
    switch (type) {
      case 'spark':
        this.r = 0.5; this.g = 0.8; this.b = 1;
        break;
      case 'smoke':
        this.r = 0.5; this.g = 0.5; this.b = 0.5;
        break;
      default:
        this.r = 1; this.g = 0.5 + Math.random() * 0.5; this.b = 0;
    }
  }
  
  update(deltaTime) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.rotation += this.rotationSpeed * deltaTime;
    this.life -= deltaTime * 1.5;
  }
  
  render(renderer) {
    const scale = this.size * this.life;
    const alpha = this.life;
    
    const vertices = [
      -0.5, 0.5, 0,
      -0.5, -0.5, 0,
      0.5, -0.5, 0,
      0.5, 0.5, 0
    ];
    
    const colors = [
      this.r, this.g, this.b, alpha,
      this.r, this.g, this.b, alpha * 0.5,
      this.r, this.g, this.b, alpha * 0.5,
      this.r, this.g, this.b, alpha
    ];
    
    const indices = [0, 1, 2, 0, 2, 3];
    
    renderer.drawTriangles(vertices, colors, indices, {
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      scale: scale
    });
  }
}

class Starfield {
  constructor(count = 150) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: Math.random() * 10 + 1,
        speed: Math.random() * 2 + 0.5
      });
    }
  }
  
  update(deltaTime) {
    this.stars.forEach(star => {
      star.y -= star.speed * deltaTime * (11 - star.z) * 0.1;
      if (star.y < -10) {
        star.y = 10;
        star.x = (Math.random() - 0.5) * 20;
      }
    });
  }
  
  render(renderer) {
    const positions = [];
    const colors = [];
    
    this.stars.forEach(star => {
      positions.push(star.x, star.y, -star.z);
      const brightness = 0.5 + (10 - star.z) / 20;
      colors.push(brightness, brightness, brightness + 0.2, 1);
    });
    
    renderer.gl.pointSize = 2;
    renderer.drawPoints(positions, colors);
  }
}

// ============================================
// MAIN GAME CLASS
// ============================================

class NebulaStrike {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.state = new GameState();
    this.renderer = null;
    this.lastTime = 0;
    this.accumulator = 0;
    this.timeStep = 1 / 60;
    
    // Input
    this.input = { x: 0, y: -3, touching: false };
    
    // Game objects
    this.player = null;
    this.lasers = [];
    this.asteroids = [];
    this.particles = [];
    this.starfield = null;
    
    // Spawning
    this.lastAsteroidSpawn = 0;
    
    // UI elements
    this.ui = {
      loading: document.getElementById('loading-screen'),
      menu: document.getElementById('main-menu'),
      hud: null,
      pause: null,
      gameOver: null
    };
    
    this.init();
  }
  
  async init() {
    try {
      // Initialize WebGL
      this.renderer = new WebGLRenderer(this.canvas);
      
      // Setup input
      this.setupInput();
      
      // Create HUD
      this.createHUD();
      
      // Load saved data
      this.state.updateUI();
      
      // Show continue button if game in progress
      const hasProgress = localStorage.getItem('nebula_session');
      if (hasProgress) {
        document.getElementById('btn-continue').classList.remove('hidden');
      }
      
      // Hide loading
      setTimeout(() => {
        this.ui.loading.classList.add('hidden');
      }, 1000);
      
      // Start render loop
      requestAnimationFrame(t => this.loop(t));
      
    } catch (error) {
      console.error('Initialization failed:', error);
      this.showError('Failed to initialize game. Please check if WebGL is enabled.');
    }
  }
  
  setupInput() {
    const updatePos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Convert to game coordinates (-5 to 5, -5 to 5)
      this.input.x = (x - 0.5) * 10 * this.renderer.aspect;
      this.input.y = -(y - 0.5) * 10;
      this.input.touching = true;
    };
    
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      updatePos(e.touches[0]);
    }, { passive: false });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      updatePos(e.touches[0]);
    }, { passive: false });
    
    this.canvas.addEventListener('touchend', () => {
      this.input.touching = false;
    });
    
    this.canvas.addEventListener('mousedown', updatePos);
    this.canvas.addEventListener('mousemove', (e) => {
      if (e.buttons > 0) updatePos(e);
    });
    this.canvas.addEventListener('mouseup', () => {
      this.input.touching = false;
    });
    
    // Button events
    document.getElementById('btn-play').addEventListener('click', () => this.startGame());
    document.getElementById('btn-continue').addEventListener('click', () => this.continueGame());
    document.getElementById('btn-shop').addEventListener('click', () => this.openShop());
  }
  
  createHUD() {
    const hud = document.createElement('div');
    hud.className = 'hud';
    hud.innerHTML = `
      <div class="hud-top">
        <div class="hud-score">SCORE: <span id="hud-score">0</span></div>
        <div class="hud-lives" id="hud-lives"></div>
      </div>
      <div class="hud-coins">💰 <span id="hud-coins">0</span></div>
      <div class="hud-level">LEVEL <span id="hud-level">1</span></div>
      <div class="hud-bottom">
        <button class="powerup-btn shield" id="btn-shield">
          <span class="icon">🛡️</span>
          <span class="count" id="shield-count">0</span>
        </button>
        <button class="powerup-btn laser" id="btn-laser">
          <span class="icon">⚡</span>
          <span class="count" id="laser-count">0</span>
        </button>
      </div>
    `;
    document.querySelector('.game-container').appendChild(hud);
    this.ui.hud = hud;
    
    // Powerup buttons
    document.getElementById('btn-shield').addEventListener('click', () => this.activateShield());
    document.getElementById('btn-laser').addEventListener('click', () => this.activateLaser());
  }
  
  startGame() {

    if (
      this.state.currentLevel >= this.state.levelLock &&
      !this.state.premiumUnlocked
    ) {
      this.showUpgradeScreen();
      return;
    }

    this.resetGame();
    this.ui.menu.classList.add('hidden');
    this.ui.hud.classList.remove('hidden');
    this.state.isPlaying = true;
  }
  
  continueGame() {
    // Load saved session
    const session = JSON.parse(localStorage.getItem('nebula_session'));
    if (session) {
      this.state.sessionScore = session.score;
      this.state.lives = session.lives;
      this.state.currentLevel = session.level;
    }
    this.startGame();
  }
  
  resetGame() {
    this.player = new Player();
    this.lasers = [];
    this.asteroids = [];
    this.particles = [];
    this.starfield = new Starfield();
    this.state.resetSession();
    this.updateHUD();
  }
  
  activateShield() {
    if (this.state.useItem('shields')) {
      this.player.shieldActive = true;
      this.updateHUD();
      setTimeout(() => {
        this.player.shieldActive = false;
      }, CONFIG.POWERUPS.SHIELD_DURATION);
    }
  }
  
  activateLaser() {
    if (this.state.useItem('laserUpgrades')) {
      this.player.laserUpgrade = true;
      this.updateHUD();
      setTimeout(() => {
        this.player.laserUpgrade = false;
      }, CONFIG.POWERUPS.LASER_DURATION);
    }
  }
  
  spawnAsteroid() {
    const now = Date.now();
    if (now - this.lastAsteroidSpawn > CONFIG.ASTEROID.SPAWN_RATE) {
      const x = (Math.random() - 0.5) * 9;
      const sizes = ['small', 'medium', 'large'];
      const weights = [0.3, 0.5, 0.2];
      const size = this.weightedRandom(sizes, weights);
      this.asteroids.push(new Asteroid(x, 6, size));
      this.lastAsteroidSpawn = now;
    }
  }
  
  weightedRandom(items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    return items[items.length - 1];
  }
  
  checkCollisions() {
    // Lasers vs Asteroids
    this.lasers.forEach(laser => {
      if (!laser.active) return;
      
      this.asteroids.forEach(asteroid => {
        if (!asteroid.active) return;
        
        if (this.intersects(laser.getBounds(), asteroid.getBounds())) {
          laser.active = false;
          
          if (asteroid.hit(laser.damage)) {
            // Destroyed
            this.state.addScore(asteroid.score);
            this.state.addCoins(Math.floor(asteroid.score / 10));
            this.spawnExplosion(asteroid.x, asteroid.y, asteroid.size);
            
            // Split large asteroids
            if (asteroid.size === 'large') {
              this.asteroids.push(new Asteroid(asteroid.x - 0.3, asteroid.y, 'medium'));
              this.asteroids.push(new Asteroid(asteroid.x + 0.3, asteroid.y, 'medium'));
            }
          } else {
            // Hit but not destroyed
            this.spawnParticles(asteroid.x, asteroid.y, 5, 'spark');
          }
        }
      });
    });
    
    // Player vs Asteroids
    this.asteroids.forEach(asteroid => {
      if (!asteroid.active) return;
      
      const dx = this.player.x - asteroid.x;
      const dy = this.player.y - asteroid.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.player.width / 2 + asteroid.radius) {
        if (this.player.hit()) {
          this.state.lives--;
          this.spawnExplosion(this.player.x, this.player.y, 'large');
          
          if (this.state.lives <= 0) {
            this.gameOver();
          }
        }
        asteroid.active = false;
      }
    });
  }
  
  intersects(a, b) {
    return a.left < b.right && a.right > b.left && 
           a.top > b.bottom && a.bottom < b.top;
  }
  
  spawnExplosion(x, y, size) {
    const count = size === 'large' ? 20 : size === 'medium' ? 15 : 10;
    this.spawnParticles(x, y, count, 'explosion');
  }
  
  spawnParticles(x, y, count, type) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, type));
    }
  }
  
  updateHUD() {
    document.getElementById('hud-score').textContent = this.state.sessionScore.toLocaleString();
    document.getElementById('hud-coins').textContent = this.state.coins.toLocaleString();
    document.getElementById('hud-level').textContent = this.state.currentLevel;
    document.getElementById('shield-count').textContent = this.state.inventory.shields;
    document.getElementById('laser-count').textContent = this.state.inventory.laserUpgrades;
    
    // Update lives
    const livesContainer = document.getElementById('hud-lives');
    livesContainer.innerHTML = '❤️'.repeat(this.state.lives);
  }
  
  gameOver() {
    this.state.isPlaying = false;
    this.state.save();
    
    // Save to leaderboard
    this.saveScore();
    
    // Show game over screen
    this.showGameOver();
  }

  levelComplete() {

    this.state.currentLevel++;

    this.state.addCoins(100);

    this.state.save();

  }
  
  saveScore() {
    const scores = JSON.parse(localStorage.getItem('nebula_leaderboard') || '[]');
    scores.push({
      score: this.state.sessionScore,
      date: new Date().toISOString(),
      level: this.state.currentLevel
    });
    scores.sort((a, b) => b.score - a.score);
    scores.splice(10); // Keep top 10
    localStorage.setItem('nebula_leaderboard', JSON.stringify(scores));
  }
  
  showGameOver() {
    // Create game over screen if not exists
    if (!this.ui.gameOver) {
      const div = document.createElement('div');
      div.className = 'game-over';
      div.innerHTML = `
        <h2 class="game-over-title">GAME OVER</h2>
        <p class="final-score">Final Score: <span>${this.state.sessionScore.toLocaleString()}</span></p>
        ${this.state.sessionScore >= this.state.highScore ? '<p class="high-score-beat">🏆 NEW HIGH SCORE!</p>' : ''}
        <div class="pause-buttons">
          <button class="menu-btn primary" onclick="game.restart()">Try Again</button>
          <button class="menu-btn" onclick="game.toMenu()">Main Menu</button>
        </div>
      `;
      document.querySelector('.game-container').appendChild(div);
      this.ui.gameOver = div;
    }
    
    this.ui.gameOver.querySelector('.final-score span').textContent = 
      this.state.sessionScore.toLocaleString();
    this.ui.gameOver.classList.add('active');
  }
  
  restart() {
    this.ui.gameOver.classList.remove('active');
    this.startGame();
  }
  
  toMenu() {
    this.ui.gameOver.classList.remove('active');
    this.ui.hud.classList.add('hidden');
    this.ui.menu.classList.remove('hidden');
  }
  
  openShop() {
    window.location.href = '/shop.html';
  }

  showUpgradeScreen() {
    window.location.href = '/upgrade.html';
  }
  
  update(deltaTime) {
    if (!this.state.isPlaying || this.state.isPaused) return;
    
    // Update entities
    this.starfield.update(deltaTime);
    this.player.update(deltaTime, this.input);
    
    // Player shooting
    if (this.player.canShoot()) {
      const laserPositions = this.player.getLasers();
      laserPositions.forEach(pos => {
        this.lasers.push(new Laser(pos.x, pos.y, this.player.laserUpgrade));
      });
    }
    
    // Update lasers
    this.lasers = this.lasers.filter(l => {
      l.update(deltaTime);
      return l.active;
    });
    
    // Spawn and update asteroids
    this.spawnAsteroid();
    this.asteroids = this.asteroids.filter(a => {
      a.update(deltaTime);
      return a.active;
    });
    
    // Update particles
    this.particles = this.particles.filter(p => {
      p.update(deltaTime);
      return p.life > 0;
    });
    
    // Collisions
    this.checkCollisions();

    if (this.state.sessionScore > 2000) {
      this.levelComplete();
    }
    
    // Update HUD
    this.updateHUD();
  }
  
  render() {
    this.renderer.clear();
    
    if (!this.state.isPlaying) {
      // Render background only
      if (this.starfield) {
        this.starfield.render(this.renderer);
      }
      return;
    }
    
    // Render game
    this.starfield.render(this.renderer);
    
    this.particles.forEach(p => p.render(this.renderer));
    this.asteroids.forEach(a => a.render(this.renderer));
    this.lasers.forEach(l => l.render(this.renderer));
    this.player.render(this.renderer);
  }
  
  loop(timestamp) {
    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    
    this.accumulator += deltaTime;
    
    while (this.accumulator >= this.timeStep) {
      this.update(this.timeStep);
      this.accumulator -= this.timeStep;
    }
    
    this.render();
    
    requestAnimationFrame(t => this.loop(t));
  }
  
  showError(message) {
    alert(message);
  }
}

// ============================================
// INITIALIZE GAME
// ============================================

let game;

window.addEventListener('DOMContentLoaded', () => {
  game = new NebulaStrike();
});

// Prevent zoom on double tap
document.addEventListener('dblclick', (e) => {
  e.preventDefault();
}, { passive: false });

// Prevent context menu
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});
