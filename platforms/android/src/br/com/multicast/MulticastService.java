package br.com.multicast;

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

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.TaskStackBuilder;
import android.util.Log;

import android.R;

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

public class MulticastService extends BackgroundService {

    private final static String TAG = MulticastService.class.getSimpleName();

    private String authToken = "";
    private String status = "offline";
    private Boolean offMsg = false;
    private int workCounter = 0;

    public void showNotification( String contentTitle, String contentText ) {

        Notification.Builder mBuilder =
                new Notification.Builder(this)
                        .setSmallIcon(R.drawable.ic_lock_lock)
                        .setContentTitle(contentTitle)
                        .setContentText(contentText);

        // Creates an explicit intent for an Activity in your app
        Intent resultIntent = new Intent(this, ServiceActivity.class);

        // The stack builder object will contain an artificial back stack for the
        // started Activity.
        // This ensures that navigating backward from the Activity leads out of
        // your application to the Home screen.
        TaskStackBuilder stackBuilder = TaskStackBuilder.create(this);

        // Adds the back stack for the Intent (but not the Intent itself)
        stackBuilder.addParentStack(ServiceActivity.class);
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
        workCounter++;

        JSONObject result = new JSONObject();
        try {

            if (this.status.equals("offline")) {
                if  (this.offMsg) {
                    String a = "Lost connectivity...";
                    showNotification("Multicast", a);
                    result.put("notification", a);
                    this.offMsg = false;
                }
            } else if (!this.authToken.equals("")) {

                //getAlerts(result);

            }

            getAlerts(result);

        } catch (JSONException e) {

        }

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
            getMethod = new HttpGet("http://www.multicast.ml/api/alertz");
            getMethod.addHeader("X-AUTH-TOKEN", authToken);
            response = httpClient.execute(getMethod);
            responseStream = response.getEntity().getContent();
            try {
                String msg = convertInputStreamToString(responseStream);
                result.put("alerts", new JSONArray(msg));
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
            result.put("authToken", authToken);
            result.put("status", status);
            result.put("offMsg", offMsg);
            result.put("workCounter", workCounter);

        } catch (JSONException e) {
        }
        return result;
    }

    @Override
    protected void setConfig(JSONObject config) {
        try {
            if (config.has("authToken")) authToken = config.getString("authToken");
            if (config.has("status")) {
                status = config.getString("status");
                offMsg = (status.equals("offline"));
            }
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
        // TODO Auto-generated method stub

    }

    @Override
    protected void onTimerDisabled() {
        // TODO Auto-generated method stub

    }

}
