define(['backbone','views/options'],function(Backbone, OptionsView){
	var SettingsView = Backbone.View.extend({
		el: "#settings",

		events: {
			'click .js-add-note' 		  : 'addNote',
			'click .js-change-text-size' : 'changeFontSize',
			'click .js-change-text-style' : 'changeFontFamily',
			'click .js-change-sync-option' : 'toggleSync',
			'click .js-add-list': 'addList'

		},

		initialize: function(options, AppView, Storage){
			this.options = options;
			this.notesCollection = this.options.notesCollection;
			this.settingsModel = this.options.settingsModel;
			this.bindEvents();
			this.AppView = AppView;
			this.Storage = Storage;

		},

		initializeOptionsView: function(type){
			var options = this.getOptions(type);
			if (this.optionView){
				this.optionView.destroy();
			}
			this.optionView = new OptionsView(options, this.AppView);
		},

		bindEvents: function(){
			$('.hide-show').on('click', this.toggleMenu.bind(this));
		},

		addNote: function(e){
			this.notesCollection.add({});
		},

		addList: function(e){

		},

		getOptions: function(type){

			var displayOptions;
			var idName;
			var className;


			switch(type){
				case 'fontSize': 
					displayOptions = [
							{
								textToDisplay:"Small",
								id: "small",
								value: 12
							},
							{
								textToDisplay:"Normal",
								id: "normal",
								value: 14
							},
							{
								textToDisplay:"Large",
								id: "large",
								value: 16
							}
						];
					break;


				case 'fontFamily': 
					displayOptions = [
							{
								textToDisplay:"Monospace",
								id: "monospace",
								value: 'monospace'
							},
							{
								textToDisplay:"Lucida Grande",
								id: "lucida",
								value: 'Lucida Grande'
							},
							{
								textToDisplay:"Open Sans",
								id: "comic",
								value: 'Comic Sans'
							}
						];
					break;

			}

			idName = type;
			className = type;

			var options = {
				displayOptions: displayOptions,
				idName: idName,
				className: className
			};

			return options;

		},

		changeFontSize: function(e){
			this.initializeOptionsView('fontSize');
		},

		changeFontFamily: function(e){
			this.initializeOptionsView('fontFamily');
		},

		toggleSync: function(){
			if (this.Storage.isSyncOn()){
				this.Storage.syncOff();
				this.settingsModel.set({'sync':0});
				console.log("syncing off");
			} else {
				this.Storage.syncOn(function(val){
					console.log(val);
					if(val.saved == 'Ok'){
						this.settingsModel.set({'sync':1});
					}
				});
			}
		},


		toggleMenu: function(){
			if (this.$el.hasClass('selected')){
				this.$el.removeClass('selected');
			} else {
				this.$el.addClass('selected');
			}
		}

	});

	return SettingsView;
});