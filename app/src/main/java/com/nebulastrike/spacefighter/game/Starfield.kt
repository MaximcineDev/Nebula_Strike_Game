// Starfield.kt - Background stars
package com.nebulastrike.spacefighter

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
