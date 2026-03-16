// LevelSelectActivity.kt
package com.nebulastrike.spacefighter.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.GridLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.nebulastrike.spacefighter.R
import com.nebulastrike.spacefighter.data.GameStateManager
import kotlinx.coroutines.launch

/**
 * Level selection screen with purchase requirements
 * Shows lock icons for premium levels
 */
class LevelSelectActivity : AppCompatActivity() {
    
    private lateinit var gameStateManager: GameStateManager
    private lateinit var levelGrid: GridLayout
    private lateinit var coinText: TextView
    private lateinit var shopButton: Button
    
    private val totalLevels = 9
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_level_select)
        
        gameStateManager = GameStateManager(this)
        
        levelGrid = findViewById(R.id.levelGrid)
        coinText = findViewById(R.id.coinText)
        shopButton = findViewById(R.id.shopButton)
        
        shopButton.setOnClickListener {
            startActivity(Intent(this, ShopActivity::class.java))
        }
        
        lifecycleScope.launch {
            gameStateManager.coins.collect { coins ->
                coinText.text = "💰 $coins"
            }
        }
        
        lifecycleScope.launch {
            gameStateManager.unlockedLevels.collect {
                setupLevelButtons()
            }
        }
    }
    
    private fun setupLevelButtons() {
        levelGrid.removeAllViews()
        
        for (level in 1..totalLevels) {
            val button = Button(this).apply {
                text = when {
                    gameStateManager.isLevelLocked(level) -> "🔒 $level"
                    else -> level.toString()
                }
                
                isEnabled = !gameStateManager.isLevelLocked(level)
                
                setOnClickListener {
                    if (gameStateManager.isLevelLocked(level)) {
                        showUnlockDialog(level)
                    } else {
                        startLevel(level)
                    }
                }
            }
            
            val params = GridLayout.LayoutParams().apply {
                width = 0
                height = GridLayout.LayoutParams.WRAP_CONTENT
                columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1f)
                setMargins(8, 8, 8, 8)
            }
            
            levelGrid.addView(button, params)
        }
    }
    
    private fun showUnlockDialog(level: Int) {
        val cost = gameStateManager.getLevelUnlockCost(level)
        
        AlertDialog.Builder(this)
            .setTitle("Level $level Locked")
            .setMessage("Unlock this level for $cost coins or purchase the Level Pack!")
            .setPositiveButton("Unlock ($cost coins)") { _, _ ->
                if (gameStateManager.unlockLevel(level)) {
                    Toast.makeText(this, "Level unlocked!", Toast.LENGTH_SHORT).show()
                    setupLevelButtons()
                } else {
                    Toast.makeText(this, "Not enough coins!", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Go to Shop") { _, _ ->
                startActivity(Intent(this, ShopActivity::class.java))
            }
            .setNeutralButton("Cancel", null)
            .show()
    }
    
    private fun startLevel(level: Int) {
        gameStateManager.saveCurrentLevel(level)
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("LEVEL", level)
        }
        startActivity(intent)
    }
}
