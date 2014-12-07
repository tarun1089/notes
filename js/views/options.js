define(['backbone'],function( Backbone){

	var OptionsView = Backbone.View.extend({
		el : '#options',
		events: {
			'click ul': 'handleClickForOption'
		},
		initialize: function(options, AppView){
			this.options = options;
			this.AppView = AppView;

			var displayOptions = this.options.displayOptions;
			var idName = this.options.idName;
			var className = this.options.className;

			var template = this.getOptionsTemplate(displayOptions,idName,className);
			this.$el.html(template);
		},
		getOptionsTemplate: function(displayOptions, idName, className){
			var str = '';
			str += '<ul id="' + idName+ '" class="' + className + '">';
			for( var i = 0, length = displayOptions.length; i < length; ++i) {
				str += '<li data-id="' +displayOptions[i].id + '" data-size="' + displayOptions[i].value+ '">';
						str += displayOptions[i].textToDisplay;

				str += '</li>';
			}

			str += '</ul>';
			return str;

		},

		handleClickForOption: function(e){
			var id = $(e.currentTarget).attr('id');
			var value = $(e.target).attr('data-size');
			this.applySettingsBasedOnId(id,value);
			this.supressEvent(e);

		},


		applySettingsBasedOnId: function(id, value){
			switch(id){
				case "fontSize": 
					var size = parseInt(value, 10);
					this.AppView.settingsModel.set({'fontSize': size});
					break;

				case "fontStyle":
					this.AppView.settingsModel.set({'fontStyle': value});
					break;
			}
		},

		supressEvent: function(e){
			e.preventDefault();
			e.stopPropagation();
		},

		destroy: function(){
			this.$el.unbind();
			this.$el.html();
		}
	});
	return OptionsView;
});