define(['views/app', 'collections/notes', 'models/settings','storage'],function(AppView, NotesCollection, SettingsModel, Storage){


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
                    settings: obj.settings
                };
                backgroundPage.Storage.setKeys(object, function(val){
                    console.log(val.status);
                });
            }, true);
        },

        getDataFromNotes : function(){
            var dataArr = [];
            var settings = {};
            var obj = {};
            if (this.appView && this.appView.childViews){
                _.each(this.appView.childViews, function(view_obj, index){
                    var view = view_obj.noteView;
                    var innerHTML = view.el.html();
                    var obj = {
                        text: innerHTML
                    }
                    dataArr.push(obj);
                });

            }

            if (this.settingsModel){
                settings = this.settingsModel.toJSON();
            }

            obj["dataArr"] = dataArr;
            obj["settings"] = settings;
            
            return obj;
        },

        onGetDataFromStorage : function(data){
            var notesData;
            var settings = {};
            if (data && data.notesData && data.notesData.length > 0) {
                notesData  = data.notesData;
            } else {
                notesData  = [{title:'title', text: 'This is the text'},{title:'title2', text: 'This is the text2'}];
            }

            if (data && data.settings && Object.keys(data.settings).length > 0){
                settings = data.settings;
            }
            this.notesCollection = new NotesCollection(notesData);
            this.settingsModel = new SettingsModel(settings);
            this.appView = new AppView({notesCollection: this.notesCollection, settingsModel: this.settingsModel, Storage: Storage});
            console.log(this.getDataFromNotes());
        }
    };


    chrome.runtime.getBackgroundPage(function(page){
        var backgroundPage = page;
        Notes.bindEventsOnBackgroundPage(backgroundPage);
    });

    
    Storage.getValues(['notesData','settings'],Notes.onGetDataFromStorage.bind(Notes));

    return Notes;

});