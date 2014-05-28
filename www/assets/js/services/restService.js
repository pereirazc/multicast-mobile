/**
 * Created by pereirazc on 18/05/14.
 */

'use strict';

function dummyErrorHandler(data) {
    //dummy
}

app
    .factory('Sensors', ['$resource',
        function ($resource) {
            return $resource('http://www.multicast.ml/sensors/:sensorId',
                {
                    sensorId: "@sensorId"
                },
                {
                    query: {
                        method:'GET',
                        interceptor: {

                        },
                        isArray: true
                    },
                    get: {
                        method:'GET',
                        interceptor: {

                        }
                    }
                }
            );

        }])

    .factory('Feeds', ['$resource',
        function ($resource) {
            return $resource('http://www.multicast.ml/sensors/:sensorId/feeds/:feedId',
                {
                    sensorId: "@sensorId",
                    feedId: "@feedId"
                },
                {
                    query: {
                        method:'GET',
                        interceptor: {

                        },
                        isArray: true
                    },
                    get: {
                        method:'GET',
                        interceptor: {

                        }
                    }
                }

            );
        }])
    .factory('Stream', ['$resource',
        function ($resource) {
            return $resource('http://www.multicast.ml/api/:sensorId/:feedId',
                {
                    sensorId: "@sensorId",
                    feedId: "@feedId"
                },

                {
                    query: {
                        method:'GET',
                            interceptor: {

                        },
                        isArray: true
                    }
                }

            );
        }])
    .factory('User', ['$resource',
        function ($resource) {
            return $resource('http://www.multicast.ml/user', {},

                {
                    get: {
                        method:'GET',
                        interceptor: {

                        }
                    }
                }



            );
        }])
    .factory('Login', ['$resource',
        function ($resource) {
            return $resource('http://www.multicast.ml/login', {},

                {
                    save: {
                        method:'POST',
                        interceptor: {

                        }
                    }
                }

            );
        }])
    .factory('Logout', ['$resource',
        function ($resource) {
            return $resource('http://www.multicast.ml/logout', {},

                {
                    save: {
                        method:'POST',
                        interceptor: {

                        }
                    }
                }

            );
        }])