angular.module('multicast.services', ['ngResource'])

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

    .service('backgroundService',
        function() {
            this.instance = undefined;

            this.init = function () {
                var serviceName = 'br.com.multicast.mobile.MulticastService';
                var factory = cordova.require('com.red_folder.phonegap.plugin.backgroundservice.BackgroundService')
                this.instance = factory.create(serviceName);
            }
        }
    )


    .service('userService',
        function(User, Login, Logout, backgroundService) {

            var self = this;
            self.user;
            self.token;

            self.logged = function () {
                return self.getToken() != undefined;
            }

            self.loginUser = function(credentials) {

                console.log(credentials);

                return Login.save(credentials).$promise.then(function(response) {
                    self.token = response.authToken;
                    window.localStorage.setItem("authToken", self.token);

                    var config = {
                        "authToken": self.token
                    };

                    backgroundService.instance.setConfiguration(config,
                        function(r) {
                            console.log('service auth');
                            console.log(r);
                        },
                        function(e){

                        });


                    console.log(User.get({}));
                    return User.get({}).$promise;
                }).then(function(response) {
                    console.log(response);
                    self.user = response;
                    window.localStorage.setItem("user", JSON.stringify(self.user));
                    return self.user;
                });
            };

            self.cleanAuth = function() {
                self.token  = undefined;
                self.user   = undefined;
                window.localStorage.removeItem("authToken");
                window.localStorage.removeItem("user");

                var config = {
                    "authToken": ""
                };

                backgroundService.instance.setConfiguration(config,
                    function(r) {
                        console.log('service unauth');
                    },
                    function(e){

                    });

            }

            self.logout = function() {
                return Logout.save().$promise.then(
                    function() {
                        self.cleanAuth();
                    },
                    function() {
                        self.cleanAuth();
                    }
                )
            };

            self.getToken = function() {
                //console.log('getting token...');
                if (self.token===undefined) {
                    self.token = window.localStorage.getItem("authToken");
                }
                return self.token;
            }

            self.getUser = function() {
                if (self.user===undefined) {
                    self.user = JSON.parse(window.localStorage.getItem("user"));
                }
                return self.user;
            };


        }
    )

    .service('connectionService',
        function($rootScope, $window, $q, $ionicLoading, backgroundService) {
            var d = $q.defer(),
                resolved = false;

            this.online = d.promise;

            $window.addEventListener("offline", function() {
                $rootScope.$apply(function() {
                    console.log('App is offline');

                    if (backgroundService.instance != undefined) {
                        backgroundService.instance.setConfiguration(
                            {
                                "status": "offline"
                            },
                            function(r) {
                                console.log('service offline');
                                console.log(r);
                            },
                            function(e){

                            }
                        );
                    }

                    $ionicLoading.show({
                        template: 'Multicast is offline...',
                        noBackdrop: true,
                        duration: 2000
                    })
                    $rootScope.online = false;
                    /*$rootScope.message = $ionicLoading.show({
                        content: 'Multicast is offline...'
                    });
                    $rootScope.online = false;
                    setTimeout(
                        function() {
                            $rootScope.message.hide();
                        }
                        ,2000);*/

                });
                resolved = true;
                d.resolve(false);
            });

            $window.addEventListener("online", function() {
                $rootScope.$apply(function() {
                    console.log('App is online');

                    if (backgroundService.instance != undefined) {
                        backgroundService.instance.setConfiguration(
                            {
                                "status": "online"
                            },
                            function (r) {
                                console.log('service online');
                                console.log(r);
                            },
                            function (e) {

                            }
                        );
                    }

                    $rootScope.online = true;
                    $ionicLoading.show({
                        template: 'Multicast is online...',
                        noBackdrop: true,
                        duration: 2000
                    })


                    /*$rootScope.message = $ionicLoading.show({
                        content: 'Multicast is online...'
                    });
                    $rootScope.online = true;
                    setTimeout(
                        function() {
                            $rootScope.message.hide();
                        }
                        ,1000);*/


                });
                resolved = true;
                d.resolve(true);
            });


        }
    )

    .service('databaseService',

        function($q) {

            var self = this;

            var deferred = $q.defer();

            self.db = deferred.promise;

            self.init = function () {

                var db = window.openDatabase( "DB", "1.0", "test DB", 100000);
                db.transaction(
                    function(tx) {
                        tx.executeSql(  'CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, username TEXT, password TEXT)');//, [] , function (tx, res) {
                        tx.executeSql(  'CREATE TABLE IF NOT EXISTS sensor (id TEXT PRIMARY KEY, label TEXT, description TEXT)');//, [] , function (tx, res) {
                        tx.executeSql(  'CREATE TABLE IF NOT EXISTS feed (id TEXT PRIMARY KEY, label TEXT, sensorId TEXT, description TEXT)');//, [] , function (tx, res) {
                        tx.executeSql(  'CREATE TABLE IF NOT EXISTS alert_config (id TEXT PRIMARY KEY, status BOOLEAN, min REAL, max REAL, sensorId TEXT)');//, [] , function (tx, res) {
                        tx.executeSql(  'CREATE TABLE IF NOT EXISTS feed_data (timestamp INTEGER, feedId TEXT, value REAL, PRIMARY KEY(timestamp, feedId))');//, [] , function (tx, res) {
                        tx.executeSql(  'CREATE TABLE IF NOT EXISTS notification (id INTEGER PRIMARY KEY, timestamp INTEGER, notification TEXT, read INTEGER)');//, [] , function (tx, res) {
                        //tx.executeSql(  'CREATE TABLE IF NOT EXISTS notification (id INTEGER PRIMARY KEY, timestamp INTEGER, active INTEGER, start INTEGER, finish INTEGER)');//, [] , function (tx, res) {
                    }
                );
                deferred.resolve(db);
            }


        }
    )

    .factory('dataService', function($q, connectionService, databaseService, Sensors, Feeds, Stream) {

            function toArray(rows) {
                var array = [];
                for (var i=0; i<rows.length; i++) {
                    array.push(rows.item(i));
                }
                return array;
            }

            function getNotification(item) {
                var notification = JSON.parse(unescape(item.notification));
                notification.read = (item.read != 0);
                return notification;
            }

            return {

                getAllSensors: function() {
                    var deferred = $q.defer();

                    function dataReady() {
                        console.log('dataReady');

                        var _SELECT_SENSORS = "SELECT id AS sensorId, label, description FROM sensor";

                        databaseService.db.then(
                            function (db) {
                                db.transaction(function (tx) {
                                    tx.executeSql(_SELECT_SENSORS, [], function (transaction, result) {
                                            console.log('query success');
                                            deferred.resolve(toArray(result.rows));
                                        },
                                        function (err) {
                                            deferred.reject(err.message);
                                            console.log('ERROR:' + err.message);
                                        }
                                    );

                                })
                            }
                        );
                    }

                    connectionService.online.then(
                        function(stat) {
                            if (stat) {
                                Sensors.query().$promise.then(
                                    function (sensors) {

                                        var _INSERT_SENSOR = "INSERT OR REPLACE INTO sensor (id, label, description) VALUES (?, ?, ?)";

                                        databaseService.db.then(
                                            function (db) {
                                                db.transaction(
                                                    function (tx) {
                                                        var counter = 0;
                                                        sensors.forEach(
                                                            function (sensor) {
                                                                tx.executeSql(_INSERT_SENSOR, [sensor.sensorId, sensor.label, sensor.description],
                                                                    function (transaction, result) {
                                                                        counter++;
                                                                        console.log('sensor ' + sensor.sensorId + ' inserted successfuly on db');
                                                                        if (counter == sensors.length) dataReady();
                                                                    },
                                                                    function (err) {
                                                                        counter++;
                                                                        if (counter == sensors.length) dataReady();
                                                                        console.log('ERROR:' + err.message);
                                                                    }
                                                                );
                                                            }
                                                        )
                                                    }
                                                );
                                            }
                                        )
                                    },
                                    function (error) {
                                        console.log(error);
                                    }
                                )
                            } else dataReady();
                        }
                    );

                    return deferred.promise;
                },

                getSensorById: function(sensorId) {

                    var deferred = $q.defer();

                    function dataReady() {

                        var _SELECT_SENSOR = "SELECT id AS sensorId, label, description FROM sensor WHERE id = (?)";
                        var _SELECT_FEEDS = "SELECT label AS feedId, description, sensorId FROM feed WHERE sensorId = (?)";

                        databaseService.db.then(
                            function (db) {
                                db.transaction(function (tx) {

                                    tx.executeSql(_SELECT_SENSOR, [sensorId], function (transaction, r1) {
                                            var sensor = r1.rows.item(0);
                                            console.log('query success 1');
                                            tx.executeSql(_SELECT_FEEDS, [sensorId], function (transaction, r2) {
                                                    sensor.feeds = toArray(r2.rows);
                                                    console.log('query success 2');
                                                    console.log(sensor);
                                                    deferred.resolve(sensor);
                                                },
                                                function (err) {
                                                    deferred.reject(err.message);
                                                    console.log('ERROR:' + err.message);
                                                }
                                            );
                                        },
                                        function (err) {
                                            console.log('ERROR:' + err.message);
                                        }
                                    );
                                });
                            }
                        )
                    }

                    connectionService.online.then(

                        function(stat) {

                            if (stat) {

                                Sensors.get({sensorId: sensorId}).$promise.then(
                                    function (sensor) {
                                        console.log('query' + sensor);

                                        var _INSERT_FEED = "INSERT OR REPLACE INTO feed (id, label, sensorId, description) VALUES (?, ?, ?, ?)";

                                        databaseService.db.then(
                                            function (db) {
                                                db.transaction(function (tx) {
                                                    var counter = 0;
                                                    sensor.feeds.forEach(
                                                        function (feed) {
                                                            tx.executeSql(_INSERT_FEED, [sensorId + feed.feedId, feed.feedId, sensorId, feed.description],
                                                                function (transaction, result) {
                                                                    counter++;
                                                                    console.log('feed ' + feed.feedId + ' inserted successfuly on db');
                                                                    if (counter == sensor.feeds.length) dataReady();
                                                                },
                                                                function (err) {
                                                                    counter++;
                                                                    if (counter == sensor.feeds.length) dataReady();
                                                                    console.log('ERROR:' + err.message);
                                                                }
                                                            );
                                                        }
                                                    )
                                                });
                                            }
                                        )
                                    },
                                    function (error) {
                                        console.log(error);
                                    }
                                )
                            } else dataReady();
                        }
                    );
                    return deferred.promise;
                },

                getFeedById: function (sensorId, feedId) {
                    var deferred = $q.defer();
                    function dataReady() {
                        console.log('dataReady');

                        var _SELECT_FEED = "SELECT feed.label AS feedId, feed.description, sensor.label AS sensorLabel FROM feed JOIN sensor ON feed.sensorId = sensor.id WHERE feed.id = (?)";

                        databaseService.db.then(
                            function (db) {
                                db.transaction(function (tx) {
                                    tx.executeSql(_SELECT_FEED, [sensorId + feedId], function (transaction, result) {
                                            console.log('query success');
                                            deferred.resolve(result.rows.item(0));
                                        },
                                        function (err) {
                                            deferred.reject(err.message);
                                            console.log('ERROR:' + err.message);
                                        }
                                    );
                                });
                            }
                        )
                    }

                    connectionService.online.then(
                        function(stat) {
                            if (stat) {
                                Feeds.get({sensorId: sensorId, feedId: feedId}).$promise.then(
                                    function (feed) {
                                        var _INSERT_FEED = "INSERT OR REPLACE INTO feed (id, label, sensorId, description) VALUES (?, ?, ?, ?)";

                                        databaseService.db.then(
                                            function (db) {
                                                db.transaction(
                                                    function (tx) {
                                                        tx.executeSql(_INSERT_FEED, [sensorId + feedId, feed.feedId, sensorId, feed.description],
                                                            function (transaction, result) {
                                                                dataReady();
                                                            },
                                                            function (err) {
                                                                console.log('ERROR:' + err.message);
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        )
                                    },
                                    function (error) {
                                        console.log(error);
                                    }
                                )
                            } else dataReady();
                        }
                    );

                    return deferred.promise;
                },

                getFeedStream: function (sensorId, feedId, asc, size) {

                    var deferred = $q.defer();

                    function dataReady() {
                        var _SELECT_STREAM = "";
                        if (asc) {
                            _SELECT_STREAM = "SELECT timestamp as x, value as y FROM feed_data WHERE feedId = (?) ORDER BY timestamp ASC LIMIT (?)";
                        } else {
                            _SELECT_STREAM = "SELECT timestamp as x, value as y FROM feed_data WHERE feedId = (?) ORDER BY timestamp DESC LIMIT (?)";
                        }

                        databaseService.db.then(
                            function (db) {
                                db.transaction(function (tx) {

                                    tx.executeSql(_SELECT_STREAM, [sensorId + feedId, size], function (transaction, result) {
                                            var stream = toArray(result.rows);
                                            deferred.resolve(stream);
                                        },
                                        function (err) {
                                            console.log('ERROR:' + err.message);
                                        }
                                    );
                                });
                            }
                        )
                    }

                    connectionService.online.then(

                        function(stat) {

                            if (stat) {

                                Stream.query({sensorId: sensorId, feedId: feedId}).$promise.then(
                                    function (stream) {
                                        var _INSERT_STREAM = "INSERT OR REPLACE INTO feed_data (timestamp, feedId, value) VALUES (?, ?, ?)";

                                        databaseService.db.then(
                                            function (db) {
                                                db.transaction(function (tx) {
                                                    var counter = 0;
                                                    stream.forEach(
                                                        function (data) {
                                                            tx.executeSql(_INSERT_STREAM, [data.x, sensorId + feedId, data.y],
                                                                function (transaction, result) {
                                                                    counter++;
                                                                    if (counter == stream.length) dataReady();
                                                                },
                                                                function (err) {
                                                                    counter++;
                                                                    if (counter == stream.length) dataReady();
                                                                    console.log('ERROR:' + err.message);
                                                                }
                                                            );
                                                        }
                                                    )
                                                });
                                            }
                                        )
                                    },
                                    function (error) {
                                        console.log(error);
                                    }
                                )
                            } else dataReady();
                        }
                    );
                    return deferred.promise;

                },

                saveNotifications: function(notifications) {

                    var deferred = $q.defer();

                    var _INSERT_NOTIFICATION = "INSERT OR REPLACE INTO notification (id, timestamp, notification, read) VALUES (?, ?, ?, ?)";

                    databaseService.db.then(
                        function (db) {
                            db.transaction(function (tx) {
                                var counter = 0;
                                notifications.forEach(
                                    function (notification) {

                                        var jsonString = escape(JSON.stringify(notification));

                                        tx.executeSql(_INSERT_NOTIFICATION, [notification.notificationId, notification.timestamp, jsonString, 0],
                                            function (transaction, result) {
                                                counter++;
                                                if (counter == notifications.length) deferred.resolve('saved');
                                                ;
                                            },
                                            function (err) {
                                                counter++;
                                                if (counter == notifications.length) deferred.resolve(err);
                                                ;
                                                console.log('ERROR:' + err.message);
                                            }
                                        );
                                    }
                                )
                            });
                        }
                    );
                    return deferred.promise;

                },

                countUnreadNotifications: function () {

                    var deferred = $q.defer();

                    var __COUNT_UNREAD_NOTIFICATIONS = 'SELECT COUNT(*) AS total FROM notification WHERE read = 0';

                    databaseService.db.then(
                        function (db) {
                            db.transaction(
                                function (tx) {
                                    tx.executeSql(__COUNT_UNREAD_NOTIFICATIONS, [],
                                        function (trans, result) {
                                            deferred.resolve(result.rows.item(0).total);
                                        },
                                        function (err) {
                                            deferred.resolve(err);
                                        }
                                    )
                                }
                            )
                        }
                    );
                    return deferred.promise;
                },

                getUnreadNotifications: function () {

                    var deferred = $q.defer();

                    var __SELECT_UNREAD_NOTIFICATIONS = 'SELECT notification, read FROM notification WHERE read = 0 ORDER BY timestamp DESC';
                    databaseService.db.then(
                        function (db) {
                            db.transaction(
                                function (tx) {
                                    tx.executeSql(__SELECT_UNREAD_NOTIFICATIONS, [],
                                        function (trans, result) {
                                            console.log('unread');
                                            var array = [];
                                            for (var i = 0; i < result.rows.length; i++) {
                                                array.push(getNotification(result.rows.item(i)));
                                            }
                                            deferred.resolve(array);
                                        },
                                        function (err) {
                                            deferred.reject(err);
                                        }
                                    )
                                }
                            )
                        }
                    );
                    return deferred.promise;
                },

                getAllNotifications: function () {

                    var deferred = $q.defer();

                    var __SELECT_ALL_NOTIFICATIONS = 'SELECT notification, read FROM notification ORDER BY timestamp DESC';

                    databaseService.db.then(
                        function (db) {
                            db.transaction(
                                function (tx) {
                                    tx.executeSql(__SELECT_ALL_NOTIFICATIONS, [],
                                        function (trans, result) {
                                            var array = [];
                                            for (var i = 0; i < result.rows.length; i++) {
                                                array.push(getNotification(result.rows.item(i)));
                                            }
                                            deferred.resolve(array);
                                        },
                                        function (err) {
                                            deferred.reject(err);
                                        }
                                    )
                                }
                            )
                        }
                    );
                    return deferred.promise;
                },

                markNotificationAsRead: function(notification) {

                    var deferred = $q.defer();
                    var _INSERT_NOTIFICATION = "INSERT OR REPLACE INTO notification (id, timestamp, notification, read) VALUES (?, ?, ?)";

                    databaseService.db.then(
                        function (db) {
                            db.transaction(function (tx) {
                                var jsonString = escape(JSON.stringify(notification));
                                tx.executeSql(_INSERT_NOTIFICATION, [notification.notificationId, notification.timestamp, jsonString, 1],
                                    function (transaction, result) {
                                        deferred.resolve('saved');
                                        ;
                                    },
                                    function (err) {
                                        deferred.reject(err);
                                        ;
                                    }
                                );
                            });
                        }
                    )
                    return deferred.promise;
                }


            }
        }

    )


    .factory('EmployeeService', function($q) {

        var employees = [
            {"id": 1, "firstName": "James", "lastName": "King", "managerId": 0, "managerName": "", "reports": 4, "title": "President and CEO", "department": "Corporate", "cellPhone": "617-000-0001", "officePhone": "781-000-0001", "email": "jking@fakemail.com", "city": "Boston, MA", "pic": "James_King.jpg", "twitterId": "@fakejking", "blog": "http://coenraets.org"},
            {"id": 2, "firstName": "Julie", "lastName": "Taylor", "managerId": 1, "managerName": "James King", "reports": 2, "title": "VP of Marketing", "department": "Marketing", "cellPhone": "617-000-0002", "officePhone": "781-000-0002", "email": "jtaylor@fakemail.com", "city": "Boston, MA", "pic": "Julie_Taylor.jpg", "twitterId": "@fakejtaylor", "blog": "http://coenraets.org"},
            {"id": 3, "firstName": "Eugene", "lastName": "Lee", "managerId": 1, "managerName": "James King", "reports": 0, "title": "CFO", "department": "Accounting", "cellPhone": "617-000-0003", "officePhone": "781-000-0003", "email": "elee@fakemail.com", "city": "Boston, MA", "pic": "Eugene_Lee.jpg", "twitterId": "@fakeelee", "blog": "http://coenraets.org"},
            {"id": 4, "firstName": "John", "lastName": "Williams", "managerId": 1, "managerName": "James King", "reports": 3, "title": "VP of Engineering", "department": "Engineering", "cellPhone": "617-000-0004", "officePhone": "781-000-0004", "email": "jwilliams@fakemail.com", "city": "Boston, MA", "pic": "John_Williams.jpg", "twitterId": "@fakejwilliams", "blog": "http://coenraets.org"},
            {"id": 5, "firstName": "Ray", "lastName": "Moore", "managerId": 1, "managerName": "James King", "reports": 2, "title": "VP of Sales", "department": "Sales", "cellPhone": "617-000-0005", "officePhone": "781-000-0005", "email": "rmoore@fakemail.com", "city": "Boston, MA", "pic": "Ray_Moore.jpg", "twitterId": "@fakermoore", "blog": "http://coenraets.org"},
            {"id": 6, "firstName": "Paul", "lastName": "Jones", "managerId": 4, "managerName": "John Williams", "reports": 0, "title": "QA Manager", "department": "Engineering", "cellPhone": "617-000-0006", "officePhone": "781-000-0006", "email": "pjones@fakemail.com", "city": "Boston, MA", "pic": "Paul_Jones.jpg", "twitterId": "@fakepjones", "blog": "http://coenraets.org"},
            {"id": 7, "firstName": "Paula", "lastName": "Gates", "managerId": 4, "managerName": "John Williams", "reports": 0, "title": "Software Architect", "department": "Engineering", "cellPhone": "617-000-0007", "officePhone": "781-000-0007", "email": "pgates@fakemail.com", "city": "Boston, MA", "pic": "Paula_Gates.jpg", "twitterId": "@fakepgates", "blog": "http://coenraets.org"},
            {"id": 8, "firstName": "Lisa", "lastName": "Wong", "managerId": 2, "managerName": "Julie Taylor", "reports": 0, "title": "Marketing Manager", "department": "Marketing", "cellPhone": "617-000-0008", "officePhone": "781-000-0008", "email": "lwong@fakemail.com", "city": "Boston, MA", "pic": "Lisa_Wong.jpg", "twitterId": "@fakelwong", "blog": "http://coenraets.org"},
            {"id": 9, "firstName": "Gary", "lastName": "Donovan", "managerId": 2, "managerName": "Julie Taylor", "reports": 0, "title": "Marketing Manager", "department": "Marketing", "cellPhone": "617-000-0009", "officePhone": "781-000-0009", "email": "gdonovan@fakemail.com", "city": "Boston, MA", "pic": "Gary_Donovan.jpg", "twitterId": "@fakegdonovan", "blog": "http://coenraets.org"},
            {"id": 10, "firstName": "Kathleen", "lastName": "Byrne", "managerId": 5, "managerName": "Ray Moore", "reports": 0, "title": "Sales Representative", "department": "Sales", "cellPhone": "617-000-0010", "officePhone": "781-000-0010", "email": "kbyrne@fakemail.com", "city": "Boston, MA", "pic": "Kathleen_Byrne.jpg", "twitterId": "@fakekbyrne", "blog": "http://coenraets.org"},
            {"id": 11, "firstName": "Amy", "lastName": "Jones", "managerId": 5, "managerName": "Ray Moore", "reports": 0, "title": "Sales Representative", "department": "Sales", "cellPhone": "617-000-0011", "officePhone": "781-000-0011", "email": "ajones@fakemail.com", "city": "Boston, MA", "pic": "Amy_Jones.jpg", "twitterId": "@fakeajones", "blog": "http://coenraets.org"},
            {"id": 12, "firstName": "Steven", "lastName": "Wells", "managerId": 4, "managerName": "John Williams", "reports": 0, "title": "Software Architect", "department": "Engineering", "cellPhone": "617-000-0012", "officePhone": "781-000-0012", "email": "swells@fakemail.com", "city": "Boston, MA", "pic": "Steven_Wells.jpg", "twitterId": "@fakeswells", "blog": "http://coenraets.org"}
        ];

        // We use promises to make this api asynchronous. This is clearly not necessary when using in-memory data
        // but it makes this service more flexible and plug-and-play. For example, you can now easily replace this
        // service with a JSON service that gets its data from a remote server without having to changes anything
        // in the modules invoking the data service since the api is already async.

        return {
            findAll: function() {
                var deferred = $q.defer();
                deferred.resolve(employees);
                return deferred.promise;
            },

            findById: function(employeeId) {
                var deferred = $q.defer();
                var employee = employees[employeeId - 1];
                deferred.resolve(employee);
                return deferred.promise;
            },

            findByName: function(searchKey) {
                var deferred = $q.defer();
                var results = employees.filter(function(element) {
                    var fullName = element.firstName + " " + element.lastName;
                    return fullName.toLowerCase().indexOf(searchKey.toLowerCase()) > -1;
                });
                deferred.resolve(results);
                return deferred.promise;
            },

            findByManager: function (managerId) {
                var deferred = $q.defer(),
                    results = employees.filter(function (element) {
                        return parseInt(managerId) === element.managerId;
                    });
                deferred.resolve(results);
                return deferred.promise;
            }

        }

    });/**
 * Created by pereirazc on 30/05/14.
 */
