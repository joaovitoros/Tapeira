package com.tapeira.game;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

// Além do comportamento padrão do Capacitor, o app aceita ABRIR/COMPARTILHAR
// um save do TAPeira (ex.: recebido por Bluetooth): lê o arquivo do intent e
// entrega o JSON pro jogo importar (window.tapeiraAndroidRecebeu /
// TapeiraAndroid.pegaSaveRecebido).
public class MainActivity extends BridgeActivity {

    // Save recebido, aguardando o jogo puxar (entrega uma vez só).
    private static String saveRecebido = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registraPonte();
        trataIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        trataIntent(intent);
    }

    // Ponte que o web (android-save-entry.js) consulta pra pegar o save.
    private void registraPonte() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.addJavascriptInterface(new PonteSave(), "TapeiraAndroid");
            }
        } catch (Exception ignored) {
            // sem WebView ainda: o save fica guardado e é puxado no load
        }
    }

    private static class PonteSave {
        @JavascriptInterface
        public String pegaSaveRecebido() {
            String json = saveRecebido;
            saveRecebido = null; // entrega uma vez só
            return json;
        }
    }

    // Lê o arquivo do intent: ACTION_VIEW = "Abrir com"; ACTION_SEND = Compartilhar
    private void trataIntent(Intent intent) {
        if (intent == null) return;
        final String action = intent.getAction();
        if (!Intent.ACTION_VIEW.equals(action) && !Intent.ACTION_SEND.equals(action)) return;

        final Uri uri = Intent.ACTION_SEND.equals(action)
            ? intent.getParcelableExtra(Intent.EXTRA_STREAM)
            : intent.getData();
        if (uri == null) return;

        new Thread(() -> {
            final String json = lerTexto(uri);
            if (json == null || json.trim().isEmpty()) return;
            saveRecebido = json;
            runOnUiThread(() -> {
                try {
                    WebView webView = getBridge().getWebView();
                    if (webView != null) {
                        webView.evaluateJavascript(
                            "window.tapeiraAndroidRecebeu && window.tapeiraAndroidRecebeu("
                                + org.json.JSONObject.quote(json) + ");", null);
                    }
                } catch (Exception ignored) {
                    // o jogo ainda vai puxar via TapeiraAndroid.pegaSaveRecebido()
                }
            });
        }).start();
    }

    private String lerTexto(Uri uri) {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) return null;
            Scanner sc = new Scanner(in, StandardCharsets.UTF_8.name()).useDelimiter("\\A");
            return sc.hasNext() ? sc.next() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
