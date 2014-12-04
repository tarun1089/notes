requirejs.config({
    baseUrl: 'js/',
    paths: {
        notes: 'notes',
        jquery: 'lib/jquery-2.1.1',
        underscore: 'lib/underscore',
        backbone: 'lib/backbone',
        medium: 'lib/medium-editor',
        storage: 'lib/storage',
        async: 'lib/async'
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
        }
    }
});

var log = console.log.bind(console);
var notes;
requirejs(['notes','medium'], function(Notes){
    notes = Notes;
});

