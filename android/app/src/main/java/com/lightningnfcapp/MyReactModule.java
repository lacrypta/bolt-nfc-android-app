package com.lightningnfcapp;

import static com.lightningnfcapp.Constants.TAG;


import com.facebook.react.*;
import com.facebook.react.bridge.*;
import java.util.*;
import android.app.*;
import android.util.Log;
import com.facebook.react.bridge.Callback;

/**
 * This class is just to pass function calls through from React Native
 * to the main activity. There might be a cleaner way of doing this. Not sure.
 */
public class MyReactModule extends ReactContextBaseJavaModule {

    public MyReactModule(ReactApplicationContext reactContext) {
        super(reactContext);
        Log.d(TAG, "reactContext");
    }

    @Override
    public String getName() {
        return getClass().getSimpleName();
    }

    @ReactMethod
    public void setCardMode(String cardmode) {
        MainActivity activity = (MainActivity) getCurrentActivity();
        if(activity != null) activity.setCardMode(cardmode);
    }

    @ReactMethod
    public void setNodeURL(String url) {
        MainActivity activity = (MainActivity) getCurrentActivity();
        if(activity != null) activity.setNodeURL(url);
    }

    //API v0 just returns 3 keys
    @ReactMethod
    public void changeKeys(
        String key0, 
        String key1, 
        String key2, 
        Callback callBack
    ) {
        MainActivity activity = (MainActivity) getCurrentActivity();
        if(activity != null) activity.changeKeys(key0, key1, key2, callBack);
    }

    //API v1 returns lnurl and 5 keys
    @ReactMethod
    public void changeKeys(
        String lnurlw_base, 
        String key0, 
        String key1, 
        String key2, 
        String key3, 
        String key4, 
        Callback callBack
    ) {
        MainActivity activity = (MainActivity) getCurrentActivity();
        if(activity != null) activity.changeKeys(lnurlw_base, key0, key1, key2, key3, key4, callBack);
    }

    

}