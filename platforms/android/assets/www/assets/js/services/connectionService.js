/**
 * Created by pereirazc on 18/05/14.
 */

'use strict';

app.service('connectionService', ['$rootScope', '$window', '$q',
    function($rootScope, $window, $q) {
        var d = $q.defer(),
            resolved = false;

        this.online = d.promise;

        $window.addEventListener("offline", function() {
            $rootScope.$apply(function() {

                console.log('App is offline');

                var myService = cordova.require('cordova/plugin/Service');
                var config = {
                    "status": "offline"
                };
                myService.setConfiguration(config,
                    function(r) {
                        console.log('service offline');
                        console.log(r);
                    },
                    function(e){

                    }
                );

                $rootScope.loading = true;
            });
            resolved = true;
            d.resolve(false);
         });

         $window.addEventListener("online", function() {
            $rootScope.$apply(function() {
                console.log('App is online');

                var myService = cordova.require('cordova/plugin/Service');
                var config = {
                    "status": "online"
                };
                myService.setConfiguration(config,
                    function(r) {
                        console.log('service online');
                        console.log(r);
                    },
                    function(e){

                    }
                );

                $rootScope.loading = false;
            });
            resolved = true;
            d.resolve(true);
         });


    }
]);