/**
 * Created by pereirazc on 19/05/14.
 */
'use strict'

app.directive('checkAuth', ['$rootScope', '$location', 'userService', function ($rootScope, $location, userService) {
    return {
        link: function (scope, elem, attrs, ctrl) {
            $rootScope.$on('$routeChangeSuccess', function(event, currRoute, prevRoute) {
                if (userService.getUser() == null) {

                    $location.path('/login');

                    // reload the login route
                }
                /*
                 * IMPORTANT:
                 * It's not difficult to fool the previous control,
                 * so it's really IMPORTANT to repeat the control also in the backend,
                 * before sending back from the server reserved information.
                 */
            });
        }
    }
}]);