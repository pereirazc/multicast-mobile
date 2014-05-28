/**
 * Created by pereirazc on 18/05/14.
 */

document.addEventListener('deviceready', function() {
    console.log('device is ready... start angular...');
    angular.bootstrap(document, ['MulticastSensor']);
});

var app = angular.module('MulticastSensor', [
    "ngRoute",
    "ngResource",
    "ngTouch",
    'ngCookies',
    "mobile-angular-ui"
]);

app.config(function($routeProvider) {
    $routeProvider.when('/home',        {templateUrl: "assets/partials/home2.html", controller: 'HomeCtrl', access: { isFree: false } });
    $routeProvider.when('/login',       {templateUrl: "assets/partials/login.html", controller: 'LoginCtrl', access: { isFree: true } });
    $routeProvider.when('/settings',    {templateUrl: "assets/partials/settings.html", controller: 'SettingsCtrl', access: { isFree: true }});
});

app.factory('authInterceptor',['$injector', '$rootScope', '$q', '$window', '$location', function ($injector, $rootScope, $q, $window, $location) {
    return {
        request: function (config) {

            config.headers = config.headers || {};
            var token = $injector.get('userService').getToken();
            if (token != undefined) {
                config.headers['X-AUTH-TOKEN'] = token;
            }
            return config;
        },

        responseError: function(response) {
            if (response.status === 401) {
                // handle the case where the user is not authenticated
                $injector.get('userService').cleanAuth();
                $location.path('/login');
            }
            return response || $q.when(response);
        }
    };
}]);

app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
});

function onNotificationGCM(event) {
    console.log("aaaaa");
    switch (event.event) {
        case 'registered':

            console.log("aaaaa");

            if (event.regid.length > 0) {

                console.log(event.regid);

                return fn({
                    'type': 'registration',
                    'id': event.regid,
                    'device': 'android'
                });
            }
            break;

        case 'message':
            if (event.foreground) {
                var soundfile = event.soundname || event.payload.sound;
                var my_media = new Media("/android_asset/www/" + soundfile);
                my_media.play();
            } else {
                if (event.coldstart) {

                } else {

                }
            }
            break;

        case 'error':
                console.log("aaaaa");
            break;

        default:
            break;
    }
};

app.run(['$rootScope', 'cordovaService', 'databaseService', 'connectionService', 'userService', 'backService' , function($rootScope, cordovaService, databaseService, connectionService, userService, backService) {
    console.log('running...');
    cordovaService.ready.then(function() {
            console.log('device is ready');
            databaseService.initDB();

            connectionService.online.then( function(stat) {

                console.log(stat);

                if (stat) {

                    var pushNotification = window.plugins.pushNotification;

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
                }

            });

            backService.back = cordova.require('cordova/plugin/Service');

            backService.back.getStatus(
                function(r) {
                    console.log('service status');
                    console.log(r);

                    if (!r.ServiceRunning) {

                        backService.back.startService(
                            function(r) {
                                console.log('service status');
                                console.log(r);

                                backService.back.registerForBootStart(
                                    function(r) {
                                        console.log('on boot');
                                        console.log(r);

                                        backService.back.enableTimer(10000,
                                            function(r){
                                                backService.back.registerForUpdates(
                                                    function(data){
                                                        console.log(data);
                                                        console.log(data.LatestResult);
                                                    });

                                            },
                                            function(e){

                                            });


                                        var token = userService.getToken();

                                        if (token!=null) {

                                            var config = {
                                                "authToken": token
                                            };
                                            backService.back.setConfiguration(config,
                                                function(r) {
                                                    console.log('service auth');

                                                    backService.back.getStatus(
                                                        function(r) {
                                                            console.log('service status');
                                                            console.log(r);
                                                        });

                                                },
                                                function(e){

                                                });

                                        }
                                    },
                                    function(e){

                                    }
                                );
                            },
                            function(e){
                                console.log('service error');
                                console.log(e);

                            }
                        );

                    } else {

                        var token = userService.getToken();

                        if (token!=null) {

                            var config = {
                                "authToken": token
                            };
                            backService.back.setConfiguration(config,
                                function(r) {
                                    console.log('service auth');

                                    backService.back.getStatus(
                                        function(r) {
                                            console.log('service status');
                                            console.log(r);
                                        });

                                },
                                function(e){

                                });
                        }


                    }

                }
            );

        }
    );
}
]);

app.controller('MainCtrl', ['$window', '$scope', '$rootScope', '$location', 'userService',

    function($window, $scope, $rootScope, $location, userService) {

        $location.path("/home");

        $scope.logout = function() {

            $rootScope.toggle('mainSidebar');

            $rootScope.loading = true;

            userService.logout().then(
                function() {
                    $scope.user = undefined;
                    $location.path("/login");
                },
                function() {
                    $scope.user = undefined;
                    $location.path("/login");
                }
            );
        };

        $scope.$watch(function() {
            var user = userService.getUser();
            return user;
        }, function(user) {
            if (user===null) {
                $location.path("/login");
            } else {
                $location.path("/home");
                $scope.user = user;
            }
        }, true);

        /*$window.addEventListener("offline", function() {
            $rootScope.$apply(function() {
                console.log('App is offline');
                $rootScope.online = false;
            });
        }, false);
        $window.addEventListener("online", function() {
            $rootScope.$apply(function() {
                console.log('App is online');
                $rootScope.online = true;
            });
        }, false);*/

        $rootScope.$on("$routeChangeStart", function(){
            $rootScope.loading = true;
        });
        $rootScope.$on("$routeChangeSuccess", function(){
            $rootScope.loading = false;
        });
    }

]);
