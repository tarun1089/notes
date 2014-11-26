requirejs.config({
    baseUrl: 'js/',
    paths: {
        notes: 'notes',
        app: 'views/app',
        jquery: 'lib/jquery-2.1.1',
        underscore: 'lib/underscore',
        backbone: 'lib/backbone'
    },
    shim: {
        backbone: {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        underscore: {
            exports: '_'
        },
        app: {
            deps: ['backbone'],
            // exports: 'App'
        }
    }
});

requirejs(['notes'], function(){
    console.log("notes loaded");
});

var log = console.log.bind(console);