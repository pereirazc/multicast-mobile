angular.module('multicast.controllers', ['multicast.services', 'highcharts-ng'])

    .controller('AppCtrl',function ($state, $scope, $ionicLoading, userService) {

        $scope.logout = function () {

            $scope.loading = $ionicLoading.show({
                content: 'Signing out...'
            });

            setTimeout(function() {
                    userService.logout().then(
                        function() {
                            $scope.user = undefined;
                            $scope.loading.hide();
                            $state.go('app.login');
                        },
                        function() {
                            $scope.user = undefined;
                            $scope.loading.hide();
                            $state.go('app.login');
                        }
                    );
                }
                ,1250);
        };

    })

    .controller('LoginCtrl',

    function($state, $rootScope, $scope, $ionicSideMenuDelegate, $ionicLoading, userService ) {

        $ionicSideMenuDelegate.canDragContent(false);

        $scope.credentials = {};

        $scope.credentials.email = window.localStorage.getItem('email');
        $scope.credentials.password = window.localStorage.getItem('password');

        $scope.login = function() {

            window.localStorage.setItem('email', $scope.credentials.email);
            window.localStorage.setItem('password', $scope.credentials.password);

            $scope.loading = $ionicLoading.show({
                content: 'Signing in...'
            });

            setTimeout(function() {
                    userService.loginUser($scope.credentials).then(
                        function() {
                            $scope.loading.hide();
                            $state.go('app.home');

                        },
                        function() {
                            $scope.loading.hide();
                            alert('login failed');
                        }
                    );
                }
            ,1250);

        };

    })

/*    .controller('ShareCtrl', function ($scope, OpenFB) {

        $scope.item = {};

        $scope.share = function () {
            OpenFB.post('/me/feed', $scope.item)
                .success(function () {
                    $scope.status = "This item has been shared on OpenFB";
                })
                .error(function(data) {
                    alert(data.error.message);
                });
        };

    })

    .controller('ProfileCtrl', function ($scope, OpenFB) {
        OpenFB.get('/me').success(function (user) {
            $scope.user = user;
        });
    })

    .controller('PersonCtrl', function ($scope, $stateParams, OpenFB) {
        OpenFB.get('/' + $stateParams.personId).success(function (user) {
            $scope.user = user;
        });
    })

    .controller('FriendsCtrl', function ($scope, $stateParams, OpenFB) {
        OpenFB.get('/' + $stateParams.personId + '/friends', {limit: 50})
            .success(function (result) {
                $scope.friends = result.data;
            })
            .error(function(data) {
                alert(data.error.message);
            });
    })

    .controller('MutualFriendsCtrl', function ($scope, $stateParams, OpenFB) {
        OpenFB.get('/' + $stateParams.personId + '/mutualfriends', {limit: 50})
            .success(function (result) {
                $scope.friends = result.data;
            })
            .error(function(data) {
                alert(data.error.message);
            });
    })*/

    .controller('FeedCtrl', function ($scope, $ionicSideMenuDelegate,dataService) {

        function formatDate(timestamp) {

            return moment(timestamp).fromNow();

            /*var d = new Date(timestamp);
            var format = '';
            if (d.getHours() < 10) format = format + '0';
            format = format + d.getHours() + ':';
            if (d.getMinutes() < 10) format = format + '0';
            format = format + d.getMinutes() + ':';
            if (d.getSeconds() < 10) format = format + '0';
            format = format + d.getSeconds();
            return format;*/
        }

        $scope.init = function (sensorId, feedId) {
            console.log('feed controller initialized');
            $scope.ok=false;
            $scope.sensorId = sensorId;
            $scope.feedId = feedId;
            $scope.last = undefined;

            setTimeout(
                function() {

                    dataService.getFeedStream($scope.sensorId, $scope.feedId, false, 1).then(
                        function (data) {
                            console.log('stream');
                            console.log(data);
                            var last = {};
                            last.timestamp = formatDate(data[0].x);
                            last.value = data[0].y;
                            last.alerts = [];
                            $scope.last = last;
                            $scope.ok=true;
                        },
                        function (e) {

                        }
                    );

                    /*Stream.query({sensorId: $scope.sensorId, feedId: $scope.feedId }).$promise.then(
                        function (data) {
                            console.log('stream');
                            console.log(data);
                            var last = {};
                            var d = new Date(data[data.length - 1].x);

                            last.timestamp = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
                            last.value = data[data.length - 1].y;
                            last.alerts = [];
                            $scope.last = last;
                            $scope.ok=true;
                        },
                        function (e) {

                        }
                    )*/

                }
                , 1000);

        }

    })

    .controller('FeedDetailsCtrl', function ($scope, $stateParams, $ionicSideMenuDelegate, $timeout, $ionicLoading, dataService) {

        $ionicSideMenuDelegate.canDragContent(false);

        $scope.show = function() {
            $scope.loading = $ionicLoading.show({
                content: 'Loading feed...'
            });
        };
        $scope.hide = function(){

            $scope.loading.hide();
        };

        $scope.show();

        dataService.getFeedById($stateParams.sensorId, $stateParams.feedId).then(
                        function (data) {
                            $scope.feed = data;
                            $scope.hide();
                        },
                        function (err) {
                            $scope.hide();
                        }
                    );

        var minute = 60000;

        $scope.sensorId = $stateParams.sensorId;
        $scope.feedId = $stateParams.feedId;

        console.log("timezoneOffset");
        Highcharts.setOptions({
            global: {
                timezoneOffset: (new Date()).getTimezoneOffset()
            }
        });

        $scope.timeWindowOpts = [
            {id: 1, secs: minute, label: "1 Minuto"},
            {id: 2, secs: 2*minute, label: "2 Minutos"},
            {id: 3, secs: 5*minute, label: "5 Minutos"},
            {id: 4, secs: 10*minute, label: "10 Minutos"},
            {id: 5, secs: 30*minute, label: "30 Minutos"},
            {id: 6, secs: 60*minute, label: "1 Hora"}
        ];

        $scope.currentTimeWindow = $scope.timeWindowOpts[0];

        $scope.updateTimeWindow = function () {
            $scope.chartConfig.xAxis.currentMin = max  - $scope.currentTimeWindow.secs;
            $scope.chartConfig.xAxis.currentMax = max;
        }

        var max;
        //var stream = [];

        $scope.stream = [];

        $scope.chartConfig = {
            options: {

                global: {
                    useUTC: false
                },



                chart: {
                    type: 'line',
                    zoomType: 'x'
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                name: "",

                color: '#7ECE25',

                data: (function() {

                    var stream = [];

                    dataService.getFeedStream($scope.sensorId, $scope.feedId, true, 30).then(
                        function(data) {


                            console.log('chart');
                            console.log(data);

                            stream = data;

                            var series = $scope.chartConfig.series[0];

                            if (stream.length > 0) {
                                max = stream[stream.length - 1].x;
                            } else max = (new Date()).getTime();

                            series.data = stream;

                            $scope.chartConfig.xAxis.currentMin = max  - minute;
                            $scope.chartConfig.xAxis.currentMax = max;

                            $scope.timer = $timeout($scope.updateGraph, 5000);

                        },
                        function (e) {

                        }
                    );
                    return stream;
                })()
            }],
            title: {
                text: ''
            },
            xAxis: {
                currentMin: max - 60000,
                currentMax: max,
                type: 'datetime',
                tickPixelInterval: 150

            },

            loading: false
        }

        $scope.updateGraph = function () {

            if ($scope.feedId!=undefined) {

                dataService.getFeedStream($scope.sensorId, $scope.feedId, true, 30).then(
                    function(data) {

                        $scope.stream = data;

                        var series = $scope.chartConfig.series[0];

                        if ($scope.stream.length > 0) {
                            max = $scope.stream[$scope.stream.length - 1].x;
                        } else max = (new Date()).getTime();

                        series.data = $scope.stream;

                        $scope.chartConfig.xAxis.currentMin = max  - minute;
                        $scope.chartConfig.xAxis.currentMax = max;

                        $scope.timer = $timeout($scope.updateGraph, 5000);

                    },
                    function (e) {

                    }
                );

            }

        }
        $scope.pauseStream = function () {
            $timeout.cancel($scope.timer);
        }


    })

    .controller('UnreadAlertsCtrl', function ($scope, $state, $stateParams, $ionicPopup, $ionicLoading, backgroundService, dataService) {

        $scope.showMarkAsRead = false;

        $ionicLoading.show({
            template: 'loading unread notifications...'
        });

        $scope.watchFeed = function(notification) {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Watch Feed?'
            });
            confirmPopup.then(function(res) {
                if(res) {
                    $state.go('app.feed', { sensorId: notification.sensorId, feedId: notification.feedId })

                }
            });
        };

        $scope.getDate = function (timestamp) {
            return moment(timestamp).format("DD/MM/YYYY HH:mm:ss");
        }

        $scope.getDescription = function(notification) {

            var description = '';

            description = description + notification.feedId + ' from ' + notification.sensorLabel + ' has ';

            if (notification.type == 'START') {
                description = description + 'entered the alert zone.';
            } else {
                description = description + 'exited the alert zone.';
            }

            return description;
        }

        dataService.getUnreadNotifications().then(
            function (notifications) {
                console.log(notifications);
                $scope.notifications = notifications;
                $ionicLoading.hide();

                backgroundService.instance.setConfiguration(
                    {
                        "resetUnread": true
                    },
                    function(r) {
                        backgroundService.instance.enableTimer(20000,
                            function(r) {
                                console.log(r);
                            },
                            function(e){
                                console.log(e);
                            });
                    },
                    function(e){

                    });
            },
            function(err) {
                console.log(err);
                $ionicLoading.hide();
            }
        )

        $scope.markAsRead= function(notification) {

        }

    })

    .controller('AlertsCtrl', function ($scope, $stateParams, $ionicLoading, dataService) {

        $ionicLoading.show({
            template: 'loading all notifications...'
        });

        $scope.getDate = function (timestamp) {
            return moment(timestamp).format("DD/MM/YYYY HH:mm:ss");
        }

        $scope.getDescription = function(notification) {

            var description = '';

            description = description + notification.feedId + ' from ' + notification.sensorLabel + ' has ';

            if (notification.type == 'START') {
                description = description + 'entered the alert zone.';
            } else {
                description = description + 'exited the alert zone.';
            }

            return description;
        }

        dataService.getAllNotifications().then(
            function (notifications) {
                $scope.notifications = notifications;
                $ionicLoading.hide();
            },
            function(err) {
                console.log(err);
                $ionicLoading.hide();
            }
        )

    })

    .controller('SideMenuCtrl', function ($scope, $rootScope, $state) {

        /*dataService.getUnreadNotifications().then(
            function(notifications) {
                $scope.unreadNotifications = notifications;
            },
            function() {

            }
        )*/

        $scope.goTo = function() {

            $state.go('app.alerts.unread');

        }

        $scope.unreadNotifications = 0;

        $rootScope.$on('unreadNotifications',
            function(event, data) {
                $scope.unreadNotifications = data;
            }
        );

    })

    .controller('HeaderCtrl', function ($scope, $rootScope) {

        $rootScope.online = false;

    })

    .controller('HomeCtrl', function ($scope, $stateParams, $ionicSideMenuDelegate, $ionicLoading, /*Sensors,*/ dataService) {

        $ionicSideMenuDelegate.canDragContent(true);

        $scope.show = function() {
            $scope.loading = $ionicLoading.show({
                content: 'Loading dashboard...'
            });
        };
        $scope.hide = function(){

            $scope.loading.hide();
        };

        $scope.doRefresh = function() {
            $scope.getData();
        };

        $scope.getData = function () {

            $scope.sensors = {};
            $scope.show();

            dataService.getAllSensors().then(
                function (sensors) {
                    var c = 0;
                    console.log('sensors');
                    console.log(sensors);
                    $scope.sensors = sensors;
                    $scope.sensors.forEach(
                        function(sensor) {
                            dataService.getSensorById(sensor.sensorId).then(
                                function(data) {
                                    c++;
                                    sensor.feeds = data.feeds;
                                    if (c == $scope.sensors.length) $scope.hide();
                                },
                                function() {
                                    $scope.hide();
                                }
                            )
                        }
                    )
                },
                function () {
                    $scope.hide();
                }
            );

            /*Sensors.query().$promise.then(
                function (data) {
                    console.log('sensors');
                    console.log(data);
                    $scope.sensors = data;
                    $scope.sensors.forEach(
                        function (s) {
                            Sensors.get({sensorId: s.sensorId}).$promise.then(
                                function (data) {

                                    console.log('feeds');
                                    console.log(data);

                                    s.feeds = data.feeds;

                                    $scope.$broadcast('scroll.refreshComplete');
                                    $scope.hide();*/

                                    /*s.feeds.forEach(
                                        function (f) {
                                            Stream.query({sensorId: s.sensorId, feedId: f.feedId}).$promise.then(
                                                function (data) {
                                                    console.log('stream');
                                                    console.log(data);
                                                    f.last = {};
                                                    var d = new Date(data[data.length - 1].x);
                                                    f.last.timestamp = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
                                                    f.last.value = data[data.length - 1].y;
                                                    f.alerts = [];
                                                    if (s.feeds[s.feeds.length - 1] == f) $scope.hide();
                                                    $scope.sensors = sensors;
                                                    $scope.$broadcast('scroll.refreshComplete');
                                                },
                                                function (e) {
                                                    $scope.hide();
                                                    $scope.$broadcast('scroll.refreshComplete');
                                                }
                                            )
                                        }
                                    )*/
/*                                },
                                function (e) {
                                    $scope.$broadcast('scroll.refreshComplete');
                                    $scope.hide();

                                }
                            )
                        }
                    )

                },
                function () {
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.hide();
                }
            );*/
        };

        $scope.getData();

    });