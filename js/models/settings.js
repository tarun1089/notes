define(['backbone'],function(Backbone){
	var SettingsModel = Backbone.Model.extend({
		defaults : {
			fontSize: 14,
			fontFamily: 'Lucida Grande',
			width: 200,
			height: 450,
			sync: 1,
		},

	});

	return SettingsModel;
});