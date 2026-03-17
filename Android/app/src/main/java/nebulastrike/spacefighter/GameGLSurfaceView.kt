// GameGLSurfaceView.kt - OpenGL Surface
package com.nebulastrike.spacefighter

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
