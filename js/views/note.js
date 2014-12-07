define(['backbone'],function( Backbone){

	var NoteView = Backbone.View.extend({
		NOTE_CLASS_NAME: 'note',
		initialize: function(model, number, parentEl){
			var noteTemplate = this.getNoteTemplate(model, number);
			parentEl.append(noteTemplate);
			var selector = '.' + this.NOTE_CLASS_NAME + '-' + model.cid;
			this.el = $(selector);
			this.editor = new MediumEditor(selector, {
	            disableToolbar: true,
	            cleanPastedHTML: true
	        });
		},
		getNoteTemplate: function(model, number){


			var str = '<div class="note-container">';

				str += '<div class="' + this.NOTE_CLASS_NAME + ' ' + this.NOTE_CLASS_NAME + '-' + model.cid + '" data-cid="'+ model.cid +'">';
				var textToInsert = model.get('text');
				str += textToInsert;
				str += '</div>';

				str += '<div class="delete js-delete"></div>';

			str += '</div>';
			return str;
		}
	});
	return NoteView;
});