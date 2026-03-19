package com.nebulastrike.spacefighter

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.lifecycle.lifecycleScope
import com.nebulastrike.spacefighter.billing.BillingManager
import com.nebulastrike.spacefighter.data.GameStateManager
import com.nebulastrike.spacefighter.ui.ShopActivity
import kotlinx.coroutines.launch
import android.widget.ProgressBar

// ADMOB
import com.google.android.gms.ads.*
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

class MainActivity : Activity() {

    private lateinit var glSurfaceView: GameGLSurfaceView
    private lateinit var gameStateManager: GameStateManager
    private lateinit var billingManager: BillingManager
    
    private lateinit var bossBar: ProgressBar

    private lateinit var coinText: TextView
    private lateinit var shieldButton: Button
    private lateinit var laserButton: Button
    private lateinit var shopButton: Button
    private lateinit var rewardButton: Button
    

    // ADS
    private var rewardedAd: RewardedAd? = null
    private var interstitialAd: InterstitialAd? = null
    private lateinit var adView: AdView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        gameStateManager = GameStateManager(this)
        billingManager = BillingManager(this)

        val level = intent.getIntExtra("LEVEL", 1)

        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )

        setContentView(
            R.layout.activity_main_game
        )

        // ADMOB INIT
        MobileAds.initialize(this)

        loadBannerAd()
        loadRewardAd()
        loadInterstitialAd()

        setupGameView(level)
        setupUI()
        observeGameState()

        giveDailyReward()
    }

    // =========================
    // GAME VIEW
    // =========================

    private fun setupGameView(level: Int) {

        glSurfaceView =
            findViewById(R.id.glSurfaceView)

        val renderer =
            GameRenderer(
                this,
                level,
                gameStateManager
            )

        glSurfaceView.setRenderer(renderer)

        glSurfaceView.setOnTouchListener { _, event ->
            renderer.handleTouch(event)
            true
        }
    }

    // =========================
    // UI
    // =========================

    private fun setupUI() {

        coinText =
            findViewById(R.id.coinText)

        shieldButton =
            findViewById(R.id.shieldButton)

        laserButton =
            findViewById(R.id.laserButton)

        shopButton =
            findViewById(R.id.shopButton)

        rewardButton =
            findViewById(R.id.rewardButton)

        bossBar = 
            findViewById(R.id.bossBar)

        shieldButton.setOnClickListener {

            if (gameStateManager.useShield()) {

                Toast.makeText(
                    this,
                    "Shield activated",
                    Toast.LENGTH_SHORT
                ).show()

            } else {

                openShop()

            }
        }

        laserButton.setOnClickListener {

            if (gameStateManager.useLaserUpgrade()) {

                Toast.makeText(
                    this,
                    "Laser upgraded",
                    Toast.LENGTH_SHORT
                ).show()

            } else {

                openShop()

            }
        }

        shopButton.setOnClickListener {

            openShop()
        }

        rewardButton.setOnClickListener {

            showRewardAd()
        }
    }

    private fun openShop() {

        startActivity(
            Intent(
                this,
                ShopActivity::class.java
            )
        )
    }

    // =========================
    // BOSS HEALTH
    // =========================

    private fun updateBossBar() {

        val renderer = glSurfaceView.renderer

        val max = renderer.getBossMaxHealth()

        if (max > 0) {

            bossBar.max = max
            bossBar.progress =
                renderer.getBossHealth()

        } else {

            bossBar.progress = 0
        }

        if (renderer.isLevelComplete()) {

            showLevelComplete()
        }
    }

    
    // =========================
    // OBSERVE STATE
    // =========================

    private fun observeGameState() {

        lifecycleScope.launch {

            gameStateManager.coins.collect {

                coinText.text =
                    "💰 $it"
            }
        }

        lifecycleScope.launch {

            gameStateManager.shieldCount.collect {

                shieldButton.text =
                    "🛡 $it"
            }
        }

        lifecycleScope.launch {

            gameStateManager.laserUpgradeCount.collect {

                laserButton.text =
                    "⚡ $it"
            }
        }
    }

    // =========================
    // DAILY REWARD
    // =========================

    private fun giveDailyReward() {

        val reward =
            gameStateManager
                .giveDailyReward()

        if (reward > 0) {

            Toast.makeText(
                this,
                "Daily reward +$reward coins",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    // =========================
    // ADMOB
    // =========================

    private fun loadBannerAd() {

        adView =
            findViewById(R.id.adView)

        val request =
            AdRequest.Builder().build()

        adView.loadAd(request)
    }

    private fun loadRewardAd() {

        val request =
            AdRequest.Builder().build()

        RewardedAd.load(
            this,
            "ca-app-pub-5850163781981893/3862181045",
            request,
            object : RewardedAdLoadCallback() {

                override fun onAdLoaded(
                    ad: RewardedAd
                ) {
                    rewardedAd = ad
                }
            }
        )
    }

    private fun showRewardAd() {

        if (rewardedAd != null) {

            rewardedAd?.show(this) {

                gameStateManager.addCoins(200)

                Toast.makeText(
                    this,
                    "+200 coins",
                    Toast.LENGTH_SHORT
                ).show()
            }

        } else {

            loadRewardAd()
        }
    }

    private fun loadInterstitialAd() {

        val request =
            AdRequest.Builder().build()

        InterstitialAd.load(
            this,
            "ca-app-pub-5850163781981893/4201092392",
            request,
            object :
                InterstitialAdLoadCallback() {

                override fun onAdLoaded(
                    ad: InterstitialAd
                ) {
                    interstitialAd = ad
                }
            }
        )
    }

    fun showInterstitial() {

        interstitialAd?.show(this)
    }

    // =========================

    override fun onPause() {
        super.onPause()
        glSurfaceView.onPause()
    }

    override fun onResume(
        glSurfaceView.postDelayed(object : Runnable {

            override fun run() {

                updateBossBar()

                glSurfaceView.postDelayed(
                    this,
                    100
                )
            }

        }, 100)) {
        super.onResume()
        glSurfaceView.onResume()
        billingManager.queryPurchases()
    }

    override fun onDestroy() {
        super.onDestroy()
        billingManager.disconnect()
    }
}
