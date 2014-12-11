define(['models/list_item'],function(ListModel){
	var ListItemCollection = Backbone.Collection.extend({
		model: ListModel
	});
	return ListItemCollection;
});