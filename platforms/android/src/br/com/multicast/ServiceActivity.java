package br.com.multicast;

import android.os.Bundle;
import org.apache.cordova.*;

public class ServiceActivity extends CordovaActivity 
{
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        super.loadUrl("file:///android_asset/www/index.html");
    }
}