define(['views/app', 'collections/notes', 'collections/list', 'models/settings','storage'],function(AppView, NotesCollection, ListItemCollection, SettingsModel, Storage){


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
                var obj = self.getDataFromNotes();
                var object = {
                    notesData : obj.dataArr,
                    settings: obj.settings,
                    list: obj.list
                };
                backgroundPage.Storage.setKeys(object, function(val){
                    console.log(val.status);
                });
            }, true);
        },

        getDataFromNotes : function(){
            var dataArr = [];
            var settings = {};
            var list = [];
            var obj = {};
            if (this.appView && this.appView.childViews){
                _.each(this.appView.childViews, function(view_obj, index){
                    var view = view_obj.noteView;
                    var innerHTML = view.$noteEl.html();
                    var obj = {
                        text: innerHTML
                    };
                    dataArr.push(obj);
                });

            }

            if (this.settingsModel){
                settings = this.settingsModel.toJSON();
            } 

            if (this.listItemCollection){
                list = this.listItemCollection.toJSON();
            }

            obj.dataArr = dataArr;
            obj.settings = settings;
            obj.list = list;
            
            return obj;
        },

        onGetDataFromStorage : function(data){
            var notesData;
            var settings = {};
            var list = [];
            if (data && data.notesData && data.notesData.length > 0) {
                notesData  = data.notesData;
            } else {
                notesData  = [{title:'title', text: 'This is the text'},{title:'title2', text: 'This is the text2'}];
            }

            if (data && data.settings && Object.keys(data.settings).length > 0){
                settings = data.settings;
            }

            if (data && data.list && data.list.length > 0) {
                // list = [
                //     {text:'item 1', isChecked: false},
                //     {text:'item 2', isChecked: false}
                // ];
                list = data.list;
            }

            // if (data) {
            //     list = [
            //         {text:'item 1', isChecked: false},
            //         {text:'item 2', isChecked: false}
            //     ];
            // }

            this.notesCollection = new NotesCollection(notesData);
            this.settingsModel = new SettingsModel(settings);
            this.listItemCollection = new ListItemCollection(list);

            this.appView = new AppView(
                {
                    notesCollection: this.notesCollection,
                    settingsModel: this.settingsModel,
                    Storage: Storage,
                    listItemCollection: this.listItemCollection
                }
            );
            console.log(this.getDataFromNotes());
        }
    };


    chrome.runtime.getBackgroundPage(function(page){
        var backgroundPage = page;
        Notes.bindEventsOnBackgroundPage(backgroundPage);
    });

    
    Storage.getValues(['notesData','settings','list'],Notes.onGetDataFromStorage.bind(Notes));

    return Notes;

});