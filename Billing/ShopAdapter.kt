// ShopAdapter.kt
package com.nebulastrike.spacefighter.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.nebulastrike.spacefighter.R

class ShopAdapter(
    private val onPurchaseClick: (ShopItem) -> Unit,
    private val onCoinPurchaseClick: (ShopItem.CoinItem) -> Unit
) : ListAdapter<ShopItem, ShopAdapter.ViewHolder>(DiffCallback()) {
    
    private var ownedProducts = setOf<String>()
    
    fun updateOwnedItems(owned: Set<String>) {
        ownedProducts = owned
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_shop, parent, false)
        return ViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val iconView: ImageView = itemView.findViewById(R.id.itemIcon)
        private val nameText: TextView = itemView.findViewById(R.id.itemName)
        private val descText: TextView = itemView.findViewById(R.id.itemDescription)
        private val priceText: TextView = itemView.findViewById(R.id.itemPrice)
        private val buyButton: Button = itemView.findViewById(R.id.buyButton)
        private val ownedBadge: View = itemView.findViewById(R.id.ownedBadge)
        
        fun bind(item: ShopItem) {
            when (item) {
                is ShopItem.IAPItem -> {
                    val product = item.productDetails
                    nameText.text = product.name
                    descText.text = product.description
                    
                    val price = product.oneTimePurchaseOfferDetails?.formattedPrice ?: "N/A"
                    priceText.text = price
                    
                    val isOwned = product.productId in ownedProducts
                    ownedBadge.visibility = if (isOwned) View.VISIBLE else View.GONE
                    buyButton.isEnabled = !isOwned
                    buyButton.text = if (isOwned) "Owned" else "Buy"
                    
                    buyButton.setOnClickListener { onPurchaseClick(item) }
                    
                    // Set icon based on product ID
                    iconView.setImageResource(getIconForProduct(product.productId))
                }
                is ShopItem.CoinItem -> {
                    nameText.text = item.icon + " " + item.name
                    descText.text = item.description
                    priceText.text = "${item.cost} coins"
                    ownedBadge.visibility = View.GONE
                    buyButton.isEnabled = true
                    buyButton.text = "Buy"
                    
                    buyButton.setOnClickListener { onPurchaseClick(item) }
                    iconView.setImageResource(R.drawable.ic_coin)
                }
            }
        }
        
        private fun getIconForProduct(productId: String): Int {
            return when (productId) {
                BillingManager.PREMIUM_SHIP -> R.drawable.ic_ship_premium
                BillingManager.COIN_PACK_SMALL -> R.drawable.ic_coins_small
                BillingManager.COIN_PACK_LARGE -> R.drawable.ic_coins_large
                BillingManager.SHIELD_BOOSTER -> R.drawable.ic_shield
                BillingManager.LASER_UPGRADE -> R.drawable.ic_laser
                BillingManager.LEVEL_PACK_2 -> R.drawable.ic_levels
                else -> R.drawable.ic_default
            }
        }
    }
    
    class DiffCallback : DiffUtil.ItemCallback<ShopItem>() {
        override fun areItemsTheSame(old: ShopItem, new: ShopItem): Boolean {
            return when {
                old is ShopItem.IAPItem && new is ShopItem.IAPItem -> 
                    old.productDetails.productId == new.productDetails.productId
                old is ShopItem.CoinItem && new is ShopItem.CoinItem -> 
                    old.id == new.id
                else -> false
            }
        }
        
        override fun areContentsTheSame(old: ShopItem, new: ShopItem): Boolean {
            return old == new
        }
    }
}
