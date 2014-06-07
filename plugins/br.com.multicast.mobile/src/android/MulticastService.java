package br.com.multicast.mobile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;

import java.text.SimpleDateFormat;
import java.util.Date;

import org.apache.http.params.HttpParams;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.TaskStackBuilder;
import android.database.sqlite.SQLiteDatabase;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.provider.Settings;
import android.util.Log;

//import android.*;

//import android.support.v4.app.NotificationCompat;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.media.RingtoneManager;
import android.net.Uri;
import android.graphics.Color;

import com.red_folder.phonegap.plugin.backgroundservice.BackgroundService;

import br.com.multicast.mobile.db.MulticastStorageHelper;

import static java.security.AccessController.getContext;

public class MulticastService extends BackgroundService {

    private final static String TAG = MulticastService.class.getSimpleName();

    public static int TYPE_WIFI = 1;
    public static int TYPE_MOBILE = 2;
    public static int TYPE_NOT_CONNECTED = 0;

    //private String authToken = "";
    private int status = -1;
    private String auth = "-1";
    private Boolean offMsg = false;
    private Boolean startup = true;
    private long threshold = 0;// Long.MAX_VALUE;
    private int counter = 0;
    private MulticastStorageHelper dbHelper = new MulticastStorageHelper(this);

    private int unread = 0;

    private String __NOTIFICATION_TITLE = "Multicast Mobile";
    private int __NOTIFICATION_ID = 111;

    private void notify(Notification notification) {
        NotificationManager mNotificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        mNotificationManager.notify (__NOTIFICATION_ID, notification);

    }

    public static int getConnectivityStatus(Context context) {
        ConnectivityManager cm = (ConnectivityManager) context
                .getSystemService(Context.CONNECTIVITY_SERVICE);

        NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
        if (null != activeNetwork) {
            if(activeNetwork.getType() == ConnectivityManager.TYPE_WIFI)
                return TYPE_WIFI;

            if(activeNetwork.getType() == ConnectivityManager.TYPE_MOBILE)
                return TYPE_MOBILE;
        }
        return TYPE_NOT_CONNECTED;
    }

    private void setAuthToken(String authToken) {
        SharedPreferences sp = PreferenceManager.getDefaultSharedPreferences(this);
        SharedPreferences.Editor editor = sp.edit();
        editor.putString("authToken", authToken);
        editor.commit();
    }

    private String getAuthToken() {
        SharedPreferences sp = PreferenceManager.getDefaultSharedPreferences(this);
        return sp.getString("authToken", "");
    }

    private Notification.Builder getMulticastNotification() {

        // Creates an explicit intent for an Activity in your app
        Intent resultIntent = new Intent(this, MulticastMobile.class);
        TaskStackBuilder stackBuilder = TaskStackBuilder.create(this);
        stackBuilder.addParentStack(MulticastMobile.class);
        stackBuilder.addNextIntent(resultIntent);
        PendingIntent resultPendingIntent =
                stackBuilder.getPendingIntent(
                        0,
                        PendingIntent.FLAG_UPDATE_CURRENT
                );
        //mBuilder.setContentIntent(resultPendingIntent);

        /*Intent intent = new Intent(this, MulticastMobile.class);
        intent.putExtra("url", "file:///android_asset/www/index.html#/app/alerts/unread");
        PendingIntent pIntent = PendingIntent.getActivity(this, 0, intent, 0);
        TaskStackBuilder stackBuilder = TaskStackBuilder.create(this);
        stackBuilder.addParentStack(MulticastMobile.class);*/

        Intent intentFinish = new Intent(this, ShutdownService.class);
        PendingIntent pIntentFinish = PendingIntent.getService(this, 0, intentFinish, 0);

        return new Notification.Builder(this)
                .setSmallIcon(R.drawable.ic_stat_multicast)
                .setContentTitle(__NOTIFICATION_TITLE)
                .setOngoing(true)
                .setContentIntent(resultPendingIntent)
                .addAction(android.R.drawable.ic_lock_power_off, "Switch off", pIntentFinish);
    }

    public Notification defaultNotification() {

        return getMulticastNotification()
                .setContentText("Online. Tap to open...").build();
    }

    public Notification notLoggedInNotification() {

        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        long[] vibPattern = {500,500,500,500,500,500,500,500,500};

        return getMulticastNotification()
                .setContentText("Tap to Sign in...")
                .setLights(Color.GREEN, 500, 500)
                .setVibrate(vibPattern)
                .setSound(alarmSound).build();
    }

    public Notification unreadNotifications(int unread) {
        // Creates an explicit intent for an Activity in your app
        Intent resultIntent = new Intent(this, MulticastMobile.class);
        resultIntent.putExtra("url", "file:///android_asset/www/index.html#/app/alerts/unread");
        TaskStackBuilder stackBuilder = TaskStackBuilder.create(this);
        stackBuilder.addParentStack(MulticastMobile.class);
        stackBuilder.addNextIntent(resultIntent);
        PendingIntent resultPendingIntent =
                stackBuilder.getPendingIntent(
                        0,
                        PendingIntent.FLAG_UPDATE_CURRENT
                );

        Intent intentFinish = new Intent(this, ShutdownService.class);
        PendingIntent pIntentFinish = PendingIntent.getService(this, 0, intentFinish, 0);

        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        long[] vibPattern = {500,500,500,500,500,500,500,500,500};

        return new Notification.Builder(this)
                .setSmallIcon(R.drawable.ic_stat_multicast)
                .setContentTitle(__NOTIFICATION_TITLE)
                .setOngoing(true)
                .setContentIntent(resultPendingIntent)
                .setLights(Color.GREEN, 500, 500)
                .setVibrate(vibPattern)
                .setSound(alarmSound)
                .setContentText(unread + " unread notifications. Tap to check.")
                .addAction(android.R.drawable.ic_lock_power_off, "Switch off", pIntentFinish).build();
    }

    public Notification offLineNotification(int lastConnection) {

        Intent intent ;

        if (lastConnection == TYPE_WIFI) {
            intent = new Intent(Settings.ACTION_WIFI_SETTINGS);
        } else {
            intent = new Intent(Settings.ACTION_DATA_ROAMING_SETTINGS);
        }

        PendingIntent pIntent = PendingIntent.getActivity(this, 0, intent, 0);
        TaskStackBuilder stackBuilder = TaskStackBuilder.create(this);
        stackBuilder.addParentStack(MulticastMobile.class);

        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        long[] vibPattern = {500,500,500,500,500,500,500,500,500};

        return getMulticastNotification()
                .setContentText("Offline. Please verify your network")
                .setLights(Color.GREEN, 500, 500)
                .setVibrate(vibPattern)
                .setSound(alarmSound)
                .addAction(android.R.drawable.ic_menu_preferences, "Network", pIntent)
                .build();
    }

    public void showNotification( String contentTitle, String contentText ) {

        Notification.Builder mBuilder =
                new Notification.Builder(this)
                        .setSmallIcon(R.drawable.ic_stat_multicast)
                        .setContentTitle(contentTitle)
                        .setContentText(contentText);

        // Creates an explicit intent for an Activity in your app
        Intent resultIntent = new Intent(this, MulticastMobile.class);

        // The stack builder object will contain an artificial back stack for the
        // started Activity.
        // This ensures that navigating backward from the Activity leads out of
        // your application to the Home screen.
        TaskStackBuilder stackBuilder = TaskStackBuilder.create(this);

        // Adds the back stack for the Intent (but not the Intent itself)
        stackBuilder.addParentStack(MulticastMobile.class);
        // Adds the Intent that starts the Activity to the top of the stack
        stackBuilder.addNextIntent(resultIntent);
        PendingIntent resultPendingIntent =
                stackBuilder.getPendingIntent(
                        0,
                        PendingIntent.FLAG_UPDATE_CURRENT
                );
        mBuilder.setContentIntent(resultPendingIntent);

        mBuilder.setLights(Color.GREEN, 500, 500);
        long[] pattern = {500,500,500,500,500,500,500,500,500};
        mBuilder.setVibrate(pattern);

        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        mBuilder.setSound(alarmSound);

        NotificationManager mNotificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);


        // mId allows you to update the notification later on.
        mNotificationManager.notify(1, mBuilder.build());
    }

    @Override
    protected JSONObject doWork() {

        //SQLiteDatabase db = dbHelper.getWritableDatabase();

        JSONObject result = new JSONObject();
        //try {

            //getAlerts(result);
            if (startup) {
                notify(defaultNotification());
                startup = false;
            }

            int currentStatus = getConnectivityStatus(this);

            if (currentStatus == TYPE_NOT_CONNECTED) {
                if (status != currentStatus) {
                    notify(offLineNotification(status));
                    status = currentStatus;
                }

            } else {

                Boolean justConnected = (status != currentStatus);

                if (justConnected) {

                    status = currentStatus;
                    notify(defaultNotification());
                }

                String currentToken = getAuthToken();

                if( currentToken.equals("")) {
                    if (justConnected || !auth.equals(currentToken)) {
                        auth = new String(currentToken);
                        notify(notLoggedInNotification());
                    }
                }
                else {
                    if (!auth.equals(currentToken)) {
                        auth = new String(currentToken);
                        notify(defaultNotification());
                    }
                    getAlerts(result);
                    if (this.unread > 0) {
                        notify(unreadNotifications(this.unread));
                    } else notify(defaultNotification());
                }
            }


            /*if (this.offMsg && this.status.equals("online")) {
                notify(defaultNotification());
                offMsg = false;
            }

            if (this.offMsg && this.status.equals("offline")) {
                notify(offLineNotification());
                offMsg = false;
            }*/



        //} catch (JSONException e) {

        //}

        return result;
    }

    private String convertInputStreamToString(InputStream inputStream) throws IOException {
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
        String line = "";
        String result = "";
        while ((line = bufferedReader.readLine()) != null)
            result += line;
        return result;
    }

    private void getAlerts(JSONObject result) {

        HttpClient httpClient;
        HttpGet getMethod;
        HttpResponse response;
        InputStream responseStream;

        try {
            httpClient = new DefaultHttpClient();
            getMethod = new HttpGet("http://www.multicast.ml/api/alerts?min=" + threshold);
            getMethod.addHeader("X-AUTH-TOKEN", getAuthToken());
            response = httpClient.execute(getMethod);
            responseStream = response.getEntity().getContent();
            try {
                String msg = convertInputStreamToString(responseStream);
                JSONArray notifications = new JSONArray(msg);
                if (notifications.length() > 0) {
                    this.unread = this.unread + notifications.length();
                    JSONObject last = (JSONObject) notifications.get(notifications.length() - 1);
                    long min = last.getLong("notificationId");
                    if (min > threshold) threshold = min;
                }
                result.put("notifications", notifications);
            } finally {
                responseStream.close();
                // Close out the response stream and any open connections in production code
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            // Do something with the error in production code
        }
    }

    @Override
    protected JSONObject getConfig() {
        JSONObject result = new JSONObject();
        try {
            result.put("authToken", getAuthToken());
            result.put("status", status);
            result.put("offMsg", offMsg);

        } catch (JSONException e) {

        }
        return result;
    }

    @Override
    protected void setConfig(JSONObject config) {
        try {
            if (config.has("authToken")) {
                setAuthToken(config.getString("authToken"));
            }

            if (config.has("threshold")) {
                this.threshold = config.getLong("threshold");
            }

            if (config.has("resetUnread")) {
                if (config.getBoolean("resetUnread")) {
                    this.unread = 0;
                }
            }

            /*if (config.has("status")) {
                offMsg = !status.equals(config.getString("status"));
                status = config.getString("status");
            }*/
        } catch (JSONException e) {

        }

    }

    @Override
    protected JSONObject initialiseLatestResult() {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    protected void onTimerEnabled() {
        this.unread = 0;
        // TODO Auto-generated method stub

    }

    @Override
    protected void onTimerDisabled() {
        // TODO Auto-generated method stub

    }

}
