define(['backbone', 'views/note','views/settings'],function(Backbone, NoteView, SettingsView){
	var AppView = Backbone.View.extend({
		el: '#notes',
		events: {
			'click .js-delete': 'removeNote'
		},
		initialize: function(options){
			var options = options;
			var notesCollection = options.notesCollection;
			this.settingsModel = options.settingsModel;
			this.notesCollection = options.notesCollection;
			this.childViews = [];
			this.render(notesCollection);
			this.applySettings();
			this.bindEvents();

			this.initializeSettingsView(notesCollection, this.settingsModel);
		},

		initializeSettingsView: function(notesCollection, settingsModel){
			var options = {
				notesCollection: notesCollection,
				settingsModel: settingsModel
			};
			this.settingsView = new SettingsView(options, this);
		},

		render: function(collection){
			var self = this;
			self.$el.html('');
			this.childViews = [];
			if (collection.length === 0) {
				this.renderFresh();
			} else {
				collection.each(function(model,index){
					self.addNote(model, index, self.$el);
				});
			}
		},

		applySettings: function(){
			var settingModel = this.settingsModel;
			var settings =  {};
			settings['font-size'] =  settingModel.get('fontSize');
			settings['font-family'] = settingModel.get('fontFamily');
			settings['width'] = settingModel.get('width');
			settings['height'] = settingModel.get('height');
			this.$el.find('.note').css(settings);
		},

		addNote: function(model,index , parentEl){
			var noteView = new NoteView(model, index, parentEl);
			var obj = {
				cid : model.cid,
				noteView : noteView
			}
			this.childViews.push(obj);
			this.applySettings();
		},

		onAddNoteToCollection: function(model) {
			var index = this.notesCollection.length - 1;
			this.addNote(model, index, this.$el);
		},

		removeNote: function(e){
			var targetNote = $(e.target).siblings('.note').eq(0);
			var cid = targetNote.attr('data-cid');
			var model = this.notesCollection.get(cid);
			this.notesCollection.remove(model);
			targetNote.remove();
		},

		onRemoveNoteFromCollection: function(model) {
			var cid = model.cid;
			var viewObjToRemove = _.findWhere(this.childViews,{cid: cid});
			this.childViews = _.filter(this.childViews, function(view){
				if (!(view.cid === cid)){
					return true;
				}
				return false;
			});
			viewObjToRemove.noteView.remove();
			// this.render(this.notesCollection);
			// this.applySettings();

		},

		onSettingsChange: function(model){
			this.applySettings();
		},

		bindEvents: function(){
			this.notesCollection.on('add',this.onAddNoteToCollection.bind(this));
			this.notesCollection.on('remove',this.onRemoveNoteFromCollection.bind(this));
			this.settingsModel.on('change', this.onSettingsChange.bind(this));

		}
	});

	return AppView;
});






