package com.nebulastrike.game;

import android.app.Application;
import com.tiktok.TikTokBusinessSdk;
import com.tiktok.TikTokBusinessSdk.TTConfig;

public class NebulaStrikeApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        TTConfig ttConfig = new TTConfig(getApplicationContext(), BuildConfig.TIKTOK_APP_SECRET)
            .setAppId("com.nebulastrike.game")
            .setTTAppId("7686424977334485010");

        TikTokBusinessSdk.initializeSdk(ttConfig, new TikTokBusinessSdk.TTInitCallback() {
            @Override
            public void success() {
                // SDK initialized successfully
            }
            @Override
            public void fail(int code, String msg) {
                // Log this — don't silently swallow init failures during setup
            }
        });
    }
}