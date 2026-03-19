package com.nebulastrike.spacefighter.ui

import android.app.AlertDialog
import android.content.Context

object GameOverDialog {

    fun show(
        context: Context,
        coinsAvailable: Int,
        continueCost: Int,
        onContinue: () -> Unit,
        onExit: () -> Unit
    ) {
        val canContinue = coinsAvailable >= continueCost

        val builder = AlertDialog.Builder(context)
            .setTitle("Game Over")
            .setMessage(
                if (canContinue) "Spend $continueCost coins to continue?" 
                else "You have no enough coins!"
            )
            .setCancelable(false)
            .setPositiveButton(
                if (canContinue) "Continue" else "Exit"
            ) { _, _ ->
                if (canContinue) onContinue() else onExit()
            }
            .setNegativeButton(
                if (canContinue) "Exit" else null
            ) { _, _ -> onExit() }

        builder.show()
    }
}
