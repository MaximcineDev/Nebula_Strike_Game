// GameRenderer.kt - Main Renderer
package com.nebulastrike.spacefighter

import android.content.Context
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.opengl.Matrix
import android.view.MotionEvent
import com.nebulastrike.spacefighter.data.GameStateManager
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.math.sqrt

class GameRenderer(
    private val context: Context,
    private val level: Int,
    private val gameState: GameStateManager
) : GLSurfaceView.Renderer {

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

    // difficulty
    private var difficulty = 1f
    private var bossSpawned = false

    // boss health
    private var bossHealth = 0
    private var bossMaxHealth = 0
    private var levelComplete = false

    // Game Over
    var isGameOver = false
    private var continueUsed = false

    // Touch
    private var touchX = 0f
    private var touchY = 0f
    private var isTouching = false

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {

        GLES20.glClearColor(0.02f, 0.02f, 0.08f, 1.0f)
        GLES20.glEnable(GLES20.GL_DEPTH_TEST)
        GLES20.glEnable(GLES20.GL_BLEND)

        difficulty = 1f + (level * 0.25f)

        ship = Spaceship()
        starfield = Starfield(200)
        asteroidManager = AsteroidManager()
        particleSystem = ParticleSystem(1000)
        laserManager = LaserManager()
    }

    override fun onSurfaceChanged(
        gl: GL10?,
        width: Int,
        height: Int
    ) {

        GLES20.glViewport(0, 0, width, height)

        screenWidth = width.toFloat()
        screenHeight = height.toFloat()

        val ratio = width.toFloat() / height.toFloat()

        Matrix.frustumM(
            projectionMatrix,
            0,
            -ratio,
            ratio,
            -1f,
            1f,
            3f,
            50f
        )
    }

    override fun onDrawFrame(gl: GL10?) {

        GLES20.glClear(
            GLES20.GL_COLOR_BUFFER_BIT or
                    GLES20.GL_DEPTH_BUFFER_BIT
        )

        Matrix.setLookAtM(
            viewMatrix,
            0,
            0f,
            0f,
            10f,
            0f,
            0f,
            0f,
            0f,
            1f,
            0f
        )

        gameTime += 0.016f

        updateGame()
        renderGame()
    }

    private fun updateGame() {

        if (isTouching) {

            val targetX =
                (touchX / screenWidth) * 8f - 4f

            val targetY =
                -((touchY / screenHeight) * 6f - 3f)

            ship.moveTowards(
                targetX,
                targetY
            )
        }

        if (ship.health <= 0 && !isGameOver) {
            isGameOver = true
        }

        ship.update()
        starfield.update()

        // harder levels
        asteroidManager.update(
            gameTime * difficulty
        )

        particleSystem.update()
        laserManager.update()

        // auto fire
        if (gameTime % 0.3f < 0.016f) {

            laserManager.fire(
                ship.x,
                ship.y + 0.5f
            )
        }

        // spawn boss after level 10
        if (
            level >= 10 &&
            !bossSpawned &&
            gameTime > 10f
        ) {

            asteroidManager.spawnBoss()
            bossMaxHealth = 100 + level * 20
            bossHealth = bossMaxHealth
        }

        checkCollisions()
    }

    private fun checkCollisions() {

        val lasers =
            laserManager.getLasers()

        val asteroids =
            asteroidManager.getAsteroids()

        for (laser in lasers) {

            if (!laser.active) continue

            for (asteroid in asteroids) {

                if (!asteroid.active) continue

                if (
                    distance(
                        laser.x,
                        laser.y,
                        asteroid.x,
                        asteroid.y
                    ) <
                    asteroid.size + 0.2f
                ) {

                    laser.active = false

                    if (asteroid.isBoss) {

                        bossHealth -= 5

                        if (bossHealth <= 0) {

                            asteroid.active = false
                            levelComplete = true

                            gameState.addCoins(100 + level * 10)
                        }

                   } else if (asteroidManager.damageAsteroid(asteroid)) {

                        particleSystem.spawnExplosion(
                            asteroid.x,
                            asteroid.y,
                            asteroid.size
                        )

                        // give coins on destroy
                        gameState.addCoins(5)

                    } else {

                        particleSystem.spawnSparks(
                            laser.x,
                            laser.y,
                            Math.PI.toFloat() / 2
                        )
                    }

                    break
                }
            }
        }
    }

    private fun distance(
        x1: Float,
        y1: Float,
        x2: Float,
        y2: Float
    ): Float {

        return sqrt(
            (x1 - x2) *
                    (x1 - x2) +
                    (y1 - y2) *
                    (y1 - y2)
        )
    }

    private fun renderGame() {

        Matrix.setIdentityM(
            modelMatrix,
            0
        )

        Matrix.multiplyMM(
            mvpMatrix,
            0,
            viewMatrix,
            0,
            modelMatrix,
            0
        )

        Matrix.multiplyMM(
            mvpMatrix,
            0,
            projectionMatrix,
            0,
            mvpMatrix,
            0
        )

        starfield.draw(mvpMatrix)

        ship.draw(
            viewMatrix,
            projectionMatrix
        )

        asteroidManager.draw(
            viewMatrix,
            projectionMatrix
        )

        laserManager.draw(
            viewMatrix,
            projectionMatrix
        )

        particleSystem.draw(
            viewMatrix,
            projectionMatrix
        )
    }

    fun handleTouch(
        event: MotionEvent
    ) {

        when (event.action) {

            MotionEvent.ACTION_DOWN,
            MotionEvent.ACTION_MOVE -> {

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

fun getBossHealth(): Int = bossHealth
fun getBossMaxHealth(): Int = bossMaxHealth
fun isLevelComplete(): Boolean = levelComplete

fun getIsGameOver(): Boolean = isGameOver
fun setContinueUsed() { continueUsed = true }
fun canContinue(): Boolean = !continueUsed
