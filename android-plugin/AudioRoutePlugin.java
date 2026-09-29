package com.novira.app;

import android.content.Context;
import android.media.AudioManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioRoute")
public class AudioRoutePlugin extends Plugin {

    private AudioManager audioManager;

    @Override
    public void load() {
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }

    @PluginMethod
    public void setEarpiece(PluginCall call) {
        try {
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            audioManager.setSpeakerphoneOn(false);
            audioManager.stopBluetoothSco();
            audioManager.setBluetoothScoOn(false);
            JSObject ret = new JSObject();
            ret.put("route", "earpiece");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("fail: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setSpeaker(PluginCall call) {
        try {
            audioManager.setMode(AudioManager.MODE_NORMAL);
            audioManager.setSpeakerphoneOn(true);
            JSObject ret = new JSObject();
            ret.put("route", "speaker");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("fail: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setBluetooth(PluginCall call) {
        try {
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            audioManager.startBluetoothSco();
            audioManager.setBluetoothScoOn(true);
            audioManager.setSpeakerphoneOn(false);
            JSObject ret = new JSObject();
            ret.put("route", "bluetooth");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("fail: " + e.getMessage());
        }
    }

    @PluginMethod
    public void resetMode(PluginCall call) {
        try {
            audioManager.setMode(AudioManager.MODE_NORMAL);
            audioManager.setSpeakerphoneOn(false);
            audioManager.stopBluetoothSco();
            audioManager.setBluetoothScoOn(false);
            call.resolve(new JSObject());
        } catch (Exception e) {
            call.reject("fail: " + e.getMessage());
        }
    }
}