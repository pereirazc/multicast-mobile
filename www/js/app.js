angular.module('multicast', ['ionic', 'multicast.controllers', 'multicast.services', 'highcharts-ng'])

    .run(function ($rootScope, $state, $ionicPlatform, $ionicLoading, $window, userService, connectionService, backgroundService, databaseService, dataService) {

        function getUpdate(data) {
            var notifications = data.LatestResult.notifications;

            if (notifications != undefined && notifications.length > 0) {
                dataService.saveNotifications(notifications).then(
                    function() {
                        console.log('notifications saved!');

                        dataService.countUnreadNotifications().then(
                            function(notifications) {

                                $ionicLoading.show(
                                    {
                                        template: notifications + " new notifications",
                                        noBackdrop: true,
                                        duration: 500
                                    }
                                )

                                $rootScope.$broadcast('unreadNotifications', notifications);
                            },
                            function() {

                            }
                        )

                    },
                    function (err) {
                        console.log(err);
                    }
                )
            } else {
                dataService.countUnreadNotifications().then(
                    function(notifications) {
                        $rootScope.$broadcast('unreadNotifications', notifications);
                    },
                    function() {

                    }
                )
            }
        }

        $ionicPlatform.ready(function () {
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }

            databaseService.init();

            connectionService.online.then( function(stat) {
                console.log(stat);
            });

            backgroundService.init();

            backgroundService.instance.getStatus(
                function(r) {
                    console.log('service status');
                    console.log(r);

                    if (!r.ServiceRunning) {

                        backgroundService.instance.startService(
                            function(r) {
                                console.log('service status');
                                console.log(r);

                                backgroundService.instance.registerForBootStart(
                                    function(r) {
                                        console.log('on boot');
                                        console.log(r);

                                        backgroundService.instance.enableTimer(20000,
                                            function(r) {
                                                backgroundService.instance.registerForUpdates(getUpdate);
                                            },
                                            function(e){

                                            });

                                        var token = userService.getToken();
                                        if (token!=null) {
                                            backgroundService.instance.setConfiguration(
                                                {
                                                    "authToken": token
                                                },
                                                function(r) {
                                                    console.log('service auth');

                                                    backgroundService.instance.getStatus(
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
                            backgroundService.instance.setConfiguration(config,
                                function(r) {
                                    console.log('service auth');
                                    backgroundService.instance.registerForUpdates(getUpdate);
                                },
                                function(e){

                                });
                        }


                    }

                }
            );

        });

        $rootScope.$on('$stateChangeSuccess',
            function(event, toState, toParams, fromState, fromParams){
                console.log('stateChangeSuccess to' + toState.name);

                console.log(toParams);

            }

        );

        $rootScope.$on('$stateChangeError',
            function(event, toState, toParams, fromState, fromParams, error) {
                console.log('$stateChangeError to' + toState.name);
                console.log(error);
            }
        );

        $rootScope.$on('$stateChangeStart', function(event, toState) {
			console.log('stateChangeStart: ' + toState.name);

            if (toState.name == "app.login" && userService.logged() ) {
                event.preventDefault();
            }

            if (toState.name !== "app.login" && toState.name !== "app.logout" && !userService.logged() ) {
                $state.go('app.login');
                event.preventDefault();
            }
        });

    })

    .factory('authInterceptor', function ($injector, $rootScope, $q, $window, $location) {
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
                    $location.path('/app/login');
                }
                return response || $q.when(response);
            }
        };
    })

    .config(function($httpProvider) {

        $httpProvider.interceptors.push('authInterceptor');
    })

    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider

            .state('app', {
                url: "/app",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: "AppCtrl"
            })

            .state('app.login', {
                url: "/login",
                views: {
                    'menuContent': {
                        templateUrl: "templates/login.html",
                        controller: "LoginCtrl"
                    }
                }
            })

            .state('app.logout', {
                url: "/logout",
                views: {
                    'menuContent': {
                        templateUrl: "templates/logout.html",
                        controller: "LogoutCtrl"
                    }
                }
            })
            /*
             .state('app.profile', {
             url: "/profile",
             views: {
             'menuContent': {
             templateUrl: "templates/profile.html",
             controller: "ProfileCtrl"
             }
             }
             })

             .state('app.share', {
             url: "/share",
             views: {
             'menuContent': {
             templateUrl: "templates/share.html",
             controller: "ShareCtrl"
             }
             }
             })*/

             .state('app.feed', {
                 url: "/:sensorId/:feedId/graph",
                 views: {
                 'menuContent': {
                    templateUrl: "templates/feed.html",
                    controller: "FeedDetailsCtrl"
                    }
                 }
             })

           /*.state('app.alerts', {
                url: "/alerts",
                views: {
                    'menuContent': {
                        templateUrl: "templates/alerts.html",
                        controller: "AlertCtrl"
                    }
                }
            })*/
            /*
             .state('app.mutualfriends', {
             url: "/person/:personId/mutualfriends",
             views: {
             'menuContent': {
             templateUrl: "templates/mutual-friend-list.html",
             controller: "MutualFriendsCtrl"
             }
             }
             })
             .state('app.person', {
             url: "/person/:personId",
             views: {
             'menuContent': {
             templateUrl: "templates/person.html",
             controller: "PersonCtrl"
             }
             }
             })*/
            .state('app.home', {
                url: "/home",
                views: {
                    'menuContent': {
                        templateUrl: "templates/home.html",
                        controller: "HomeCtrl"
                    }
                }
            })
            .state('app.alerts', {
                url: "/alerts",
                abstract: true,
                views: {
                    'menuContent': {
                        templateUrl: "templates/alertsTab.html"
                    }
                }
            })
            .state('app.alerts.unread', {
                url: "/unread",
                views: {
                    'unread-tab': {
                        templateUrl: "templates/unreadAlerts.html",
                        controller: 'UnreadAlertsCtrl'
                    }
                }
            })
            .state('app.alerts.all', {
                url: "/all",
                views: {
                    'all-tab': {
                        templateUrl: "templates/alerts.html",
                        controller: 'AlertsCtrl'
                    }
                }
            });

        // fallback route
        $urlRouterProvider.otherwise('/app/home');


    });

