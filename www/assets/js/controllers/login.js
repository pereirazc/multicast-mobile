/**
 * Created by pereirazc on 18/05/14.
 */

'use strict'

app.controller('LoginCtrl', ['$location', '$rootScope', '$scope', 'userService',

    function($location, $rootScope, $scope, userService) {

        $scope.credentials = {};

        $scope.login = function() {

            $rootScope.loading = true;

            userService.loginUser($scope.credentials).then(
                function(user) {
                    $location.path("/home");
                    $rootScope.loading = false;
                },
                function() {
                    $rootScope.loading = false;
                }
            );

        };

    }
]);




