// GameStateManager.kt
package com.nebulastrike.spacefighter.data

import android.content.Context
import android.content.SharedPreferences
import com.nebulastrike.spacefighter.billing.BillingManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class GameStateManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(
            "game_state",
            Context.MODE_PRIVATE
        )

    // =========================
    // CURRENCY
    // =========================

    private val _coins =
        MutableStateFlow(loadCoins())
    val coins: StateFlow<Int> = _coins

    fun addCoins(amount: Int) {

        _coins.value += amount

        prefs.edit()
            .putInt("coins", _coins.value)
            .apply()
    }

    fun spendCoins(amount: Int): Boolean {

        if (_coins.value >= amount) {

            _coins.value -= amount

            prefs.edit()
                .putInt("coins", _coins.value)
                .apply()

            return true
        }

        return false
    }

    private fun loadCoins(): Int =
        prefs.getInt("coins", 0)

    // =========================
    // LEVEL
    // =========================

    private val _currentLevel =
        MutableStateFlow(loadLevel())

    val currentLevel: StateFlow<Int> =
        _currentLevel

    fun saveCurrentLevel(level: Int) {

        _currentLevel.value = level

        prefs.edit()
            .putInt("level", level)
            .apply()
    }

    private fun loadLevel(): Int =
        prefs.getInt("level", 1)

    // =========================
    // SHIELDS
    // =========================

    private val _shieldCount =
        MutableStateFlow(loadInt("shields"))

    val shieldCount: StateFlow<Int> =
        _shieldCount

    fun addShield(amount: Int = 1) {

        _shieldCount.value += amount

        saveInt(
            "shields",
            _shieldCount.value
        )
    }

    fun useShield(): Boolean {

        if (_shieldCount.value > 0) {

            _shieldCount.value--

            saveInt(
                "shields",
                _shieldCount.value
            )

            return true
        }

        return false
    }

    // =========================
    // LASER
    // =========================

    private val _laserUpgradeCount =
        MutableStateFlow(
            loadInt("laser")
        )

    val laserUpgradeCount: StateFlow<Int> =
        _laserUpgradeCount

    fun addLaserUpgrade(
        amount: Int = 1
    ) {

        _laserUpgradeCount.value += amount

        saveInt(
            "laser",
            _laserUpgradeCount.value
        )
    }

    fun useLaserUpgrade(): Boolean {

        if (_laserUpgradeCount.value > 0) {

            _laserUpgradeCount.value--

            saveInt(
                "laser",
                _laserUpgradeCount.value
            )

            return true
        }

        return false
    }

    // =========================
    // DAILY REWARD SYSTEM
    // =========================

    private val _lastRewardDay =
        MutableStateFlow(loadLastRewardDay())

    val lastRewardDay: StateFlow<Int> =
        _lastRewardDay

    private val _rewardDay =
        MutableStateFlow(loadRewardDay())

    val rewardDay: StateFlow<Int> =
        _rewardDay

    fun giveDailyReward(): Int {

        val today =
            (System.currentTimeMillis()
                    / 86400000L).toInt()

        if (today == _lastRewardDay.value) {

            return 0
        }

        var day =
            _rewardDay.value + 1

        if (day > 7) day = 1

        val reward =
            when (day) {

                1 -> 100
                2 -> 150
                3 -> 200
                4 -> 300
                5 -> 400
                6 -> 500
                7 -> 1000

                else -> 100
            }

        addCoins(reward)

        _rewardDay.value = day
        _lastRewardDay.value = today

        prefs.edit()
            .putInt("reward_day", day)
            .putInt("last_reward", today)
            .apply()

        return reward
    }

    private fun loadLastRewardDay(): Int =
        prefs.getInt("last_reward", -1)

    private fun loadRewardDay(): Int =
        prefs.getInt("reward_day", 0)

    // =========================
    // PURCHASE REWARDS
    // =========================

    fun handlePurchaseReward(
        productId: String
    ) {

        when (productId) {

            BillingManager.COIN_PACK_SMALL ->
                addCoins(1000)

            BillingManager.COIN_PACK_LARGE ->
                addCoins(5000)

            BillingManager.SHIELD_BOOSTER ->
                addShield(3)

            BillingManager.LASER_UPGRADE ->
                addLaserUpgrade(3)

            BillingManager.REMOVE_ADS -> {
            }
        }
    }

    // =========================
    // HELPERS
    // =========================

    private fun saveInt(
        key: String,
        value: Int
    ) {

        prefs.edit()
            .putInt(key, value)
            .apply()
    }

    private fun loadInt(
        key: String
    ): Int {

        return prefs.getInt(
            key,
            0
        )
    }
}
