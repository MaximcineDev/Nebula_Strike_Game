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

// ADMOB
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardItem

class MainActivity : Activity() {

    private lateinit var glSurfaceView: GameGLSurfaceView
    private lateinit var gameStateManager: GameStateManager
    private lateinit var billingManager: BillingManager

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

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContentView(R.layout.activity_main_game)

        // ✅ INIT ADMOB
        MobileAds.initialize(this)

        loadRewardAd()
        loadInterstitialAd()
        loadBannerAd()

        setupGameView(level)
        setupUI()
        observeGameState()
    }

    private fun setupGameView(level: Int) {

        glSurfaceView = findViewById(R.id.glSurfaceView)

        val renderer =
            GameRenderer(this, level, gameStateManager)

        glSurfaceView.setRenderer(renderer)

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
        rewardButton = findViewById(R.id.rewardButton)

        shieldButton.setOnClickListener {

            if (gameStateManager.useShield()) {

                glSurfaceView.renderer.activateShield()

                Toast.makeText(
                    this,
                    "Shield activated!",
                    Toast.LENGTH_SHORT
                ).show()

            } else {

                promptBuyShields()

            }
        }

        laserButton.setOnClickListener {

            if (gameStateManager.useLaserUpgrade()) {

                glSurfaceView.renderer.activateLaserUpgrade()

                Toast.makeText(
                    this,
                    "Laser upgraded!",
                    Toast.LENGTH_SHORT
                ).show()

            } else {

                promptBuyLasers()

            }
        }

        shopButton.setOnClickListener {

            startActivity(
                Intent(this, ShopActivity::class.java)
            )

        }

        // ✅ WATCH AD FOR COINS
        rewardButton.setOnClickListener {

            showRewardAd()

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
                shieldButton.alpha =
                    if (count > 0) 1f else 0.5f

            }
        }

        lifecycleScope.launch {

            gameStateManager.laserUpgradeCount.collect { count ->

                laserButton.text = "⚡ $count"
                laserButton.alpha =
                    if (count > 0) 1f else 0.5f

            }
        }
    }

    private fun promptBuyShields() {

        startActivity(
            Intent(this, ShopActivity::class.java)
        )
    }

    private fun promptBuyLasers() {

        startActivity(
            Intent(this, ShopActivity::class.java)
        )
    }

    private fun updatePowerUpButtons() {

        shieldButton.text =
            "🛡️ ${gameStateManager.shieldCount.value}"

        laserButton.text =
            "⚡ ${gameStateManager.laserUpgradeCount.value}"
    }

    override fun onPause() {
        super.onPause()
        glSurfaceView.onPause()
    }

    override fun onResume() {
        super.onResume()
        glSurfaceView.onResume()
        billingManager.queryPurchases()
    }

    override fun onDestroy() {
        super.onDestroy()
        billingManager.disconnect()
    }

    // ============================
    // ADS
    // ============================

    private fun loadRewardAd() {

        val adRequest = AdRequest.Builder().build()

        RewardedAd.load(
            this,
            "ca-app-pub-5850163781981893/3862181045",
            adRequest,
            object : RewardedAdLoadCallback() {

                override fun onAdLoaded(ad: RewardedAd) {

                    rewardedAd = ad

                }
            }
        )
    }

    fun showRewardAd() {

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

        val adRequest = AdRequest.Builder().build()

        InterstitialAd.load(
            this,
            "ca-app-pub-5850163781981893/4201092392",
            adRequest,
            object : InterstitialAdLoadCallback() {

                override fun onAdLoaded(ad: InterstitialAd) {

                    interstitialAd = ad

                }
            }
        )
    }

    fun showInterstitial() {

        interstitialAd?.show(this)

    }

    private fun loadBannerAd() {

        adView = findViewById(R.id.adView)

        val adRequest = AdRequest.Builder().build()

        adView.loadAd(adRequest)

    }
}
