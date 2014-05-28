/**
 * Created by pereirazc on 19/05/14.
 */

'use strict';



app

    .factory('push',['$window', function ($window) {
        return {
            registerPush: function (fn) {
                    var pushNotification = $window.plugins.pushNotification;

                    var successHandler = function (result) {
                                            console.log(result);
                                        };
                    var errorHandler =  function (error) {

                                            console.log(error);
                                        };

                    //if (window.device.platform == 'android' || window.device.platform == 'Android') {
                        pushNotification.register(successHandler, errorHandler, {
                            'senderID': 'AIzaSyBssTeMKo7N1vViSTWdwMNhSBe0SPvOHms',
                            'ecb': 'onNotificationGCM'
                        });
                    //}
            }
        };
    }]);