package br.com.multicast.mobile;

import android.app.Activity;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;

import org.apache.cordova.Config;

public class ShutdownService extends Service {

    @Override
    public void onCreate() {
        super.onCreate();
        stopService(new Intent(this, MulticastService.class));
        //Stop activity
        //Intent myIntent = new Intent(MulticastMobile.ACTION_CLOSE);
        //sendBroadcast(myIntent);
        NotificationManager mNotificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        // mId allows you to update the notification later on.
        mNotificationManager.cancel(111);
        stopSelf();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }


}
