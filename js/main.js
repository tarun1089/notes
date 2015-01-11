requirejs.config({
    baseUrl: 'js/',
    paths: {
        notes: 'notes',
        jquery: 'lib/jquery-2.1.1',
        underscore: 'lib/underscore',
        backbone: 'lib/backbone',
        medium: 'lib/medium-editor',
        storage: 'lib/storage',
        async: 'lib/async',
        ripple: 'helpers/ripple'
    },
    shim: {
        backbone: {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        underscore: {
            exports: '_'
        },
        storage : {
            deps: ['async'],
            exports: 'storage'
        },
        ripple : {
            deps: ['jquery']
        }
    }
});

var log = console.log.bind(console);
var notes;
requirejs(['notes','medium','ripple'], function(Notes){
    notes = Notes;
});

