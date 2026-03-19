package com.nebulastrike.spacefighter.ui

import android.app.AlertDialog
import android.content.Context

object LevelCompleteDialog {

    fun show(
        context: Context,
        level: Int,
        onNext: () -> Unit
    ) {

        AlertDialog.Builder(context)
            .setTitle("Level Complete")
            .setMessage(
                "You beat level $level"
            )
            .setPositiveButton(
                "Next Level"
            ) { _, _ ->

                onNext()
            }
            .setCancelable(false)
            .show()
    }
}
