define(['backbone'],function(Backbone){
	var SettingsView = Backbone.View.extend({
		el: "#settings",

		events: {
			'click .js-add-note' 		  : 'addNote',
			'click .js-change-text-size' : 'changeTextSize',

		},

		initialize: function(options){
			this.options = options;
			this.notesCollection = this.options.notesCollection;
			this.settingsModel = this.options.settingsModel;
		},

		addNote: function(e){
			this.notesCollection.add({});
		},

		changeTextSize: function(e){
			
		}

	});

	return SettingsView;
});