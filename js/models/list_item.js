define(['backbone'],function(Backbone){
	var ListModel = Backbone.Model.extend({
		defaults : {
			text: "Write any thing here",
		},

	});

	return ListModel;
});