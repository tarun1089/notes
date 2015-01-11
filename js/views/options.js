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
			this.applyCSSRelatedStuff(this.$el);

		},
		getOptionsTemplate: function(displayOptions, idName, className){
			var str = '';
			str += '<ul id="' + idName+ '" class="' + className + '">';
			for( var i = 0, length = displayOptions.length; i < length; ++i) {
				str += '<li data-id="' +displayOptions[i].id + '" data-value="' + displayOptions[i].value+ '">';
						str += displayOptions[i].textToDisplay;

				str += '</li>';
			}

			str += '</ul>';
			return str;

		},

		handleClickForOption: function(e){
			var id = $(e.currentTarget).attr('id');
			var value = $(e.target).attr('data-value');
			this.applySettingsBasedOnId(id,value);
			this.supressEvent(e);

		},


		applySettingsBasedOnId: function(id, value){
			switch(id){
				case "fontSize": 
					var size = parseInt(value, 10);
					this.AppView.settingsModel.set({'fontSize': size});
					break;

				case "fontFamily":
					this.AppView.settingsModel.set({'fontFamily': value});
					break;

				case "size":
					var dimensions = value.split("-");
					var width = parseInt(dimensions[0],10);
					var height = parseInt(dimensions[1],10);
					this.AppView.settingsModel.set({
						width: width,
						height: height
					});
					break;
			}
		},
		applyCSSRelatedStuff: function(el){
			setTimeout(function(){
				el.addClass('animate');
			}, 10);
		},

		removeCSSRelatedStuff: function(el){
			el.removeClass('animate');
		},

		supressEvent: function(e){
			e.preventDefault();
			e.stopPropagation();
		},

		destroy: function(){
			this.$el.unbind();
			this.$el.html('');
			this.removeCSSRelatedStuff(this.$el);
		}
	});
	return OptionsView;
});