/*jslint browser:true, devel:true, white:true, vars:true, eqeq:true */
/*global intel:false, google:false*/
window.device = {
    is: function(devName) {
        if (intel.xdk.device.platform.indexOf(devName) != -1) {
            return true;
        }
        return false;
    }
};
