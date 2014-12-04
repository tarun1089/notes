define(['views/app', 'collections/notes', 'storage'],function(AppView, NotesCollection, AllStorage){


	// var backgroundPage;

	// chrome.runtime.sendMessage({
 //      getData: "all"
 //    },function(val){
 //    	console.log(val);
 //    });

    // function bindEvents(backgroundPage){
        
    // }

    var Notes = {
        bindEventsOnBackgroundPage : function(backgroundPage){
            var self = this;
            addEventListener("unload", function (event) {
                var data = self.getDataFromNotes();
                var object = {
                    notesData : data
                };
                backgroundPage.Storage.setKeys(object, function(val){
                    console.log(val.status);
                });
            }, true);
        },

        getDataFromNotes : function(){
            var dataArr = [];
            if (this.appView && this.appView.childViews){
                _.each(this.appView.childViews, function(view, index){
                    var innerHTML = view.el.html();
                    var obj = {
                        text: innerHTML
                    }
                    dataArr.push(obj);
                });
            }
            
            return dataArr;
        },

        onGetDataFromStorage : function(data){
            debugger;
            var notesData;
            if (data && data.notesData) {
                notesData  = data.notesData;
            } else {
                notesData  = [{title:'title', text: 'This is the text'}];
            }
            this.notesCollection = new NotesCollection(notesData);
            this.appView = new AppView({collection: this.notesCollection});
            console.log(this.getDataFromNotes());
        }
    };


    chrome.runtime.getBackgroundPage(function(page){
        var backgroundPage = page;
        Notes.bindEventsOnBackgroundPage(backgroundPage);
    });

    
    AllStorage.getValues(['notesData'],Notes.onGetDataFromStorage.bind(Notes));

    return Notes;

});