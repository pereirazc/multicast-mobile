/**
 * Created by pereirazc on 18/05/14.
 */

'use strict'

app.controller('SettingsCtrl', ['$rootScope', '$scope', 'databaseService',

    function($rootScope, $scope, databaseService) {
        $scope.server = {};
        $rootScope.loading = true;

        databaseService.getServer().then(
            function(server) {
                console.log('a');
                $scope.server.id = server.id;
                $scope.server.url = server.url;
                $rootScope.loading = false;
            }
        );

        $scope.save = function() {
            $rootScope.loading = true;

            databaseService.saveServer($scope.server).then(
                function() {
                    console.log('saved');
                    $rootScope.loading = false;
                }
            );

        }

    }
]);




