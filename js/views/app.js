define(['backbone', 'views/note', 'views/list','views/settings'],function(Backbone, NoteView, ListView, SettingsView){
	var AppView = Backbone.View.extend({
		el: '#notes',
		events: {
			'click .js-delete': 'removeNote'
		},
		initialize: function(options){
			var options = options;
			this.notesCollection = options.notesCollection;
			this.settingsModel = options.settingsModel;
			this.notesCollection = options.notesCollection;
			this.listItemCollection = options.listItemCollection;
			this.Storage = options.Storage;

			this.childViews = [];
			this.render(this.notesCollection, this.listItemCollection);
			this.applySettings();
			this.bindEvents();

			this.initializeSettingsView(notesCollection, this.settingsModel, this.Storage);
		},

		initializeSettingsView: function(notesCollection, settingsModel, Storage){
			var options = {
				notesCollection: notesCollection,
				settingsModel: settingsModel
			};
			this.settingsView = new SettingsView(options, this, Storage);
		},

		render: function(notesCollection, listItemCollection){
			var self = this;
			self.$el.html('');
			this.childViews = [];
			notesCollection.each(function(model,index){
				self.addNote(model, index, self.$el);
			});

			this.addList();

		},

		applySettings: function(){
			var settingModel = this.settingsModel;
			var settings =  {};
			settings['font-size'] =  settingModel.get('fontSize');
			settings['font-family'] = settingModel.get('fontFamily');
			settings['width'] = settingModel.get('width');
			settings['height'] = settingModel.get('height');
			this.$el.find('.note').css(settings);

			if (!settingModel.get('sync')){
				this.Storage.syncOff();
			}
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

		addList: function(){
			this.listView = new ListView(this.listItemCollection);
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






