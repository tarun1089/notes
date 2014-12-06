define(['backbone'],function(Backbone){
	var SettingsModel = Backbone.Model.extend({
		defaults : {
			fontSize: 14,
			fontStyle: 'Helvetica',
			width: 200,
			height: 450
		},

	});

	return SettingsModel;
});