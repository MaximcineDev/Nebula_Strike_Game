// Spaceship.kt - Player ship
package com.nebulastrike.spacefighter

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
