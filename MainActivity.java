package com.nebulastrike.game;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        webView = new WebView(this);

        setContentView(webView);

        webView.getSettings().setJavaScriptEnabled(true);

        webView.setWebViewClient(
            new WebViewClient()
        );

        webView.loadUrl(
            "https://chinabel.github.io/Nebula_Strike/"
        );

    }
}
