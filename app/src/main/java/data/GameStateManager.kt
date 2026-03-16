// GameStateManager.kt
package com.nebulastrike.spacefighter.data

import android.content.Context
import android.content.SharedPreferences
import com.nebulastrike.spacefighter.billing.BillingManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * Manages game progress, currencies, and purchased items
 * Handles level locking based on purchases
 */
class GameStateManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "game_state", 
        Context.MODE_PRIVATE
    )
    
    // Currency
    private val _coins = MutableStateFlow(loadCoins())
    val coins: StateFlow<Int> = _coins
    
    // Player stats
    private val _highScore = MutableStateFlow(loadHighScore())
    val highScore: StateFlow<Int> = _highScore
    
    private val _currentLevel = MutableStateFlow(loadCurrentLevel())
    val currentLevel: StateFlow<Int> = _currentLevel
    
    // Purchased items
    private val _ownedShips = MutableStateFlow(loadOwnedShips())
    val ownedShips: StateFlow<Set<String>> = _ownedShips
    
    private val _selectedShip = MutableStateFlow(loadSelectedShip())
    val selectedShip: StateFlow<String> = _selectedShip
    
    private val _unlockedLevels = MutableStateFlow(loadUnlockedLevels())
    val unlockedLevels: StateFlow<Set<Int>> = _unlockedLevels
    
    // Power-ups inventory
    private val _shieldCount = MutableStateFlow(loadInventory("shields"))
    val shieldCount: StateFlow<Int> = _shieldCount
    
    private val _laserUpgradeCount = MutableStateFlow(loadInventory("laser_upgrades"))
    val laserUpgradeCount: StateFlow<Int> = _laserUpgradeCount
    
    // Level requirements
    companion object {
        const val FREE_LEVELS = 3 // First 3 levels are free
        const val LEVEL_PACK_PRICE = 500 // Alternative: unlock with coins
        
        const val DEFAULT_SHIP = "standard_ship"
        const val PREMIUM_SHIP = "premium_ship"
    }
    
    init {
        // Ensure default ship is owned
        if (_ownedShips.value.isEmpty()) {
            addShip(DEFAULT_SHIP)
        }
    }
    
    // Currency management
    fun addCoins(amount: Int) {
        _coins.value += amount
        saveCoins()
    }
    
    fun spendCoins(amount: Int): Boolean {
        if (_coins.value >= amount) {
            _coins.value -= amount
            saveCoins()
            return true
        }
        return false
    }
    
    // Level management
    fun isLevelLocked(level: Int): Boolean {
        return level > FREE_LEVELS && level !in _unlockedLevels.value
    }
    
    fun getLevelUnlockCost(level: Int): Int {
        return if (level > FREE_LEVELS) LEVEL_PACK_PRICE else 0
    }
    
    fun unlockLevel(level: Int): Boolean {
        if (isLevelLocked(level)) {
            // Try to unlock with coins first
            if (spendCoins(LEVEL_PACK_PRICE)) {
                val unlocked = _unlockedLevels.value.toMutableSet()
                unlocked.add(level)
                _unlockedLevels.value = unlocked
                saveUnlockedLevels()
                return true
            }
        }
        return false
    }
    
    fun unlockLevelViaPurchase(levelPackId: String) {
        // Called when level pack is purchased via IAP
        when (levelPackId) {
            BillingManager.LEVEL_PACK_2 -> {
                val unlocked = _unlockedLevels.value.toMutableSet()
                unlocked.addAll(4..6) // Levels 4-6
                _unlockedLevels.value = unlocked
                saveUnlockedLevels()
            }
        }
    }
    
    // Ship management
    fun addShip(shipId: String) {
        val owned = _ownedShips.value.toMutableSet()
        owned.add(shipId)
        _ownedShips.value = owned
        saveOwnedShips()
    }
    
    fun selectShip(shipId: String): Boolean {
        if (shipId in _ownedShips.value) {
            _selectedShip.value = shipId
            saveSelectedShip()
            return true
        }
        return false
    }
    
    fun isShipOwned(shipId: String): Boolean = shipId in _ownedShips.value
    
    // Power-ups
    fun addShield(amount: Int = 1) {
        _shieldCount.value += amount
        saveInventory("shields", _shieldCount.value)
    }
    
    fun useShield(): Boolean {
        if (_shieldCount.value > 0) {
            _shieldCount.value--
            saveInventory("shields", _shieldCount.value)
            return true
        }
        return false
    }
    
    fun addLaserUpgrade(amount: Int = 1) {
        _laserUpgradeCount.value += amount
        saveInventory("laser_upgrades", _laserUpgradeCount.value)
    }
    
    fun useLaserUpgrade(): Boolean {
        if (_laserUpgradeCount.value > 0) {
            _laserUpgradeCount.value--
            saveInventory("laser_upgrades", _laserUpgradeCount.value)
            return true
        }
        return false
    }
    
    // IAP reward handlers
    fun handlePurchaseReward(productId: String) {
        when (productId) {
            BillingManager.COIN_PACK_SMALL -> addCoins(1000)
            BillingManager.COIN_PACK_LARGE -> addCoins(5000)
            BillingManager.SHIELD_BOOSTER -> addShield(3)
            BillingManager.LASER_UPGRADE -> addLaserUpgrade(3)
            BillingManager.PREMIUM_SHIP -> addShip(PREMIUM_SHIP)
            BillingManager.LEVEL_PACK_2 -> unlockLevelViaPurchase(productId)
            BillingManager.REMOVE_ADS -> { /* Handle ad removal */ }
        }
    }
    
    // Persistence helpers
    private fun loadCoins(): Int = prefs.getInt("coins", 0)
    private fun saveCoins() = prefs.edit().putInt("coins", _coins.value).apply()
    
    private fun loadHighScore(): Int = prefs.getInt("high_score", 0)
    fun saveHighScore(score: Int) {
        if (score > _highScore.value) {
            _highScore.value = score
            prefs.edit().putInt("high_score", score).apply()
        }
    }
    
    private fun loadCurrentLevel(): Int = prefs.getInt("current_level", 1)
    fun saveCurrentLevel(level: Int) {
        _currentLevel.value = level
        prefs.edit().putInt("current_level", level).apply()
    }
    
    private fun loadOwnedShips(): Set<String> {
        return prefs.getStringSet("owned_ships", setOf(DEFAULT_SHIP)) ?: setOf(DEFAULT_SHIP)
    }
    private fun saveOwnedShips() = prefs.edit().putStringSet("owned_ships", _ownedShips.value).apply()
    
    private fun loadSelectedShip(): String = prefs.getString("selected_ship", DEFAULT_SHIP) ?: DEFAULT_SHIP
    private fun saveSelectedShip() = prefs.edit().putString("selected_ship", _selectedShip.value).apply()
    
    private fun loadUnlockedLevels(): Set<Int> {
        val set = prefs.getStringSet("unlocked_levels", emptySet()) ?: emptySet()
        return set.mapNotNull { it.toIntOrNull() }.toSet()
    }
    private fun saveUnlockedLevels() {
        val set = _unlockedLevels.value.map { it.toString() }.toSet()
        prefs.edit().putStringSet("unlocked_levels", set).apply()
    }
    
    private fun loadInventory(key: String): Int = prefs.getInt(key, 0)
    private fun saveInventory(key: String, value: Int) = prefs.edit().putInt(key, value).apply()
}
