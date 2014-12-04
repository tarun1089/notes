define(['backbone'],function(Backbone){
	var NoteModel = Backbone.Model.extend({
		defaults : {
			text: "Write any thing here",
			title: "Note 1"
		},

	});

	return NoteModel;
});