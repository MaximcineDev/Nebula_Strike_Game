// BillingManager.kt
package com.nebulastrike.spacefighter.billing

import android.app.Activity
import android.content.Context
import android.util.Log
import com.android.billingclient.api.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * Manages all in-app purchase operations
 * Handles consumables (ammo, lives) and non-consumables (premium unlocks)
 */
class BillingManager(private val context: Context) {
    
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var billingClient: BillingClient? = null
    
    // Purchase state flows
    private val _purchaseState = MutableStateFlow<PurchaseState>(PurchaseState.Idle)
    val purchaseState: StateFlow<PurchaseState> = _purchaseState
    
    private val _availableProducts = MutableStateFlow<List<ProductDetails>>(emptyList())
    val availableProducts: StateFlow<List<ProductDetails>> = _availableProducts
    
    private val _ownedProducts = MutableStateFlow<Set<String>>(emptySet())
    val ownedProducts: StateFlow<Set<String>> = _ownedProducts
    
    // Product IDs - Define these in Google Play Console
    companion object {
        // Non-consumables (permanent unlocks)
        const val PREMIUM_SHIP = "premium_ship"
        const val LEVEL_PACK_2 = "level_pack_2"
        const val REMOVE_ADS = "remove_ads"
        
        // Consumables (can be bought multiple times)
        const val COIN_PACK_SMALL = "coin_pack_small"
        const val COIN_PACK_LARGE = "coin_pack_large"
        const val SHIELD_BOOSTER = "shield_booster"
        const val LASER_UPGRADE = "laser_upgrade"
        
        val ALL_PRODUCTS = listOf(
            PREMIUM_SHIP,
            LEVEL_PACK_2,
            REMOVE_ADS,
            COIN_PACK_SMALL,
            COIN_PACK_LARGE,
            SHIELD_BOOSTER,
            LASER_UPGRADE
        )
    }
    
    sealed class PurchaseState {
        object Idle : PurchaseState()
        object Loading : PurchaseState()
        data class Success(val purchase: Purchase) : PurchaseState()
        data class Error(val message: String) : PurchaseState()
        data class Pending(val productId: String) : PurchaseState()
    }
    
    init {
        setupBillingClient()
    }
    
    private fun setupBillingClient() {
        billingClient = BillingClient.newBuilder(context)
            .setListener(purchasesUpdatedListener)
            .enablePendingPurchases()
            .build()
            
        startConnection()
    }
    
    private fun startConnection() {
        billingClient?.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    Log.d("Billing", "Billing client connected")
                    queryAvailableProducts()
                    queryPurchases()
                } else {
                    Log.e("Billing", "Setup failed: ${billingResult.debugMessage}")
                }
            }
            
            override fun onBillingServiceDisconnected() {
                Log.w("Billing", "Billing service disconnected, retrying...")
                retryConnection()
            }
        })
    }
    
    private fun retryConnection() {
        scope.launch {
            delay(3000)
            startConnection()
        }
    }
    
    /**
     * Query available products from Play Store
     */
    private fun queryAvailableProducts() {
        val productList = ALL_PRODUCTS.map { productId ->
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(
                    if (isConsumable(productId)) 
                        BillingClient.ProductType.INAPP 
                    else 
                        BillingClient.ProductType.INAPP
                )
                .build()
        }
        
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()
            
        billingClient?.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                _availableProducts.value = productDetailsList ?: emptyList()
                Log.d("Billing", "Found ${productDetailsList?.size} products")
            }
        }
    }
    
    /**
     * Query existing purchases (restoring purchases)
     */
    fun queryPurchases() {
        billingClient?.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
        ) { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                handlePurchases(purchases)
            }
        }
    }
    
    private fun handlePurchases(purchases: List<Purchase>) {
        val owned = mutableSetOf<String>()
        
        purchases.forEach { purchase ->
            if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                owned.addAll(purchase.products)
                
                // Acknowledge if needed
                if (!purchase.isAcknowledged) {
                    acknowledgePurchase(purchase)
                }
                
                // Consume consumables
                purchase.products.forEach { productId ->
                    if (isConsumable(productId)) {
                        consumePurchase(purchase)
                    }
                }
            }
        }
        
        _ownedProducts.value = owned
    }
    
    /**
     * Initiate purchase flow
     */
    fun launchPurchaseFlow(activity: Activity, productDetails: ProductDetails) {
        _purchaseState.value = PurchaseState.Loading
        
        val offerToken = productDetails.oneTimePurchaseOfferDetails?.let {
            // For one-time purchases
            productDetails.subscriptionOfferDetails?.firstOrNull()?.offerToken
        }
        
        val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(productDetails)
            .apply {
                offerToken?.let { setOfferToken(it) }
            }
            .build()
            
        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(productDetailsParams))
            .build()
            
        val billingResult = billingClient?.launchBillingFlow(activity, billingFlowParams)
        
        if (billingResult?.responseCode != BillingClient.BillingResponseCode.OK) {
            _purchaseState.value = PurchaseState.Error("Failed to launch purchase flow")
        }
    }
    
    /**
     * Handle purchase updates
     */
    private val purchasesUpdatedListener = PurchasesUpdatedListener { billingResult, purchases ->
        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                purchases?.forEach { purchase ->
                    handlePurchaseSuccess(purchase)
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                _purchaseState.value = PurchaseState.Idle
            }
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> {
                _purchaseState.value = PurchaseState.Error("Item already owned")
                queryPurchases() // Refresh owned items
            }
            else -> {
                _purchaseState.value = PurchaseState.Error(billingResult.debugMessage)
            }
        }
    }
    
    private fun handlePurchaseSuccess(purchase: Purchase) {
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            // Add to owned products
            val currentOwned = _ownedProducts.value.toMutableSet()
            currentOwned.addAll(purchase.products)
            _ownedProducts.value = currentOwned
            
            // Acknowledge purchase
            if (!purchase.isAcknowledged) {
                acknowledgePurchase(purchase)
            }
            
            // Handle consumables
            purchase.products.forEach { productId ->
                if (isConsumable(productId)) {
                    consumePurchase(purchase)
                    // Grant consumable item
                    grantConsumableReward(productId)
                } else {
                    // Grant non-consumable
                    grantNonConsumableReward(productId)
                }
            }
            
            _purchaseState.value = PurchaseState.Success(purchase)
        } else if (purchase.purchaseState == Purchase.PurchaseState.PENDING) {
            _purchaseState.value = PurchaseState.Pending(purchase.products.first())
        }
    }
    
    private fun acknowledgePurchase(purchase: Purchase) {
        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()
            
        billingClient?.acknowledgePurchase(params) { billingResult ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                Log.d("Billing", "Purchase acknowledged")
            }
        }
    }
    
    private fun consumePurchase(purchase: Purchase) {
        val params = ConsumeParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()
            
        billingClient?.consumeAsync(params) { billingResult, _ ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                Log.d("Billing", "Purchase consumed")
            }
        }
    }
    
    private fun isConsumable(productId: String): Boolean {
        return productId in listOf(
            COIN_PACK_SMALL,
            COIN_PACK_LARGE,
            SHIELD_BOOSTER,
            LASER_UPGRADE
        )
    }
    
    private fun grantConsumableReward(productId: String) {
        // This will be handled by GameStateManager
        Log.d("Billing", "Granting consumable: $productId")
    }
    
    private fun grantNonConsumableReward(productId: String) {
        Log.d("Billing", "Granting non-consumable: $productId")
    }
    
    fun disconnect() {
        billingClient?.endConnection()
        scope.cancel()
    }
}
