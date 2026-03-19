// GameGLSurfaceView.kt
package com.nebulastrike.spacefighter

import android.content.Context
import android.opengl.GLSurfaceView
import android.view.MotionEvent
import com.nebulastrike.spacefighter.data.GameStateManager

class GameGLSurfaceView(
    context: Context,
    private val level: Int = 1,
    private val gameState: GameStateManager? = null
) : GLSurfaceView(context) {
    
    // Make renderer accessible within the class
    val renderer: GameRenderer
    
    init {
        setEGLContextClientVersion(2)
        setEGLConfigChooser(8, 8, 8, 8, 16, 0)
        
        val safeGameState = gameState ?: GameStateManager(context)
        renderer = GameRenderer(context, level, safeGameState)
        
        setRenderer(renderer)
        renderMode = GLSurfaceView.RENDERMODE_CONTINUOUSLY
        preserveEGLContextOnPause = true
    }
    
    override fun onTouchEvent(event: MotionEvent): Boolean {
        renderer.handleTouch(event)
        return true
    }
    
    // Expose renderer methods - THESE MUST BE INSIDE THE CLASS
    fun isGameOver(): Boolean = renderer.getIsGameOver()
    fun isLevelComplete(): Boolean = renderer.isLevelComplete()
    fun getBossHealth(): Int = renderer.getBossHealth()
    fun getBossMaxHealth(): Int = renderer.getBossMaxHealth()
    fun canContinue(): Boolean = renderer.canContinue()

    fun continueGame() {
        renderer.ship.health = renderer.ship.maxHealth
        renderer.resetGameOver()
        renderer.setContinueUsed()
    }
}
