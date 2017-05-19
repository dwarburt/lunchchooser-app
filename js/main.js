/*jslint browser:true, devel:true, white:true, vars:true, eqeq:true */
/*global intel:false, google:false, device:false, bootLunchChooser:false*/

//Execute when the DOM loads
//The Intel XDK intel.xdk.device.ready event fires once the Intel XDK has fully loaded. 
//After the device has fired, you can safely make calls to Intel XDK function.    

function onDeviceReady() {
    try {
        if (device.is("Android")) {
            intel.xdk.display.useViewport(480, 480);
        } else if (device.is("iOS")) {
            if (intel.xdk.device.model.indexOf("iPhone") != -1 || intel.xdk.device.model.indexOf("iPod") != -1) {
                intel.xdk.display.useViewport(320, 320);
            } else if (device.is("iPad")) {
                intel.xdk.display.useViewport(768, 768);
            }
        }
    } catch (e) {
        alert(e.message);
    }
    try {
        //lock orientation
        intel.xdk.device.setRotateOrientation("portrait");
        intel.xdk.device.setAutoRotate(false);
    } catch (e) {}
    try {
        //manage power
        intel.xdk.device.managePower(true, false);
    } catch (e) {}
    try {
        //hide splash screen
        intel.xdk.device.hideSplashScreen();
    } catch (e) {}
    bootLunchChooser();
}

document.addEventListener("intel.xdk.device.ready", onDeviceReady, false);