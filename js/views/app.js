define(['backbone', 'views/note'],function(Backbone, NoteView){
	var AppView = Backbone.View.extend({
		el: '#app',
		initialize: function(options){
			this.options = options;
			this.childViews = [];
			this.render(this.options.collection);
		},
		render: function(collection){
			var self = this;
			if (collection.length === 0) {
				this.renderFresh();
			} else {
				collection.each(function(model,index){
					self.addNote(model, index, self.$el);
				});
			}
		},

		addNote: function(model,index , parentEl){
			var noteView = new NoteView(model, index, parentEl);
			this.childViews.push(noteView);
		},

		destroy: function(){

		}
	});

	return AppView;
});






