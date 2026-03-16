// MainActivity.kt (Updated)
package com.nebulastrike.spacefighter

import android.app.Activity
import android.content.Intent
import android.opengl.GLSurfaceView
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.lifecycle.lifecycleScope
import com.nebulastrike.spacefighter.billing.BillingManager
import com.nebulastrike.spacefighter.data.GameStateManager
import com.nebulastrike.spacefighter.ui.ShopActivity
import kotlinx.coroutines.launch

class MainActivity : Activity() {
    private lateinit var glSurfaceView: GameGLSurfaceView
    private lateinit var gameStateManager: GameStateManager
    private lateinit var billingManager: BillingManager
    
    // UI Elements
    private lateinit var coinText: TextView
    private lateinit var shieldButton: Button
    private lateinit var laserButton: Button
    private lateinit var shopButton: Button
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        gameStateManager = GameStateManager(this)
        billingManager = BillingManager(this)
        
        // Check if coming from level select
        val level = intent.getIntExtra("LEVEL", 1)
        
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        setContentView(R.layout.activity_main_game)
        
        setupGameView(level)
        setupUI()
        observeGameState()
    }
    
    private fun setupGameView(level: Int) {
        glSurfaceView = findViewById(R.id.glSurfaceView)
        val renderer = GameRenderer(this, level, gameStateManager)
        glSurfaceView.setRenderer(renderer)
        
        // Pass touch events to renderer
        glSurfaceView.setOnTouchListener { _, event ->
            renderer.handleTouch(event)
            true
        }
    }
    
    private fun setupUI() {
        coinText = findViewById(R.id.coinText)
        shieldButton = findViewById(R.id.shieldButton)
        laserButton = findViewById(R.id.laserButton)
        shopButton = findViewById(R.id.shopButton)
        
        shieldButton.setOnClickListener {
            if (gameStateManager.useShield()) {
                glSurfaceView.renderer.activateShield()
                Toast.makeText(this, "Shield activated!", Toast.LENGTH_SHORT).show()
            } else {
                promptBuyShields()
            }
        }
        
        laserButton.setOnClickListener {
            if (gameStateManager.useLaserUpgrade()) {
                glSurfaceView.renderer.activateLaserUpgrade()
                Toast.makeText(this, "Laser upgraded!", Toast.LENGTH_SHORT).show()
            } else {
                promptBuyLasers()
            }
        }
        
        shopButton.setOnClickListener {
            startActivity(Intent(this, ShopActivity::class.java))
        }
        
        updatePowerUpButtons()
    }
    
    private fun observeGameState() {
        lifecycleScope.launch {
            gameStateManager.coins.collect { coins ->
                coinText.text = "💰 $coins"
            }
        }
        
        lifecycleScope.launch {
            gameStateManager.shieldCount.collect { count ->
                shieldButton.text = "🛡️ $count"
                shieldButton.alpha = if (count > 0) 1.0f else 0.5f
            }
        }
        
        lifecycleScope.launch {
            gameStateManager.laserUpgradeCount.collect { count ->
                laserButton.text = "⚡ $count"
                laserButton.alpha = if (count > 0) 1.0f else 0.5f
            }
        }
    }
    
    private fun promptBuyShields() {
        AlertDialog.Builder(this)
            .setTitle("No Shields!")
            .setMessage("Buy shields from the shop?")
            .setPositiveButton("Go to Shop") { _, _ ->
                startActivity(Intent(this, ShopActivity::class.java))
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun promptBuyLasers() {
        AlertDialog.Builder(this)
            .setTitle("No Laser Upgrades!")
            .setMessage("Buy laser upgrades from the shop?")
            .setPositiveButton("Go to Shop") { _, _ ->
                startActivity(Intent(this, ShopActivity::class.java))
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun updatePowerUpButtons() {
        // Initial update
        shieldButton.text = "🛡️ ${gameStateManager.shieldCount.value}"
        laserButton.text = "⚡ ${gameStateManager.laserUpgradeCount.value}"
    }
    
    override fun onPause() {
        super.onPause()
        glSurfaceView.onPause()
    }
    
    override fun onResume() {
        super.onResume()
        glSurfaceView.onResume()
        // Refresh purchase state
        billingManager.queryPurchases()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        billingManager.disconnect()
    }
}

// AsteroidManager.kt - Enemy asteroids
package com.nebulastrike.spacefighter

import android.opengl.GLES20
import android.opengl.Matrix
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import kotlin.random.Random

data class Asteroid(
    var x: Float = 0f,
    var y: Float = 5f,
    var z: Float = 0f,
    var size: Float = 0.5f,
    var rotation: Float = 0f,
    var rotSpeed: Float = 0f,
    var speed: Float = 0.05f,
    var active: Boolean = true
)

class AsteroidManager {
    private val asteroids = mutableListOf<Asteroid>()
    private val maxAsteroids = 8
    
    private val vertices = floatArrayOf(
        -0.5f, 0.5f, 0.0f,
        -0.5f, -0.5f, 0.0f,
        0.5f, -0.5f, 0.0f,
        0.5f, 0.5f, 0.0f
    )
    
    private val vertexBuffer: FloatBuffer
    private val program: Int
    private var positionHandle = 0
    private var mvpMatrixHandle = 0
    private var colorHandle = 0
    
    init {
        vertexBuffer = ByteBuffer.allocateDirect(vertices.size * 4).order(ByteOrder.nativeOrder()).asFloatBuffer().put(vertices)
        
        val vertexShaderCode = """
            uniform mat4 uMVPMatrix;
            attribute vec4 vPosition;
            void main() {
                gl_Position = uMVPMatrix * vPosition;
            }
        """.trimIndent()
        
        val fragmentShaderCode = """
            precision mediump float;
            uniform vec4 vColor;
            void main() {
                gl_FragColor = vColor;
            }
        """.trimIndent()
        
        program = ShaderUtils.createProgram(vertexShaderCode, fragmentShaderCode)
        
        // Spawn initial asteroids
        for (i in 0 until 3) {
            spawnAsteroid()
        }
    }
    
    private fun spawnAsteroid() {
        val asteroid = Asteroid(
            x = Random.nextFloat() * 6f - 3f,
            y = 6f,
            size = Random.nextFloat() * 0.4f + 0.3f,
            rotSpeed = Random.nextFloat() * 4f - 2f,
            speed = Random.nextFloat() * 0.03f + 0.02f
        )
        asteroids.add(asteroid)
    }
    
    fun update(time: Float) {
        // Spawn new asteroids
        if (asteroids.size < maxAsteroids && Random.nextFloat() < 0.02f) {
            spawnAsteroid()
        }
        
        // Update existing
        val iterator = asteroids.iterator()
        while (iterator.hasNext()) {
            val asteroid = iterator.next()
            if (!asteroid.active) {
                iterator.remove()
                continue
            }
            
            asteroid.y -= asteroid.speed
            asteroid.rotation += asteroid.rotSpeed
            
            if (asteroid.y < -6f) {
                iterator.remove()
            }
        }
    }
    
    fun getAsteroids(): List<Asteroid> = asteroids
    
    fun draw(viewMatrix: FloatArray, projectionMatrix: FloatArray) {
        GLES20.glUseProgram(program)
        
        positionHandle = GLES20.glGetAttribLocation(program, "vPosition")
        mvpMatrixHandle = GLES20.glGetUniformLocation(program, "uMVPMatrix")
        colorHandle = GLES20.glGetUniformLocation(program, "vColor")
        
        GLES20.glEnableVertexAttribArray(positionHandle)
        GLES20.glVertexAttribPointer(positionHandle, 3, GLES20.GL_FLOAT, false, 0, vertexBuffer)
        
        for (asteroid in asteroids) {
            if (!asteroid.active) continue
            
            val mvpMatrix = FloatArray(16)
            val modelMatrix = FloatArray(16)
            
            Matrix.setIdentityM(modelMatrix, 0)
            Matrix.translateM(modelMatrix, 0, asteroid.x, asteroid.y, asteroid.z)
            Matrix.rotateM(modelMatrix, 0, asteroid.rotation, 0f, 0f, 1f)
            Matrix.scaleM(modelMatrix, 0, asteroid.size, asteroid.size, 1f)
            
            Matrix.multiplyMM(mvpMatrix, 0, viewMatrix, 0, modelMatrix, 0)
            Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, mvpMatrix, 0)
            
            GLES20.glUniformMatrix4fv(mvpMatrixHandle, 1, false, mvpMatrix, 0)
            
            // Asteroid color (gray-brown)
            val color = floatArrayOf(0.5f, 0.4f, 0.3f, 1.0f)
            GLES20.glUniform4fv(colorHandle, 1, color, 0)
            
            GLES20.glDrawArrays(GLES20.GL_TRIANGLE_FAN, 0, 4)
        }
        
        GLES20.glDisableVertexAttribArray(positionHandle)
    }
}

// LaserManager.kt - Player projectiles
package com.nebulastrike.spacefighter

import android.opengl.GLES20
import android.opengl.Matrix
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer

data class Laser(
    var x: Float = 0f,
    var y: Float = 0f,
    var active: Boolean = true
)

class LaserManager {
    private val lasers = mutableListOf<Laser>()
    private val speed = 0.3f
    
    private val vertices = floatArrayOf(
        -0.05f, 0.2f, 0.0f,
        -0.05f, -0.2f, 0.0f,
        0.05f, -0.2f, 0.0f,
        0.05f, 0.2f, 0.0f
    )
    
    private val vertexBuffer: FloatBuffer
    private val program: Int
    private var positionHandle = 0
    private var mvpMatrixHandle = 0
    private var colorHandle = 0
    
    init {
        vertexBuffer = ByteBuffer.allocateDirect(vertices.size * 4).order(ByteOrder.nativeOrder()).asFloatBuffer().put(vertices)
        
        val vertexShaderCode = """
            uniform mat4 uMVPMatrix;
            attribute vec4 vPosition;
            void main() {
                gl_Position = uMVPMatrix * vPosition;
            }
        """.trimIndent()
        
        val fragmentShaderCode = """
            precision mediump float;
            uniform vec4 vColor;
            void main() {
                gl_FragColor = vColor;
            }
        """.trimIndent()
        
        program = ShaderUtils.createProgram(vertexShaderCode, fragmentShaderCode)
    }
    
    fun fire(x: Float, y: Float) {
        lasers.add(Laser(x, y))
    }
    
    fun update() {
        val iterator = lasers.iterator()
        while (iterator.hasNext()) {
            val laser = iterator.next()
            if (!laser.active) {
                iterator.remove()
                continue
            }
            
            laser.y += speed
            if (laser.y > 6f) {
                iterator.remove()
            }
        }
    }
    
    fun getLasers(): List<Laser> = lasers
    
    fun draw(viewMatrix: FloatArray, projectionMatrix: FloatArray) {
        GLES20.glUseProgram(program)
        
        positionHandle = GLES20.glGetAttribLocation(program, "vPosition")
        mvpMatrixHandle = GLES20.glGetUniformLocation(program, "uMVPMatrix")
        colorHandle = GLES20.glGetUniformLocation(program, "vColor")
        
        GLES20.glEnableVertexAttribArray(positionHandle)
        GLES20.glVertexAttribPointer(positionHandle, 3, GLES20.GL_FLOAT, false, 0, vertexBuffer)
        
        for (laser in lasers) {
            if (!laser.active) continue
            
            val mvpMatrix = FloatArray(16)
            val modelMatrix = FloatArray(16)
            
            Matrix.setIdentityM(modelMatrix, 0)
            Matrix.translateM(modelMatrix, 0, laser.x, laser.y, 0f)
            
            Matrix.multiplyMM(mvpMatrix, 0, viewMatrix, 0, modelMatrix, 0)
            Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, mvpMatrix, 0)
            
            GLES20.glUniformMatrix4fv(mvpMatrixHandle, 1, false, mvpMatrix, 0)
            
            // Bright cyan laser
            val color = floatArrayOf(0.0f, 1.0f, 1.0f, 1.0f)
            GLES20.glUniform4fv(colorHandle, 1, color, 0)
            
            GLES20.glDrawArrays(GLES20.GL_TRIANGLE_FAN, 0, 4)
        }
        
        GLES20.glDisableVertexAttribArray(positionHandle)
    }
}

// ParticleSystem.kt - Explosion effects
package com.nebulastrike.spacefighter

import android.opengl.GLES20
import android.opengl.Matrix
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer

data class Particle(
    var x: Float = 0f,
    var y: Float = 0f,
    var vx: Float = 0f,
    var vy: Float = 0f,
    var life: Float = 1.0f,
    var r: Float = 1f,
    var g: Float = 1f,
    var b: Float = 1f
)

class ParticleSystem(maxParticles: Int) {
    private val particles = Array(maxParticles) { Particle() }
    private var particleCount = 0
    
    private val vertexBuffer: FloatBuffer
    private val program: Int
    private var positionHandle = 0
    private var mvpMatrixHandle = 0
    private var colorHandle = 0
    private var lifeHandle = 0
    
    init {
        val vertices = floatArrayOf(-0.1f, 0.1f, 0f, -0.1f, -0.1f, 0f, 0.1f, -0.1f, 0f, 0.1f, 0.1f, 0f)
        vertexBuffer = ByteBuffer.allocateDirect(vertices.size * 4).order(ByteOrder.nativeOrder()).asFloatBuffer().put(vertices)
        
        val vertexShaderCode = """
            uniform mat4 uMVPMatrix;
            attribute vec4 vPosition;
            varying vec2 vTexCoord;
            void main() {
                gl_Position = uMVPMatrix * vPosition;
                vTexCoord = vPosition.xy * 10.0;
            }
        """.trimIndent()
        
        val fragmentShaderCode = """
            precision mediump float;
            uniform vec4 vColor;
            uniform float uLife;
            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                float alpha = (1.0 - dist * 2.0) * uLife;
                if (alpha <= 0.0) discard;
                gl_FragColor = vec4(vColor.rgb, alpha);
            }
        """.trimIndent()
        
        program = ShaderUtils.createProgram(vertexShaderCode, fragmentShaderCode)
    }
    
    fun spawn(x: Float, y: Float, vx: Float, vy: Float, r: Float, g: Float, b: Float) {
        for (i in particles.indices) {
            if (particles[i].life <= 0) {
                particles[i].x = x
                particles[i].y = y
                particles[i].vx = vx
                particles[i].vy = vy
                particles[i].life = 1.0f
                particles[i].r = r
                particles[i].g = g
                particles[i].b = b
                break
            }
        }
    }
    
    fun update() {
        for (particle in particles) {
            if (particle.life > 0) {
                particle.x += particle.vx
                particle.y += particle.vy
                particle.life -= 0.02f
            }
        }
    }
    
    fun draw(viewMatrix: FloatArray, projectionMatrix: FloatArray) {
        GLES20.glUseProgram(program)
        
        positionHandle = GLES20.glGetAttribLocation(program, "vPosition")
        mvpMatrixHandle = GLES20.glGetUniformLocation(program, "uMVPMatrix")
        colorHandle = GLES20.glGetUniformLocation(program, "vColor")
        lifeHandle = GLES20.glGetUniformLocation(program, "uLife")
        
        GLES20.glEnableVertexAttribArray(positionHandle)
        GLES20.glVertexAttribPointer(positionHandle, 3, GLES20.GL_FLOAT, false, 0, vertexBuffer)
        
        for (particle in particles) {
            if (particle.life <= 0) continue
            
            val mvpMatrix = FloatArray(16)
            val modelMatrix = FloatArray(16)
            
            Matrix.setIdentityM(modelMatrix, 0)
            Matrix.translateM(modelMatrix, 0, particle.x, particle.y, 0f)
            Matrix.scaleM(modelMatrix, 0, particle.life, particle.life, 1f)
            
            Matrix.multiplyMM(mvpMatrix, 0, viewMatrix, 0, modelMatrix, 0)
            Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, mvpMatrix, 0)
            
            GLES20.glUniformMatrix4fv(mvpMatrixHandle, 1, false, mvpMatrix, 0)
            GLES20.glUniform1f(lifeHandle, particle.life)
            
            val color = floatArrayOf(particle.r, particle.g, particle.b, 1.0f)
            GLES20.glUniform4fv(colorHandle, 1, color, 0)
            
            GLES20.glDrawArrays(GLES20.GL_TRIANGLE_FAN, 0, 4)
        }
        
        GLES20.glDisableVertexAttribArray(positionHandle)
    }
}

// Spaceship.kt
package com.nebulastrike.spacefighter

import android.opengl.GLES20
import android.opengl.Matrix
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer

/**
 * Player spaceship with neon sci-fi aesthetic
 * Features smooth movement interpolation and banking animation
 */
class Spaceship {
    var x = 0f
        private set
    var y = -2f
        private set
    
    private var targetX = 0f
    private var targetY = -2f
    private var velocityX = 0f
    private var velocityY = 0f
    
    // Ship geometry - sleek fighter design
    private val vertices = floatArrayOf(
        // Nose cone (front)
        0.0f, 0.8f, 0.0f,
        // Main body left
        -0.3f, 0.2f, 0.0f,
        // Main body right
        0.3f, 0.2f, 0.0f,
        // Left wing tip
        -0.6f, -0.3f, 0.0f,
        // Right wing tip
        0.6f, -0.3f, 0.0f,
        // Left engine
        -0.25f, -0.6f, 0.0f,
        // Right engine
        0.25f, -0.6f, 0.0f,
        // Engine glow left
        -0.25f, -0.7f, 0.0f,
        // Engine glow right
        0.25f, -0.7f, 0.0f,
        // Center rear
        0.0f, -0.4f, 0.0f
    )
    
    // Vertex colors for neon sci-fi look
    private val colors = floatArrayOf(
        // Nose - bright cyan
        0.0f, 1.0f, 1.0f, 1.0f,
        // Body left - cyan blue
        0.0f, 0.8f, 1.0f, 1.0f,
        // Body right - cyan blue
        0.0f, 0.8f, 1.0f, 1.0f,
        // Wing tips - dark blue
        0.1f, 0.4f, 0.8f, 1.0f,
        0.1f, 0.4f, 0.8f, 1.0f,
        // Engines - orange red
        1.0f, 0.4f, 0.0f, 1.0f,
        1.0f, 0.4f, 0.0f, 1.0f,
        // Engine glow - bright yellow
        1.0f, 0.9f, 0.0f, 1.0f,
        1.0f, 0.9f, 0.0f, 1.0f,
        // Center - metallic blue
        0.2f, 0.5f, 0.8f, 1.0f
    )
    
    // Triangle indices for drawing
    private val indices = byteArrayOf(
        // Nose to body
        0, 1, 2,
        // Body to wings
        1, 3, 9,
        2, 9, 4,
        // Wings to engines
        3, 5, 9,
        4, 9, 6,
        // Engine glows
        5, 7, 9,
        6, 9, 8,
        // Center fill
        1, 9, 2
    )
    
    private val vertexBuffer: FloatBuffer = ByteBuffer
        .allocateDirect(vertices.size * 4)
        .order(ByteOrder.nativeOrder())
        .asFloatBuffer()
        .apply { put(vertices); position(0) }
    
    private val colorBuffer: FloatBuffer = ByteBuffer
        .allocateDirect(colors.size * 4)
        .order(ByteOrder.nativeOrder())
        .asFloatBuffer()
        .apply { put(colors); position(0) }
    
    private val indexBuffer: ByteBuffer = ByteBuffer
        .allocateDirect(indices.size)
        .order(ByteOrder.nativeOrder())
        .apply { put(indices); position(0) }
    
    private val program: Int
    private var positionHandle = 0
    private var colorHandle = 0
    private var mvpMatrixHandle = 0
    
    // Engine trail particles
    private val engineTrail = mutableListOf<EngineParticle>()
    
    private data class EngineParticle(
        var x: Float, var y: Float, 
        var life: Float, var size: Float
    )
    
    init {
        val vertexShaderCode = """
            uniform mat4 uMVPMatrix;
            attribute vec4 vPosition;
            attribute vec4 vColor;
            varying vec4 fColor;
            void main() {
                gl_Position = uMVPMatrix * vPosition;
                fColor = vColor;
            }
        """.trimIndent()
        
        val fragmentShaderCode = """
            precision mediump float;
            varying vec4 fColor;
            void main() {
                gl_FragColor = fColor;
            }
        """.trimIndent()
        
        program = ShaderUtils.createProgram(vertexShaderCode, fragmentShaderCode)
    }
    
    /**
     * Set target position for smooth interpolation
     */
    fun moveTowards(targetX: Float, targetY: Float) {
        this.targetX = targetX
        this.targetY = targetY
    }
    
    /**
     * Update ship position with smooth easing and banking
     */
    fun update() {
        // Smooth interpolation to target
        val dx = targetX - x
        val dy = targetY - y
        
        velocityX = dx * 0.15f
        velocityY = dy * 0.15f
        
        x += velocityX
        y += velocityY
        
        // Clamp to screen bounds
        x = x.coerceIn(-3.8f, 3.8f)
        y = y.coerceIn(-3.5f, 3f)
        
        // Update engine trail
        if (kotlin.random.Random.nextFloat() < 0.3f) {
            engineTrail.add(EngineParticle(
                x + (kotlin.random.Random.nextFloat() - 0.5f) * 0.3f,
                y - 0.6f,
                1.0f,
                kotlin.random.Random.nextFloat() * 0.2f + 0.1f
            ))
        }
        
        val iterator = engineTrail.iterator()
        while (iterator.hasNext()) {
            val particle = iterator.next()
            particle.y -= 0.05f
            particle.life -= 0.05f
            if (particle.life <= 0) iterator.remove()
        }
    }
    
    /**
     * Calculate banking angle based on horizontal velocity
     */
    private fun getBankAngle(): Float {
        return -velocityX * 25f // Bank into turn
    }
    
    /**
     * Render the spaceship with transformations
     */
    fun draw(viewMatrix: FloatArray, projectionMatrix: FloatArray) {
        // Draw engine trail first (behind ship)
        drawEngineTrail(viewMatrix, projectionMatrix)
        
        val mvpMatrix = FloatArray(16)
        val modelMatrix = FloatArray(16)
        
        Matrix.setIdentityM(modelMatrix, 0)
        Matrix.translateM(modelMatrix, 0, x, y, 0f)
        
        // Apply banking rotation
        val bankAngle = getBankAngle()
        Matrix.rotateM(modelMatrix, 0, bankAngle, 0f, 0f, 1f)
        
        // Slight forward tilt for dynamic look
        Matrix.rotateM(modelMatrix, 0, 5f, 1f, 0f, 0f)
        
        Matrix.multiplyMM(mvpMatrix, 0, viewMatrix, 0, modelMatrix, 0)
        Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, mvpMatrix, 0)
        
        GLES20.glUseProgram(program)
        
        positionHandle = GLES20.glGetAttribLocation(program, "vPosition")
        GLES20.glEnableVertexAttribArray(positionHandle)
        GLES20.glVertexAttribPointer(positionHandle, 3, GLES20.GL_FLOAT, false, 0, vertexBuffer)
        
        colorHandle = GLES20.glGetAttribLocation(program, "vColor")
        GLES20.glEnableVertexAttribArray(colorHandle)
        GLES20.glVertexAttribPointer(colorHandle, 4, GLES20.GL_FLOAT, false, 0, colorBuffer)
        
        mvpMatrixHandle = GLES20.glGetUniformLocation(program, "uMVPMatrix")
        GLES20.glUniformMatrix4fv(mvpMatrixHandle, 1, false, mvpMatrix, 0)
        
        GLES20.glDrawElements(GLES20.GL_TRIANGLES, indices.size, GLES20.GL_UNSIGNED_BYTE, indexBuffer)
        
        GLES20.glDisableVertexAttribArray(positionHandle)
        GLES20.glDisableVertexAttribArray(colorHandle)
    }
    
    private fun drawEngineTrail(viewMatrix: FloatArray, projectionMatrix: FloatArray) {
        // Simple engine trail rendering
        for (particle in engineTrail) {
            val mvpMatrix = FloatArray(16)
            val modelMatrix = FloatArray(16)
            
            Matrix.setIdentityM(modelMatrix, 0)
            Matrix.translateM(modelMatrix, 0, particle.x, particle.y, -0.1f)
            Matrix.scaleM(modelMatrix, 0, particle.size, particle.size * 2f, 1f)
            
            Matrix.multiplyMM(mvpMatrix, 0, viewMatrix, 0, modelMatrix, 0)
            Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, mvpMatrix, 0)
            
            GLES20.glUniformMatrix4fv(mvpMatrixHandle, 1, false, mvpMatrix, 0)
            
            // Trail color fades from orange to red
            val trailColor = floatArrayOf(
                1.0f, 
                0.5f * particle.life, 
                0.0f, 
                particle.life * 0.7f
            )
            val trailBuffer = ByteBuffer.allocateDirect(16).order(ByteOrder.nativeOrder()).asFloatBuffer()
            trailBuffer.put(trailColor).position(0)
            
            // Reuse position handle for trail quad
            val trailVertices = floatArrayOf(
                -0.5f, 0.5f, 0f,
                -0.5f, -0.5f, 0f,
                0.5f, -0.5f, 0f,
                0.5f, 0.5f, 0f
            )
            val trailVertexBuffer = ByteBuffer.allocateDirect(48).order(ByteOrder.nativeOrder()).asFloatBuffer()
            trailVertexBuffer.put(trailVertices).position(0)
            
            GLES20.glVertexAttribPointer(positionHandle, 3, GLES20.GL_FLOAT, false, 0, trailVertexBuffer)
            GLES20.glDrawArrays(GLES20.GL_TRIANGLE_FAN, 0, 4)
        }
    }
}

// Starfield.kt
package com.nebulastrike.spacefighter

import android.opengl.GLES20
import android.opengl.Matrix
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import kotlin.random.Random

/**
 * 3D Starfield background with parallax depth effect
 * Creates immersive space environment with varying star sizes and speeds
 */
class Starfield(private val starCount: Int) {
    
    data class Star(
        var x: Float,
        var y: Float,
        var z: Float,
        val speed: Float,
        val size: Float,
        val brightness: Float
    )
    
    private val stars = Array(starCount) {
        Star(
            x = Random.nextFloat() * 20f - 10f,
            y = Random.nextFloat() * 20f - 10f,
            z = Random.nextFloat() * 15f - 20f,
            speed = Random.nextFloat() * 0.15f + 0.05f,
            size = Random.nextFloat() * 2.5f + 0.5f,
            brightness = Random.nextFloat() * 0.5f + 0.5f
        )
    }
    
    private val vertexBuffer: FloatBuffer
    private val program: Int
    private var positionHandle = 0
    private var mvpMatrixHandle = 0
    private var pointSizeHandle = 0
    private var brightnessHandle = 0
    
    init {
        // Initialize star positions in buffer
        val starPositions = FloatArray(starCount * 3)
        stars.forEachIndexed { index, star ->
            starPositions[index * 3] = star.x
            starPositions[index * 3 + 1] = star.y
            starPositions[index * 3 + 2] = star.z
        }
        
        vertexBuffer = ByteBuffer
            .allocateDirect(starPositions.size * 4)
            .order(ByteOrder.nativeOrder())
            .asFloatBuffer()
            .apply { put(starPositions); position(0) }
        
        val vertexShaderCode = """
            uniform mat4 uMVPMatrix;
            attribute vec4 vPosition;
            varying float vDepth;
            void main() {
                vec4 pos = uMVPMatrix * vPosition;
                gl_Position = pos;
                gl_PointSize = 3.0;
                vDepth = (pos.z + 1.0) * 0.5; // Normalize depth for brightness
            }
        """.trimIndent()
        
        val fragmentShaderCode = """
            precision mediump float;
            varying float vDepth;
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                if (dist > 0.5) discard;
                
                // Soft glow effect
                float alpha = 1.0 - (dist * 2.0);
                alpha = pow(alpha, 1.5);
                
                // Depth-based brightness (closer stars are brighter)
                float brightness = 0.6 + (vDepth * 0.4);
                
                gl_FragColor = vec4(brightness, brightness, brightness + 0.2, alpha);
            }
        """.trimIndent()
        
        program = ShaderUtils.createProgram(vertexShaderCode, fragmentShaderCode)
    }
    
    /**
     * Update star positions for scrolling effect
     */
    fun update() {
        stars.forEachIndexed { index, star ->
            // Move stars toward camera
            star.z += star.speed
            
            // Reset star to back when it passes camera
            if (star.z > 5f) {
                star.z = -20f
                star.x = Random.nextFloat() * 20f - 10f
                star.y = Random.nextFloat() * 20f - 10f
            }
            
            // Update buffer
            vertexBuffer.put(index * 3, star.x)
            vertexBuffer.put(index * 3 + 1, star.y)
            vertexBuffer.put(index * 3 + 2, star.z)
        }
    }
    
    /**
     * Render starfield with depth fog effect
     */
    fun draw(mvpMatrix: FloatArray) {
        GLES20.glUseProgram(program)
        
        positionHandle = GLES20.glGetAttribLocation(program, "vPosition")
        GLES20.glEnableVertexAttribArray(positionHandle)
        GLES20.glVertexAttribPointer(positionHandle, 3, GLES20.GL_FLOAT, false, 0, vertexBuffer)
        
        mvpMatrixHandle = GLES20.glGetUniformLocation(program, "uMVPMatrix")
        GLES20.glUniformMatrix4fv(mvpMatrixHandle, 1, false, mvpMatrix, 0)
        
        // Enable point sprites
        GLES20.glEnable(GLES20.GL_BLEND)
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE)
        
        GLES20.glDrawArrays(GLES20.GL_POINTS, 0, starCount)
        
        GLES20.glDisableVertexAttribArray(positionHandle)
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA)
    }
}

// Particles.kt
package com.nebulastrike.spacefighter

import android.opengl.GLES20
import android.opengl.Matrix
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import kotlin.random.Random

/**
 * Advanced particle system for explosions, thrusters, and weapon effects
 * Supports multiple particle types with physics-based movement
 */
class ParticleSystem(private val maxParticles: Int) {
    
    enum class ParticleType {
        EXPLOSION,      // Orange/yellow fire
        SPARK,          // Blue electric
        SMOKE,          // Gray smoke trail
        ENERGY          // Cyan energy burst
    }
    
    data class Particle(
        var x: Float = 0f,
        var y: Float = 0f,
        var z: Float = 0f,
        var vx: Float = 0f,
        var vy: Float = 0f,
        var vz: Float = 0f,
        var life: Float = 1.0f,
        var maxLife: Float = 1.0f,
        var size: Float = 0.1f,
        var rotation: Float = 0f,
        var rotSpeed: Float = 0f,
        var type: ParticleType = ParticleType.EXPLOSION,
        var r: Float = 1f,
        var g: Float = 1f,
        var b: Float = 1f,
        var active: Boolean = false
    )
    
    private val particles = Array(maxParticles) { Particle() }
    private var poolIndex = 0
    
    // Quad vertices for particle billboard
    private val quadVertices = floatArrayOf(
        -0.5f, 0.5f, 0.0f,
        -0.5f, -0.5f, 0.0f,
        0.5f, -0.5f, 0.0f,
        0.5f, 0.5f, 0.0f
    )
    
    private val vertexBuffer: FloatBuffer = ByteBuffer
        .allocateDirect(quadVertices.size * 4)
        .order(ByteOrder.nativeOrder())
        .asFloatBuffer()
        .apply { put(quadVertices); position(0) }
    
    private val program: Int
    private var positionHandle = 0
    private var mvpMatrixHandle = 0
    private var colorHandle = 0
    private var lifeHandle = 0
    private var rotationHandle = 0
    
    init {
        val vertexShaderCode = """
            uniform mat4 uMVPMatrix;
            uniform float uRotation;
            attribute vec4 vPosition;
            varying vec2 vTexCoord;
            void main() {
                // Rotate particle
                float c = cos(uRotation);
                float s = sin(uRotation);
                mat2 rot = mat2(c, -s, s, c);
                vec2 pos = rot * vPosition.xy;
                
                gl_Position = uMVPMatrix * vec4(pos, vPosition.zw);
                vTexCoord = vPosition.xy + 0.5;
            }
        """.trimIndent()
        
        val fragmentShaderCode = """
            precision mediump float;
            uniform vec4 vColor;
            uniform float uLife;
            varying vec2 vTexCoord;
            
            void main() {
                // Circular particle with soft edges
                vec2 center = vec2(0.5);
                float dist = distance(vTexCoord, center);
                
                // Soft glow falloff
                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                alpha *= uLife;
                
                if (alpha < 0.01) discard;
                
                // Additive blending glow
                vec3 glow = vColor.rgb * (1.0 + (1.0 - dist) * 2.0);
                gl_FragColor = vec4(glow, alpha);
            }
        """.trimIndent()
        
        program = ShaderUtils.createProgram(vertexShaderCode, fragmentShaderCode)
    }
    
    /**
     * Spawn explosion effect at position
     */
    fun spawnExplosion(x: Float, y: Float, intensity: Float = 1.0f) {
        val count = (15 * intensity).toInt()
        repeat(count) {
            val angle = Random.nextFloat() * Math.PI * 2
            val speed = Random.nextFloat() * 0.15f * intensity + 0.05f
            spawn(
                x = x,
                y = y,
                vx = (kotlin.math.cos(angle) * speed).toFloat(),
                vy = (kotlin.math.sin(angle) * speed).toFloat(),
                life = Random.nextFloat() * 0.5f + 0.5f,
                size = Random.nextFloat() * 0.3f * intensity + 0.1f,
                type = ParticleType.EXPLOSION
            )
        }
    }
    
    /**
     * Spawn spark effects for weapon impacts
     */
    fun spawnSparks(x: Float, y: Float, direction: Float) {
        repeat(8) {
            val angle = direction + (Random.nextFloat() - 0.5f)
            val speed = Random.nextFloat() * 0.2f + 0.1f
            spawn(
                x = x,
                y = y,
                vx = (kotlin.math.cos(angle) * speed).toFloat(),
                vy = (kotlin.math.sin(angle) * speed).toFloat(),
                life = 0.4f,
                size = 0.08f,
                type = ParticleType.SPARK
            )
        }
    }
    
    /**
     * Generic spawn method
     */
    fun spawn(
        x: Float, y: Float,
        vx: Float = 0f, vy: Float = 0f, vz: Float = 0f,
        life: Float = 1.0f,
        size: Float = 0.1f,
        type: ParticleType = ParticleType.EXPLOSION
    ) {
        // Find inactive particle or overwrite oldest
        var particle: Particle? = null
        var attempts = 0
        
        while (attempts < maxParticles) {
            poolIndex = (poolIndex + 1) % maxParticles
            if (!particles[poolIndex].active) {
                particle = particles[poolIndex]
                break
            }
            attempts++
        }
        
        particle?.apply {
            this.x = x
            this.y = y
            this.z = 0f
            this.vx = vx
            this.vy = vy
            this.vz = vz
            this.life = life
            this.maxLife = life
            this.size = size
            this.rotation = Random.nextFloat() * 360f
            this.rotSpeed = Random.nextFloat() * 10f - 5f
            this.type = type
            this.active = true
            
            // Set color based on type
            when (type) {
                ParticleType.EXPLOSION -> {
                    r = 1.0f
                    g = Random.nextFloat() * 0.6f + 0.4f
                    b = 0.0f
                }
                ParticleType.SPARK -> {
                    r = 0.5f
                    g = 0.8f
                    b = 1.0f
                }
                ParticleType.SMOKE -> {
                    r = 0.5f
                    g = 0.5f
                    b = 0.5f
                }
                ParticleType.ENERGY -> {
                    r = 0.0f
                    g = 1.0f
                    b = 1.0f
                }
            }
        }
    }
    
    /**
     * Update all active particles
     */
    fun update() {
        particles.forEach { particle ->
            if (!particle.active) return@forEach
            
            // Physics update
            particle.x += particle.vx
            particle.y += particle.vy
            particle.z += particle.vz
            
            // Gravity and drag
            particle.vy -= 0.001f // Slight gravity
            particle.vx *= 0.98f  // Air resistance
            particle.vy *= 0.98f
            
            particle.rotation += particle.rotSpeed
            particle.life -= 0.016f // 60fps approximation
            
            if (particle.life <= 0) {
                particle.active = false
            }
        }
    }
    
    /**
     * Render all active particles with billboarding
     */
    fun draw(viewMatrix: FloatArray, projectionMatrix: FloatArray) {
        GLES20.glUseProgram(program)
        
        positionHandle = GLES20.glGetAttribLocation(program, "vPosition")
        mvpMatrixHandle = GLES20.glGetUniformLocation(program, "uMVPMatrix")
        colorHandle = GLES20.glGetUniformLocation(program, "vColor")
        lifeHandle = GLES20.glGetUniformLocation(program, "uLife")
        rotationHandle = GLES20.glGetUniformLocation(program, "uRotation")
        
        GLES20.glEnableVertexAttribArray(positionHandle)
        GLES20.glVertexAttribPointer(positionHandle, 3, GLES20.GL_FLOAT, false, 0, vertexBuffer)
        
        // Enable additive blending for glow effect
        GLES20.glEnable(GLES20.GL_BLEND)
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE)
        
        particles.forEach { particle ->
            if (!particle.active) return@forEach
            
            val mvpMatrix = FloatArray(16)
            val modelMatrix = FloatArray(16)
            
            Matrix.setIdentityM(modelMatrix, 0)
            Matrix.translateM(modelMatrix, 0, particle.x, particle.y, particle.z)
            
            // Scale based on life (shrink as they die)
            val currentSize = particle.size * (0.5f + particle.life * 0.5f)
            Matrix.scaleM(modelMatrix, 0, currentSize, currentSize, 1f)
            
            Matrix.multiplyMM(mvpMatrix, 0, viewMatrix, 0, modelMatrix, 0)
            Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, mvpMatrix, 0)
            
            GLES20.glUniformMatrix4fv(mvpMatrixHandle, 1, false, mvpMatrix, 0)
            GLES20.glUniform1f(rotationHandle, particle.rotation * 0.0174533f) // Degrees to radians
            GLES20.glUniform1f(lifeHandle, particle.life / particle.maxLife)
            
            val color = floatArrayOf(particle.r, particle.g, particle.b, 1.0f)
            GLES20.glUniform4fv(colorHandle, 1, color, 0)
            
            GLES20.glDrawArrays(GLES20.GL_TRIANGLE_FAN, 0, 4)
        }
        
        GLES20.glDisableVertexAttribArray(positionHandle)
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA)
    }
}

// Asteroids.kt
package com.nebulastrike.spacefighter

import android.opengl.GLES20
import android.opengl.Matrix
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import kotlin.random.Random

/**
 * Asteroid enemy manager with procedural generation
 * Features rotating asteroids with irregular shapes and collision detection
 */
class AsteroidManager {
    
    data class Asteroid(
        var x: Float = 0f,
        var y: Float = 5f,
        var z: Float = 0f,
        var size: Float = 0.5f,
        var rotation: Float = 0f,
        var rotationZ: Float = 0f,
        var rotSpeedX: Float = 0f,
        var rotSpeedY: Float = 0f,
        var rotSpeedZ: Float = 0f,
        var speed: Float = 0.05f,
        var active: Boolean = true,
        var health: Int = 1,
        val vertices: FloatArray // Procedural shape
    )
    
    private val asteroids = mutableListOf<Asteroid>()
    private val maxAsteroids = 10
    private var spawnTimer = 0f
    
    private val program: Int
    private var positionHandle = 0
    private var mvpMatrixHandle = 0
    private var colorHandle = 0
    
    init {
        val vertexShaderCode = """
            uniform mat4 uMVPMatrix;
            attribute vec4 vPosition;
            varying vec3 vPos;
            void main() {
                gl_Position = uMVPMatrix * vPosition;
                vPos = vPosition.xyz;
            }
        """.trimIndent()
        
        val fragmentShaderCode = """
            precision mediump float;
            uniform vec4 vColor;
            varying vec3 vPos;
            void main() {
                // Simple lighting based on position
                float light = 0.7 + (vPos.y * 0.3);
                vec3 finalColor = vColor.rgb * light;
                gl_FragColor = vec4(finalColor, vColor.a);
            }
        """.trimIndent()
        
        program = ShaderUtils.createProgram(vertexShaderCode, fragmentShaderCode)
    }
    
    /**
     * Generate random asteroid shape
     */
    private fun generateAsteroidShape(radius: Float, complexity: Int = 8): FloatArray {
        val vertices = mutableListOf<Float>()
        
        // Center point
        vertices.add(0f); vertices.add(0f); vertices.add(0f)
        
        // Generate irregular polygon
        for (i in 0..complexity) {
            val angle = (i.toFloat() / complexity) * Math.PI * 2
            val r = radius * (0.7f + Random.nextFloat() * 0.6f)
            val x = (kotlin.math.cos(angle) * r).toFloat()
            val y = (kotlin.math.sin(angle) * r).toFloat()
            vertices.add(x); vertices.add(y); vertices.add(0f)
        }
        
        return vertices.toFloatArray()
    }
    
    /**
     * Spawn new asteroid at random position
     */
    private fun spawnAsteroid() {
        if (asteroids.size >= maxAsteroids) return
        
        val size = Random.nextFloat() * 0.4f + 0.3f
        val vertices = generateAsteroidShape(size)
        
        val asteroid = Asteroid(
            x = Random.nextFloat() * 7f - 3.5f,
            y = 6f,
            size = size,
            rotSpeedX = Random.nextFloat() * 4f - 2f,
            rotSpeedY = Random.nextFloat() * 2f - 1f,
            rotSpeedZ = Random.nextFloat() * 3f - 1.5f,
            speed = Random.nextFloat() * 0.04f + 0.02f,
            health = if (size > 0.5f) 2 else 1,
            vertices = vertices
        )
        
        asteroids.add(asteroid)
    }
    
    /**
     * Update all asteroids and spawn logic
     */
    fun update(deltaTime: Float) {
        spawnTimer += deltaTime
        
        // Spawn logic with increasing difficulty
        val spawnRate = 0.015f.coerceAtMost(0.005f + (deltaTime * 0.001f))
        if (Random.nextFloat() < spawnRate && asteroids.size < maxAsteroids) {
            spawnAsteroid()
        }
        
        // Update existing asteroids
        val iterator = asteroids.iterator()
        while (iterator.hasNext()) {
            val asteroid = iterator.next()
            
            if (!asteroid.active) {
                iterator.remove()
                continue
            }
            
            // Movement
            asteroid.y -= asteroid.speed
            asteroid.rotation += asteroid.rotSpeedX
            asteroid.rotationZ += asteroid.rotSpeedZ
            
            // Screen bounds check
            if (asteroid.y < -6f) {
                iterator.remove()
            }
        }
    }
    
    /**
     * Damage asteroid and return true if destroyed
     */
    fun damageAsteroid(asteroid: Asteroid): Boolean {
        asteroid.health--
        if (asteroid.health <= 0) {
            asteroid.active = false
            return true
        }
        return false
    }
    
    fun getAsteroids(): List<Asteroid> = asteroids.toList()
    
    /**
     * Render all active asteroids
     */
    fun draw(viewMatrix: FloatArray, projectionMatrix: FloatArray) {
        GLES20.glUseProgram(program)
        
        positionHandle = GLES20.glGetAttribLocation(program, "vPosition")
        mvpMatrixHandle = GLES20.glGetUniformLocation(program, "uMVPMatrix")
        colorHandle = GLES20.glGetUniformLocation(program, "vColor")
        
        asteroids.forEach { asteroid ->
            if (!asteroid.active) return@forEach
            
            // Create vertex buffer for this asteroid
            val vertexBuffer = ByteBuffer
                .allocateDirect(asteroid.vertices.size * 4)
                .order(ByteOrder.nativeOrder())
                .asFloatBuffer()
                .apply { put(asteroid.vertices); position(0) }
            
            GLES20.glEnableVertexAttribArray(positionHandle)
            GLES20.glVertexAttribPointer(positionHandle, 3, GLES20.GL_FLOAT, false, 0, vertexBuffer)
            
            val mvpMatrix = FloatArray(16)
            val modelMatrix = FloatArray(16)
            
            Matrix.setIdentityM(modelMatrix, 0)
            Matrix.translateM(modelMatrix, 0, asteroid.x, asteroid.y, asteroid.z)
            Matrix.rotateM(modelMatrix, 0, asteroid.rotation, 0f, 0f, 1f)
            Matrix.rotateM(modelMatrix, 0, asteroid.rotationZ * 0.5f, 0f, 1f, 0f)
            
            Matrix.multiplyMM(mvpMatrix, 0, viewMatrix, 0, modelMatrix, 0)
            Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, mvpMatrix, 0)
            
            GLES20.glUniformMatrix4fv(mvpMatrixHandle, 1, false, mvpMatrix, 0)
            
            // Color based on size/health
            val color = when {
                asteroid.size > 0.6f -> floatArrayOf(0.6f, 0.5f, 0.4f, 1.0f) // Large - brown
                asteroid.size > 0.45f -> floatArrayOf(0.5f, 0.5f, 0.5f, 1.0f) // Medium - gray
                else -> floatArrayOf(0.7f, 0.6f, 0.5f, 1.0f) // Small - light brown
            }
            GLES20.glUniform4fv(colorHandle, 1, color, 0)
            
            // Draw as triangle fan from center
            GLES20.glDrawArrays(GLES20.GL_TRIANGLE_FAN, 0, asteroid.vertices.size / 3)
            
            GLES20.glDisableVertexAttribArray(positionHandle)
        }
    }
    
    /**
     * Clear all asteroids (for game reset)
     */
    fun clear() {
        asteroids.clear()
    }
}

