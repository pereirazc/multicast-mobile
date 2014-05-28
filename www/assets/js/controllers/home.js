/**
 * Created by pereirazc on 18/05/14.
 */

'use strict'

app.controller('HomeCtrl', ['$rootScope', '$scope', 'Sensors', 'Feeds', 'Stream',

    function($rootScope, $scope, Sensors, Feeds, Stream) {

        $scope.sensors = [];

        $rootScope.loading = true;

        Sensors.query().$promise.then(
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

                                s.feeds.forEach(
                                    function(f) {
                                        Stream.query({sensorId: s.sensorId, feedId: f.feedId}).$promise.then(
                                            function(data) {
                                                console.log('stream');
                                                console.log(data);
                                                f.stream = data[29];
                                                if (s.feeds[s.feeds.length - 1] == f) $rootScope.loading = false;
                                            },
                                            function(e) {
                                                $rootScope.loading = false;
                                            }
                                        )
                                    }
                                )
                            },
                            function(e) {
                                $rootScope.loading = false;
                            }
                        )
                    }
                )

            },
            function () {
                $rootScope.loading = false;
            }
        );


    }
]);




