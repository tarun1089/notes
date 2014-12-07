define(['backbone'],function( Backbone){

	var ListItemView = Backbone.View.extend({
		initialize: function(model, parentEl){
			var noteTemplate = this.getListItemTemplate(model);
			parentEl.append(listItemTemplate);
		},
		getListItemTemplate: function(model, number){

			var str = '';
			str += '<li class="list-item" data-cid="'+ model.cid +'">';

				str += '<input id="list-' + model.cid+ '" type="checkbox"></input>';
				var textToInsert = model.get('text');
				str += '<label for="list-' + model.cid+ '">'+ textToInsert +'</label>';
				
			str += '</li>';
			
			return str;
		},
	});
	return ListItemView;
});