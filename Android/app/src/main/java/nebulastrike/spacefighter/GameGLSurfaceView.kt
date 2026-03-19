// GameGLSurfaceView.kt - Fixed Version
package com.nebulastrike.spacefighter

import android.content.Context
import android.opengl.GLSurfaceView
import android.view.MotionEvent
import javax.microedition.khronos.egl.EGL10
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.egl.EGLContext
import javax.microedition.khronos.egl.EGLDisplay

class GameGLSurfaceView(context: Context) : GLSurfaceView(context) {
    private val renderer: GameRenderer
    
    init {
        // Set EGL context version 2.0
        setEGLContextClientVersion(2)
        
        // Set EGL config chooser with RGBA 8888, depth 16, stencil 0
        setEGLConfigChooser(8, 8, 8, 8, 16, 0)
        
        // Create renderer
        renderer = GameRenderer(context)
        setRenderer(renderer)
        
        // Render continuously
        renderMode = GLSurfaceView.RENDERMODE_CONTINUOUSLY
        
        // Preserve EGL context on pause
        preserveEGLContextOnPause = true
    }
    
    override fun onTouchEvent(event: MotionEvent): Boolean {
        renderer.handleTouch(event)
        return true
    }
    
    // Custom EGL context factory for better compatibility
    private fun setupEGLContextFactory() {
        setEGLContextFactory(object : EGLContextFactory {
            override fun createContext(
                egl: EGL10,
                display: EGLDisplay,
                eglConfig: EGLConfig
            ): EGLContext {
                val attribList = intArrayOf(
                    EGL_CONTEXT_CLIENT_VERSION, 2,
                    EGL10.EGL_NONE
                )
                return egl.eglCreateContext(
                    display,
                    eglConfig,
                    EGL10.EGL_NO_CONTEXT,
                    attribList
                )
            }
            
            override fun destroyContext(
                egl: EGL10,
                display: EGLDisplay,
                context: EGLContext
            ) {
                egl.eglDestroyContext(display, context)
            }
        })
    }
    
    companion object {
        private const val EGL_CONTEXT_CLIENT_VERSION = 0x3098
    }
}
