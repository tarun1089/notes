define(['backbone','views/settings','views/list_item'],function(Backbone,Settings,ListItemView){
	var ListView = Backbone.View.extend({
		el: '.list',
		events: {
			'change .list-item input': 'checkNote',
			'keypress .js-input-box': 'handleEnterKey',
			'click .js-delete-items': 'handleDeleteItem'
		},
		initialize: function(listItemCollection){
			this.listItemCollection = listItemCollection;
			this.$listContainerEl = this.$el.find('.list-container').eq(0);
			
			this.bindEvents();
			this.render();
		},

		render: function(){
			var self = this;
			this.listItemCollection.each(function(model){
				self.addItem(model);
			});
		},


		addItem: function(model){
			var listItemView = new ListItemView(model)
			this.$listContainerEl.append(listItemView.$el);
		},

		checkNote: function(e){
			var listEl = $(e.target).closest('.list-item');
			var checkedStatus = this.toggleClass(listEl, "checked");
			var cid = listEl.attr('data-cid');
			var model  = this.listItemCollection.get(cid);
			model.set({isChecked: checkedStatus});
		},

		toggleClass: function(el, className){
			var hasClass = false;
			if (el.hasClass(className)){
				el.removeClass(className);
			} else {
				el.addClass(className);
				hasClass = true;
			}
			return hasClass;
		},

		handleEnterKey: function(e){
			var inputEl, text;
			if(e.which == 13) {
				inputEl = $(e.currentTarget);
        		text = inputEl.val().trim();
        		var model_obj = {
        			text: text
        		}
        		this.listItemCollection.add(model_obj);
   			 }
		},

		handleDeleteItem: function(e){
			var checkedElements = this.$el.find('input[type="checkbox"]:checked');
			_.each(checkedElements,function(el,index){
				var listEl = $(el).closest('.list-item').eq(0);
				var cid = listEl.attr('data-cid');
				var model = this.listItemCollection.get(cid);
				this.listItemCollection.remove(model);
				listEl.remove();
			}, this);
		},

		onAddListItem: function(model){
			this.addItem(model);
		},


		bindEvents: function(){
			this.listItemCollection.on('add', this.onAddListItem.bind(this));
			// this.listItemCollection.on('remove', this.onRemoveListItem.bind(this));
		},

		supress: function(e){
			e.preventDefault();
			e.stopPropagation();
		}

	});

	return ListView;
});






