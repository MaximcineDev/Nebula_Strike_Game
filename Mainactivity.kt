// MainActivity.kt - Entry point
package com.nebulastrike.spacefighter

import android.app.Activity
import android.opengl.GLSurfaceView
import android.os.Bundle
import android.view.MotionEvent
import android.view.WindowManager

class MainActivity : Activity() {
    private lateinit var glSurfaceView: GameGLSurfaceView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        glSurfaceView = GameGLSurfaceView(this)
        setContentView(glSurfaceView)
    }
    
    override fun onPause() {
        super.onPause()
        glSurfaceView.onPause()
    }
    
    override fun onResume() {
        super.onResume()
        glSurfaceView.onResume()
    }
}

// GameGLSurfaceView.kt - OpenGL Surface
package com.scifigame.spacefighter

import android.content.Context
import android.opengl.GLSurfaceView
import android.view.MotionEvent

class GameGLSurfaceView(context: Context) : GLSurfaceView(context) {
    private val renderer: GameRenderer
    
    init {
        setEGLContextClientVersion(2)
        renderer = GameRenderer(context)
        setRenderer(renderer)
        renderMode = GLSurfaceView.RENDERMODE_CONTINUOUSLY
    }
    
    override fun onTouchEvent(event: MotionEvent): Boolean {
        renderer.handleTouch(event)
        return true
    }
}

// GameRenderer.kt - Main Renderer
package com.scifigame.spacefighter

import android.content.Context
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.opengl.Matrix
import android.view.MotionEvent
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.random.Random

class GameRenderer(private val context: Context) : GLSurfaceView.Renderer {
    private val mvpMatrix = FloatArray(16)
    private val projectionMatrix = FloatArray(16)
    private val viewMatrix = FloatArray(16)
    private val modelMatrix = FloatArray(16)
    
    private lateinit var ship: Spaceship
    private lateinit var starfield: Starfield
    private lateinit var asteroidManager: AsteroidManager
    private lateinit var particleSystem: ParticleSystem
    private lateinit var laserManager: LaserManager
    
    private var screenWidth = 0f
    private var screenHeight = 0f
    private var gameTime = 0f
    
    // Touch input
    private var touchX = 0f
    private var touchY = 0f
    private var isTouching = false
    
    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
        GLES20.glClearColor(0.02f, 0.02f, 0.08f, 1.0f)
        GLES20.glEnable(GLES20.GL_DEPTH_TEST)
        GLES20.glEnable(GLES20.GL_BLEND)
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA)
        
        ship = Spaceship()
        starfield = Starfield(200)
        asteroidManager = AsteroidManager()
        particleSystem = ParticleSystem(1000)
        laserManager = LaserManager()
    }
    
    override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
        GLES20.glViewport(0, 0, width, height)
        screenWidth = width.toFloat()
        screenHeight = height.toFloat()
        
        val ratio = width.toFloat() / height.toFloat()
        Matrix.frustumM(projectionMatrix, 0, -ratio, ratio, -1f, 1f, 3f, 50f)
    }
    
    override fun onDrawFrame(gl: GL10?) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT or GLES20.GL_DEPTH_BUFFER_BIT)
        
        // Set up view matrix (camera)
        Matrix.setLookAtM(viewMatrix, 0, 0f, 0f, 10f, 0f, 0f, 0f, 0f, 1f, 0f)
        
        gameTime += 0.016f
        
        updateGame()
        renderGame()
    }
    
    private fun updateGame() {
        // Update ship position based on touch
        if (isTouching) {
            val targetX = (touchX / screenWidth) * 8f - 4f
            val targetY = -((touchY / screenHeight) * 6f - 3f)
            ship.moveTowards(targetX, targetY)
        }
        
        ship.update()
        starfield.update()
        asteroidManager.update(gameTime)
        particleSystem.update()
        laserManager.update()
        
        // Auto-fire lasers
        if (gameTime % 0.3f < 0.016f) {
            laserManager.fire(ship.x, ship.y + 0.5f)
        }
        
        // Check collisions
        checkCollisions()
    }
    
    private fun checkCollisions() {
        val lasers = laserManager.getLasers()
        val asteroids = asteroidManager.getAsteroids()
        
        for (laser in lasers) {
            if (!laser.active) continue
            for (asteroid in asteroids) {
                if (!asteroid.active) continue
                if (distance(laser.x, laser.y, asteroid.x, asteroid.y) < asteroid.size + 0.2f) {
                    laser.active = false
                    asteroid.active = false
                    // Explosion effect
                    for (i in 0 until 15) {
                        particleSystem.spawn(
                            asteroid.x, asteroid.y,
                            Random.nextFloat() * 0.4f - 0.2f,
                            Random.nextFloat() * 0.4f - 0.2f,
                            1.0f, 0.5f, 0.2f
                        )
                    }
                    break
                }
            }
        }
    }
    
    private fun distance(x1: Float, y1: Float, x2: Float, y2: Float): Float {
        return kotlin.math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2))
    }
    
    private fun renderGame() {
        // Render starfield (background)
        Matrix.setIdentityM(modelMatrix, 0)
        Matrix.multiplyMM(mvpMatrix, 0, viewMatrix, 0, modelMatrix, 0)
        Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, mvpMatrix, 0)
        starfield.draw(mvpMatrix)
        
        // Render ship
        ship.draw(viewMatrix, projectionMatrix)
        
        // Render asteroids
        asteroidManager.draw(viewMatrix, projectionMatrix)
        
        // Render lasers
        laserManager.draw(viewMatrix, projectionMatrix)
        
        // Render particles
        particleSystem.draw(viewMatrix, projectionMatrix)
    }
    
    fun handleTouch(event: MotionEvent) {
        when (event.action) {
            MotionEvent.ACTION_DOWN, MotionEvent.ACTION_MOVE -> {
                touchX = event.x
                touchY = event.y
                isTouching = true
            }
            MotionEvent.ACTION_UP -> {
                isTouching = false
            }
        }
    }
}

// ShaderUtils.kt - Shader compilation utilities
package com.scifigame.spacefighter

import android.opengl.GLES20
import android.util.Log

object ShaderUtils {
    fun loadShader(type: Int, shaderCode: String): Int {
        val shader = GLES20.glCreateShader(type)
        GLES20.glShaderSource(shader, shaderCode)
        GLES20.glCompileShader(shader)
        
        val compiled = IntArray(1)
        GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, compiled, 0)
        if (compiled[0] == 0) {
            Log.e("Shader", "Compilation error: ${GLES20.glGetShaderInfoLog(shader)}")
            GLES20.glDeleteShader(shader)
            return 0
        }
        return shader
    }
    
    fun createProgram(vertexShaderCode: String, fragmentShaderCode: String): Int {
        val vertexShader = loadShader(GLES20.GL_VERTEX_SHADER, vertexShaderCode)
        val fragmentShader = loadShader(GLES20.GL_FRAGMENT_SHADER, fragmentShaderCode)
        
        val program = GLES20.glCreateProgram()
        GLES20.glAttachShader(program, vertexShader)
        GLES20.glAttachShader(program, fragmentShader)
        GLES20.glLinkProgram(program)
        
        return program
    }
}

// Spaceship.kt - Player ship
package com.scifigame.spacefighter

import android.opengl.GLES20
import android.opengl.Matrix
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer

class Spaceship {
    var x = 0f
    var y = -2f
    private var targetX = 0f
    private var targetY = -2f
    
    private val vertices = floatArrayOf(
        // Front
        0.0f, 0.6f, 0.0f,
        // Left wing
        -0.4f, -0.3f, 0.0f,
        // Right wing
        0.4f, -0.3f, 0.0f,
        // Engine left
        -0.2f, -0.5f, 0.0f,
        // Engine right
        0.2f, -0.5f, 0.0f,
        // Center bottom
        0.0f, -0.3f, 0.0f
    )
    
    private val colors = floatArrayOf(
        0.0f, 0.8f, 1.0f, 1.0f,  // Cyan front
        0.2f, 0.4f, 0.8f, 1.0f,  // Blue left
        0.2f, 0.4f, 0.8f, 1.0f,  // Blue right
        1.0f, 0.4f, 0.0f, 1.0f,  // Orange engine
        1.0f, 0.4f, 0.0f, 1.0f,  // Orange engine
        0.1f, 0.3f, 0.6f, 1.0f   // Dark center
    )
    
    private val indices = byteArrayOf(0, 1, 5, 0, 5, 2, 1, 3, 5, 5, 4, 2)
    
    private val vertexBuffer: FloatBuffer
    private val colorBuffer: FloatBuffer
    private val indexBuffer = ByteBuffer.allocateDirect(indices.size).order(ByteOrder.nativeOrder()).put(indices)
    
    private val program: Int
    private var positionHandle = 0
    private var colorHandle = 0
    private var mvpMatrixHandle = 0
    
    init {
        vertexBuffer = ByteBuffer.allocateDirect(vertices.size * 4).order(ByteOrder.nativeOrder()).asFloatBuffer().put(vertices)
        colorBuffer = ByteBuffer.allocateDirect(colors.size * 4).order(ByteOrder.nativeOrder()).asFloatBuffer().put(colors)
        indexBuffer.position(0)
        
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
    
    fun moveTowards(tx: Float, ty: Float) {
        targetX = tx
        targetY = ty
    }
    
    fun update() {
        x += (targetX - x) * 0.1f
        y += (targetY - y) * 0.1f
        
        // Clamp to screen bounds
        x = x.coerceIn(-3.5f, 3.5f)
        y = y.coerceIn(-3f, 2f)
    }
    
    fun draw(viewMatrix: FloatArray, projectionMatrix: FloatArray) {
        val mvpMatrix = FloatArray(16)
        val modelMatrix = FloatArray(16)
        
        Matrix.setIdentityM(modelMatrix, 0)
        Matrix.translateM(modelMatrix, 0, x, y, 0f)
        
        // Slight tilt based on movement
        val tilt = (targetX - x) * 0.5f
        Matrix.rotateM(modelMatrix, 0, tilt * 10f, 0f, 0f, 1f)
        
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
}

// Starfield.kt - Background stars
package com.scifigame.spacefighter

import android.opengl.GLES20
import android.opengl.Matrix
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import kotlin.random.Random

class Starfield(count: Int) {
    private val stars = FloatArray(count * 3)
    private val speeds = FloatArray(count)
    private val sizes = FloatArray(count)
    
    private val vertexBuffer: FloatBuffer
    private val program: Int
    private var positionHandle = 0
    private var mvpMatrixHandle = 0
    private var colorHandle = 0
    private var pointSizeHandle = 0
    
    init {
        for (i in 0 until count) {
            stars[i * 3] = Random.nextFloat() * 20f - 10f
            stars[i * 3 + 1] = Random.nextFloat() * 20f - 10f
            stars[i * 3 + 2] = Random.nextFloat() * 10f - 15f
            speeds[i] = Random.nextFloat() * 0.1f + 0.02f
            sizes[i] = Random.nextFloat() * 3f + 1f
        }
        
        vertexBuffer = ByteBuffer.allocateDirect(stars.size * 4).order(ByteOrder.nativeOrder()).asFloatBuffer().put(stars)
        
        val vertexShaderCode = """
            uniform mat4 uMVPMatrix;
            attribute vec4 vPosition;
            void main() {
                gl_Position = uMVPMatrix * vPosition;
                gl_PointSize = 2.0;
            }
        """.trimIndent()
        
        val fragmentShaderCode = """
            precision mediump float;
            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                if (dist > 0.5) discard;
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0 - dist * 2.0);
            }
        """.trimIndent()
        
        program = ShaderUtils.createProgram(vertexShaderCode, fragmentShaderCode)
    }
    
    fun update() {
        for (i in speeds.indices) {
            stars[i * 3 + 2] += speeds[i]
            if (stars[i * 3 + 2] > 5f) {
                stars[i * 3 + 2] = -15f
                stars[i * 3] = Random.nextFloat() * 20f - 10f
                stars[i * 3 + 1] = Random.nextFloat() * 20f - 10f
            }
        }
        vertexBuffer.put(stars).position(0)
    }
    
    fun draw(mvpMatrix: FloatArray) {
        GLES20.glUseProgram(program)
        
        positionHandle = GLES20.glGetAttribLocation(program, "vPosition")
        GLES20.glEnableVertexAttribArray(positionHandle)
        GLES20.glVertexAttribPointer(positionHandle, 3, GLES20.GL_FLOAT, false, 0, vertexBuffer)
        
        mvpMatrixHandle = GLES20.glGetUniformLocation(program, "uMVPMatrix")
        GLES20.glUniformMatrix4fv(mvpMatrixHandle, 1, false, mvpMatrix, 0)
        
        GLES20.glDrawArrays(GLES20.GL_POINTS, 0, speeds.size)
        
        GLES20.glDisableVertexAttribArray(positionHandle)
    }
}

// AsteroidManager.kt - Enemy asteroids
package com.scifigame.spacefighter

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
package com.scifigame.spacefighter

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
package com.scifigame.spacefighter

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
