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
