/**
 * Created by pereirazc on 18/05/14.
 */

'use strict';

app.service('userService', ['User', 'Login', 'Logout', 'backService',
    function(User, Login, Logout, backService) {

        var self = this;
        self.user;
        self.token;

        self.loginUser = function(credentials) {
            //return playRoutes.controllers.UserCtrl.login().post(credentials);

            return Login.save(credentials).$promise.then(function(response) {
                self.token = response.authToken;
                window.localStorage.setItem("authToken", self.token);

                var config = {
                    "authToken": self.token
                };

                backService.back.setConfiguration(config,
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
            window.localStorage.clear();

            var config = {
                "authToken": ""
            };
            backService.back.setConfiguration(config,
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
            console.log('getting token...');
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
]);