console.log(chrome.extension, chrome.runtime);
function func(text){
	alert(text);
}

var popupHeartbeatTimer;
// Listen to popup heartbeat messages
// appAPI.message.addListener({channel: 'heartbeat'}, function(msg) {
// 	// Timer already running? Reset it
// 	if (popupHeartbeatTimer) {
// 		clearTimeout(popupHeartbeatTimer);
// 	}
// 	popupHeartbeatTimer = setTimeout(function() {
// 		// If reached then no hearbeat for 1 second
// 		alert("reached");
// 	}, 5000);
// });