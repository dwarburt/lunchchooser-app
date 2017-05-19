/*jslint browser:true, devel:true, white:true, vars:true, eqeq:true */
/*global intel:false, google:false, device:false, $:false*/

var debug = true;
window.lunchData = false;

function log(msg) {
    if (debug) {
        console.log(msg);
    }
}
function handlePosition(location) {
    $('.waiting-for-location').text("Finding lunch places...");
    var lon = location.coords.longitude;
    var lat = location.coords.latitude;
    var locationData = { lon: lon, lat: lat };

    getLunchData(locationData);
    log("Got this location: " + lon  + ", " + lat);
}
function noPositionAvailable() {
    //alert("Can't get position, please allow geolocation or use a compatible browser.");
    $('.waiting-for-location').hide();
    $('.location-entry').show();
}
function handleZipCodeEntry(e) {
    var locationData = $('#zipCode').val();
    $('.location-entry form').hide();
    getLunchData(locationData);
    e.preventDefault();
    return false;
}
function bootLunchChooser() {
    log("Booting chooser.");
    $('.location-entry form').submit(handleZipCodeEntry);

    if (intel.xdk.geolocation !== null) {
        intel.xdk.geolocation.getCurrentPosition(handlePosition, noPositionAvailable);
    } else {
        log("Get zipcode.");
    }
}

function setupHandlers() {
    $('#lunchlist li').click(function () {
        $(this).toggleClass('bad');
    });

}
function saveLunchData(lunchData, locationData) {
    /*
     * Stick it in a global for later
     */
    window.lunchData = lunchData;
    if (typeof localStorage === "undefined") {
        return;
    }
    if (localStorage.cachedLunchData) {
        /*
         * Don't overwrite the cache from the save method.  If the cache has expired the get 
         * function needs to clear it.
         */
        return;
    }
    localStorage.cachedLunchData = JSON.stringify({
        time: Date.now(),
        data: lunchData,
        location: locationData
    });
}
function getCachedLunchData(locationData) {
    if (typeof localStorage === "undefined") {
        return false;
    }
    if (!localStorage.cachedLunchData) {
        return false;
    }
    var cd = JSON.parse(localStorage.cachedLunchData);
    if (Date.now() - cd.time > 10 * 60 * 1000 /* ten minutes */) {
        delete localStorage.cachedLunchData;
        return false;
    }
    if (!locationData) {
        delete localStorage.cachedLunchData;
        return false;
    }

    if (locationData === cd.location)
        return cd.data;

    var tolerance = 0.001; /* 110 m */
    
    if (typeof locationData === "object" && typeof cd.location === "object") {
        if (Math.abs(locationData.lon - cd.location.lon) < tolerance) {
            if (Math.abs(locationData.lat - cd.location.lat) < tolerance) {
                return cd.data;
            }
        }
    }
    delete localStorage.cachedLunchData;
    return false;
}
function getLunchData(locationData) {
    var method;
    var sendData;
    if (typeof locationData == "string") {
        method = "http://www.lunchchooser.info/ajax/placesByZip";
        sendData = "zipCode=" + locationData;
    } else {
        method = "http://www.lunchchooser.info/ajax/places";
        sendData = locationData;
    }
    var cachedLunchData = getCachedLunchData(locationData);
    if (cachedLunchData) {
        console.log("Using lunch data from localStorage cache.");
        getLunchFun(locationData)(cachedLunchData);
    } else {
        $.ajax(method, { data: sendData }).done(getLunchFun(locationData));
    }
}

function getLunchFun(locationData) {
    return function(lunchData) {
        $('.waiting-for-location').hide();
        saveLunchData(lunchData, locationData);
        var lunchlist = $('#lunchlist');
        if (lunchData.businesses) {
            var biz_index = 0;
            lunchData.businesses.forEach(function(business) {
                var b = $('<span />');
                var bd = $('<li />');
                b.text(business.name);
                bd.append(b);
                bd.attr('data-biz-index', biz_index);
                biz_index++;
                lunchlist.append(bd);
            });
        } else if (lunchData.error) {
            alert(lunchData.error);
        }
        setupHandlers();
        $('#spin_button').show();
    };
}

var delay;
var countdown;
var countup;
$(function () {
    $('#spin_button').click(function () {
        clear_winner();
        countdown = random_iterations();
        delay = 1;
        countup = 0;
        $(this).text('Rolling...');
        $(this).attr('disabled', true);

        choose_one();
        return false;
    });
});

function weighted_choices() {
    var choices = [];
    $('#lunchlist li').each(function (i) {
        var weight = parseFloat($(this).css('font-size'));
        if (!$(this).hasClass('bad')) {
            for (var j = 0; j < weight ; j++) {
                choices.push(this);
            }
        }
    });
    return choices;
}

function random_li() {
    var choices = weighted_choices();

    var index = Math.random() * choices.length;
    index = Math.floor(index);

    return $(choices[index]);
}

function random_iterations() {
    var numChoices = weighted_choices().length;
    return Math.ceil(Math.random() * numChoices) + numChoices * 2;
}

function choose_one() {
    $('#lunchlist li.selected').removeClass('selected');
    var choices = weighted_choices();
    var thisOne = $(choices[countup % choices.length]);
    thisOne.addClass('selected');
    if (countdown % 30 === 0) {
        delay += 1;
    }
    countdown--; //= countdown - 16;
    countup++;  // += 16;
    if (countdown > 0) {
        setTimeout(choose_one, delay);
    } else {
        make_winner(thisOne);
        $('#spin_button').text("Roll again (wimp)").attr('disabled', false);
    }
}
function make_winner(thisOne) {
    $('div.answer span').text(thisOne.text() + "!");
    thisOne.removeClass('selected');
    thisOne.addClass('winner');
    var biz_index = thisOne.attr('data-biz-index');
    if (window.lunchData) {
        var my_guy = window.lunchData.businesses[biz_index];
        var ph = my_guy.display_phone;
        var img = my_guy.image_url;
        var addy = my_guy.location.display_address.join(', ');
        var machine_addy = function(l) { 
            return l.address.concat(l.city).concat(l.state_code).concat(l.postal_code).join(', '); 
        }(my_guy.location);
        var map_url = 'http://maps.google.com/?q='+machine_addy;
        var url = false;
        if (intel.xdk.isphone) {
            url = my_guy.mobile_url;
        } else {
            url = my_guy.url;
        }
        $('.answer .image').html($('<img>').attr('src', img));
        $('.answer .phone').html($('<a>').attr('href', 'tel://'+ph).text(ph));
        $('.answer .address').html($('<a>').attr('href', map_url).text(addy));
        $('.answer .yelp-link').html($('<a>').attr('href', url).text('Yelp link'));
    }
}
function clear_winner() {
    $('div.answer').children().each(function() { $(this).html(''); });
    $('.winner').addClass('bad').removeClass('winner');
}
