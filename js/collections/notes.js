define(['models/note'],function(NoteModel){
	var NotesCollection = Backbone.Collection.extend({
		model: NoteModel,
	});

	

	return NotesCollection;
});