/**
 * Created by pereirazc on 18/05/14.
 */

'use strict';

app.service('databaseService', ['$q',

        function($q) {

            var self = this;
            self.db = undefined;

            self.initDB = function () {
                self.db = window.openDatabase( "DB", "1.0", "test DB", 100000);
                self.db.transaction(
                    function(tx) {
                        tx.executeSql(  'CREATE TABLE IF NOT EXISTS server_domain (id INTEGER PRIMARY KEY, url TEXT)');//, [] , function (tx, res) {
                        tx.executeSql(  'CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, username TEXT, password TEXT)');//, [] , function (tx, res) {
                        tx.executeSql(  'CREATE TABLE IF NOT EXISTS sensor (id INTEGER PRIMARY KEY, username TEXT, password TEXT)');//, [] , function (tx, res) {
                    }
                );
                var exists = false;
                self.db.transaction(
                    function(tx) {
                        tx.executeSql('SELECT server_domain.id FROM server_domain WHERE id = (?)', [1], function (tx, res1) {
                            exists = res1.rows.length > 0;
                            console.log("res.rows.length: " + res1.rows.length + " -- should be 0");
                            console.log('Exists: ' + exists);

                            if (!exists) {
                                tx.executeSql('INSERT INTO server_domain (url) VALUES (?)', ['www.multicast.ml'], function (tx, res2) {
                                        console.log("insertId: " + res2.insertId + " -- probably 1");
                                        console.log("rowsAffected: " + res2.rowsAffected + " -- should be 1");
                                    },
                                    function (e) {
                                        console.log("ERROR: " + e.message);
                                    });
                            }
                        });
                    }
                );
            }

            self.getServer = function() {
                var deferred = $q.defer();

                self.db.transaction(function(tx) {

                    var str = "SELECT * FROM server_domain WHERE id = (?)";
                    tx.executeSql(str,[1], function(transaction, result) {
                            deferred.resolve(result.rows.item(0)); //at the end of processing the responses
                        },
                        function(err) {
                            console.log('ERROR:' + err.message);
                        }
                    );
                });
                return deferred.promise;
            }

            self.saveServer = function(obj) {
                var deferred = $q.defer();

                self.db.transaction(function(tx) {
                    var str = "UPDATE server_domain SET url = (?) WHERE id = (?)";
                    tx.executeSql(str,[obj.url, obj.id], function(transaction, result) {
                            deferred.resolve(result); //at the end of processing the responses
                        },
                        function(err) {
                            console.log('ERROR:' + err.message);
                        }
                    );
                });
                return deferred.promise;
            }

        }]
);