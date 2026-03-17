// MainActivity.kt (Updated)
package com.nebulastrike.spacefighter

import android.app.Activity
import android.content.Intent
import android.opengl.GLSurfaceView
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.lifecycle.lifecycleScope
import com.nebulastrike.spacefighter.billing.BillingManager
import com.nebulastrike.spacefighter.data.GameStateManager
import com.nebulastrike.spacefighter.ui.ShopActivity
import kotlinx.coroutines.launch

class MainActivity : Activity() {
    private lateinit var glSurfaceView: GameGLSurfaceView
    private lateinit var gameStateManager: GameStateManager
    private lateinit var billingManager: BillingManager
    
    // UI Elements
    private lateinit var coinText: TextView
    private lateinit var shieldButton: Button
    private lateinit var laserButton: Button
    private lateinit var shopButton: Button
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        gameStateManager = GameStateManager(this)
        billingManager = BillingManager(this)
        
        // Check if coming from level select
        val level = intent.getIntExtra("LEVEL", 1)
        
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        setContentView(R.layout.activity_main_game)
        
        setupGameView(level)
        setupUI()
        observeGameState()
    }
    
    private fun setupGameView(level: Int) {
        glSurfaceView = findViewById(R.id.glSurfaceView)
        val renderer = GameRenderer(this, level, gameStateManager)
        glSurfaceView.setRenderer(renderer)
        
        // Pass touch events to renderer
        glSurfaceView.setOnTouchListener { _, event ->
            renderer.handleTouch(event)
            true
        }
    }
    
    private fun setupUI() {
        coinText = findViewById(R.id.coinText)
        shieldButton = findViewById(R.id.shieldButton)
        laserButton = findViewById(R.id.laserButton)
        shopButton = findViewById(R.id.shopButton)
        
        shieldButton.setOnClickListener {
            if (gameStateManager.useShield()) {
                glSurfaceView.renderer.activateShield()
                Toast.makeText(this, "Shield activated!", Toast.LENGTH_SHORT).show()
            } else {
                promptBuyShields()
            }
        }
        
        laserButton.setOnClickListener {
            if (gameStateManager.useLaserUpgrade()) {
                glSurfaceView.renderer.activateLaserUpgrade()
                Toast.makeText(this, "Laser upgraded!", Toast.LENGTH_SHORT).show()
            } else {
                promptBuyLasers()
            }
        }
        
        shopButton.setOnClickListener {
            startActivity(Intent(this, ShopActivity::class.java))
        }
        
        updatePowerUpButtons()
    }
    
    private fun observeGameState() {
        lifecycleScope.launch {
            gameStateManager.coins.collect { coins ->
                coinText.text = "💰 $coins"
            }
        }
        
        lifecycleScope.launch {
            gameStateManager.shieldCount.collect { count ->
                shieldButton.text = "🛡️ $count"
                shieldButton.alpha = if (count > 0) 1.0f else 0.5f
            }
        }
        
        lifecycleScope.launch {
            gameStateManager.laserUpgradeCount.collect { count ->
                laserButton.text = "⚡ $count"
                laserButton.alpha = if (count > 0) 1.0f else 0.5f
            }
        }
    }
    
    private fun promptBuyShields() {
        AlertDialog.Builder(this)
            .setTitle("No Shields!")
            .setMessage("Buy shields from the shop?")
            .setPositiveButton("Go to Shop") { _, _ ->
                startActivity(Intent(this, ShopActivity::class.java))
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun promptBuyLasers() {
        AlertDialog.Builder(this)
            .setTitle("No Laser Upgrades!")
            .setMessage("Buy laser upgrades from the shop?")
            .setPositiveButton("Go to Shop") { _, _ ->
                startActivity(Intent(this, ShopActivity::class.java))
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun updatePowerUpButtons() {
        // Initial update
        shieldButton.text = "🛡️ ${gameStateManager.shieldCount.value}"
        laserButton.text = "⚡ ${gameStateManager.laserUpgradeCount.value}"
    }
    
    override fun onPause() {
        super.onPause()
        glSurfaceView.onPause()
    }
    
    override fun onResume() {
        super.onResume()
        glSurfaceView.onResume()
        // Refresh purchase state
        billingManager.queryPurchases()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        billingManager.disconnect()
    }
}
