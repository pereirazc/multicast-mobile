/**
 * Created by pereirazc on 18/05/14.
 */

'use strict';

app.service('cordovaService', ['$document', '$q',
    function($document, $q) {

        var d = $q.defer(),
            resolved = false;

        this.ready = d.promise;

        console.log('listening...');
        document.addEventListener('deviceready', function() {
            resolved = true;
            d.resolve(window.cordova);
        });

        // Check to make sure we didn't miss the event
        // or manually resolve for off-device testing
        setTimeout(function() {
            if (!resolved) {
                if (window.cordova){
                    d.resolve(window.cordova);
                }
            }
        }, 1500);
    }
]);