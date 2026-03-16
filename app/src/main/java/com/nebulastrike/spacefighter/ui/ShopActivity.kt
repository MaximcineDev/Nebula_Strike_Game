// ShopActivity.kt
package com.nebulastrike.spacefighter.ui

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.android.billingclient.api.ProductDetails
import com.nebulastrike.spacefighter.R
import com.nebulastrike.spacefighter.billing.BillingManager
import com.nebulastrike.spacefighter.data.GameStateManager
import kotlinx.coroutines.launch

/**
 * Shop interface for purchasing items and upgrades
 * Shows both IAP products and coin-purchasable items
 */
class ShopActivity : AppCompatActivity() {
    
    private lateinit var billingManager: BillingManager
    private lateinit var gameStateManager: GameStateManager
    private lateinit var shopAdapter: ShopAdapter
    
    private lateinit var coinText: TextView
    private lateinit var recyclerView: RecyclerView
    private lateinit var backButton: Button
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_shop)
        
        billingManager = BillingManager(this)
        gameStateManager = GameStateManager(this)
        
        setupViews()
        observeBillingState()
        observeGameState()
    }
    
    private fun setupViews() {
        coinText = findViewById(R.id.coinText)
        recyclerView = findViewById(R.id.shopRecyclerView)
        backButton = findViewById(R.id.backButton)
        
        recyclerView.layoutManager = GridLayoutManager(this, 2)
        shopAdapter = ShopAdapter(
            onPurchaseClick = { item -> handlePurchase(item) },
            onCoinPurchaseClick = { item -> handleCoinPurchase(item) }
        )
        recyclerView.adapter = shopAdapter
        
        backButton.setOnClickListener { finish() }
    }
    
    private fun observeBillingState() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    billingManager.availableProducts.collect { products ->
                        updateShopItems(products)
                    }
                }
                
                launch {
                    billingManager.purchaseState.collect { state ->
                        handlePurchaseState(state)
                    }
                }
                
                launch {
                    billingManager.ownedProducts.collect { owned ->
                        shopAdapter.updateOwnedItems(owned)
                    }
                }
            }
        }
    }
    
    private fun observeGameState() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                gameStateManager.coins.collect { coins ->
                    coinText.text = "💰 $coins"
                }
            }
        }
    }
    
    private fun updateShopItems(products: List<ProductDetails>) {
        val shopItems = mutableListOf<ShopItem>()
        
        // Add IAP products
        products.forEach { product ->
            shopItems.add(ShopItem.IAPItem(product))
        }
        
        // Add coin-purchasable items
        shopItems.add(ShopItem.CoinItem(
            id = "shield_pack",
            name = "Shield Pack",
            description = "3 shields for protection",
            cost = 200,
            icon = "🛡️",
            onPurchase = { gameStateManager.addShield(3) }
        ))
        
        shopItems.add(ShopItem.CoinItem(
            id = "laser_power",
            name = "Laser Boost",
            description = "3 powerful laser upgrades",
            cost = 300,
            icon = "⚡",
            onPurchase = { gameStateManager.addLaserUpgrade(3) }
        ))
        
        shopAdapter.submitList(shopItems)
    }
    
    private fun handlePurchase(item: ShopItem) {
        when (item) {
            is ShopItem.IAPItem -> {
                billingManager.launchPurchaseFlow(this, item.productDetails)
            }
            is ShopItem.CoinItem -> {
                if (gameStateManager.spendCoins(item.cost)) {
                    item.onPurchase()
                    Toast.makeText(this, "Purchased ${item.name}!", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this, "Not enough coins!", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
    
    private fun handleCoinPurchase(item: ShopItem.CoinItem) {
        // Handled in handlePurchase
    }
    
    private fun handlePurchaseState(state: BillingManager.PurchaseState) {
        when (state) {
            is BillingManager.PurchaseState.Success -> {
                state.purchase.products.forEach { productId ->
                    gameStateManager.handlePurchaseReward(productId)
                }
                Toast.makeText(this, "Purchase successful!", Toast.LENGTH_SHORT).show()
            }
            is BillingManager.PurchaseState.Error -> {
                Toast.makeText(this, "Error: ${state.message}", Toast.LENGTH_SHORT).show()
            }
            is BillingManager.PurchaseState.Pending -> {
                Toast.makeText(this, "Purchase pending...", Toast.LENGTH_SHORT).show()
            }
            else -> {}
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        billingManager.disconnect()
    }
}

// ShopItem sealed class
sealed class ShopItem {
    data class IAPItem(val productDetails: ProductDetails) : ShopItem()
    data class CoinItem(
        val id: String,
        val name: String,
        val description: String,
        val cost: Int,
        val icon: String,
        val onPurchase: () -> Unit
    ) : ShopItem()
}
