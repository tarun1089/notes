define(['backbone','views/settings'],function(Backbone){
	var ListView = Backbone.View.extend({
		el: '.list',
		events: {
			'click .js-delete': 'removeNote'
		},
		initialize: function(options){
			var options = options;
			
		},

		addItem: function(text){

		},

		getItemTemplate: function(text){
			var str= '';
			
		}




	});

	return ListView;
});






