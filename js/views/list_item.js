define(['backbone'],function( Backbone){

	var ListItemView = Backbone.View.extend({
		initialize: function(model){
			var noteTemplate = this.getListItemTemplate(model);
			this.$el = $(noteTemplate);
			if (model.get('isChecked')){
				this.$el.find('input').prop('checked', true);
			} else {
				this.$el.find('input').prop('checked', false);
			}
		},
		getListItemTemplate: function(model, number){

			var str = '';
			var checkedClassName = "";
			if (model.get('isChecked')) {
				checkedClassName = "checked";
			}
			str += '<li class="list-item ' + checkedClassName+ '" data-cid="'+ model.cid +'">';

				str += '<input id="list-' + model.cid+ '" type="checkbox"></input>';
				var textToInsert = model.get('text');
				str += '<label for="list-' + model.cid+ '">'+ textToInsert +'</label>';
				
			str += '</li>';
			
			return str;
		},
	});
	return ListItemView;
});