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
