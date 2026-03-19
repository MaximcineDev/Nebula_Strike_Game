// GameGLSurfaceView.kt - Fixed Version
package com.nebulastrike.spacefighter

import android.content.Context
import android.opengl.GLSurfaceView
import android.view.MotionEvent
import com.nebulastrike.spacefighter.data.GameStateManager

class GameGLSurfaceView(
    context: Context,
    private val level: Int = 1,  // Default level
    private val gameState: GameStateManager? = null  // Game state
) : GLSurfaceView(context) {
    
    private val renderer: GameRenderer
    
    init {
        // Set EGL context version 2.0
        setEGLContextClientVersion(2)
        
        // Set EGL config chooser
        setEGLConfigChooser(8, 8, 8, 8, 16, 0)
        
        // Create renderer with all required parameters
        val safeGameState = gameState ?: GameStateManager(context)  // Create default if null
        renderer = GameRenderer(context, level, safeGameState)
        
        setRenderer(renderer)
        renderMode = GLSurfaceView.RENDERMODE_CONTINUOUSLY
        
        // Preserve EGL context on pause
        preserveEGLContextOnPause = true
    }
    
    override fun onTouchEvent(event: MotionEvent): Boolean {
        renderer.handleTouch(event)
        return true
    }
    
    // Expose renderer methods for Activity access
    fun isGameOver(): Boolean = renderer.getIsGameOver()
    fun isLevelComplete(): Boolean = renderer.isLevelComplete()
    fun getBossHealth(): Int = renderer.getBossHealth()
    fun getBossMaxHealth(): Int = renderer.getBossMaxHealth()
}
