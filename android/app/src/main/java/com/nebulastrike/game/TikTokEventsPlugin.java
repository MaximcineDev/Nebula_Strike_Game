package com.nebulastrike.game;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.tiktok.TikTokBusinessSdk;
import com.tiktok.appevents.base.EventName;

@CapacitorPlugin(name = "TikTokEvents")
public class TikTokEventsPlugin extends Plugin {

    @PluginMethod
    public void trackLevelComplete(PluginCall call) {
        TikTokBusinessSdk.trackTTEvent(EventName.ACHIEVE_LEVEL);
        call.resolve();
    }

    @PluginMethod
    public void trackAchievementUnlocked(PluginCall call) {
        TikTokBusinessSdk.trackTTEvent(EventName.UNLOCK_ACHIEVEMENT);
        call.resolve();
    }

    @PluginMethod
    public void trackTutorialComplete(PluginCall call) {
        TikTokBusinessSdk.trackTTEvent(EventName.COMPLETE_TUTORIAL);
        call.resolve();
    }

    @PluginMethod
    public void trackAdImpression(PluginCall call) {
        TikTokBusinessSdk.trackTTEvent(EventName.IN_APP_AD_IMPR);
        call.resolve();
    }

    @PluginMethod
    public void trackAdClick(PluginCall call) {
        TikTokBusinessSdk.trackTTEvent(EventName.IN_APP_AD_CLICK);
        call.resolve();
    }
}