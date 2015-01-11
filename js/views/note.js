define(['backbone'],function( Backbone){

	var NoteView = Backbone.View.extend({
		NOTE_CLASS_NAME: 'note',
		initialize: function(model, number, parentEl){
			var noteTemplate = this.getNoteTemplate(model, number);
			parentEl.append(noteTemplate);

			var selector = '.' + this.NOTE_CLASS_NAME + '-' + model.cid;
			this.$noteEl = $(selector);
			this.$el = this.$noteEl.parent();
			this.editor = new MediumEditor(selector, {
	            disableToolbar: true,
	            cleanPastedHTML: true,
	            checkLinkFormat: true,
	            forcePlainText: true,
	            anchorTarget: true,
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