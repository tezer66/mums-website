package xyz.harperholistic.app;

import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Keep Gill's card artwork inside the membership: Android blocks screenshots and screen
        // recordings of the app, and shows a blank tile in the recent-apps switcher.
        // Members share cards with the "Share this card" button instead.
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
    }
}
