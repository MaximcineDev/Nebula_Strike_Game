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
