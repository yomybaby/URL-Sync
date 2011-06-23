// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

var webview = Titanium.UI.createWebView({
	url:'http://plac.kr/8ptim',
	bottom:40
});

var win = Titanium.UI.createWindow();
win.add(webview);
	
Ti.App.Properties.setBool('_watching', false);

var watchURLChange = function(host, port, win){
    if(Ti.App.Properties.getBool('_watching')){ return false; }
    Ti.App.Properties.setBool('_watching', true);
	
    var socket = Titanium.Network.createTCPSocket({
    	hostName: host, 
    	port: port, 
    	mode: Titanium.Network.READ_WRITE_MODE
    });
    
    socket.addEventListener('read', function(e) {
        try {
            var o = JSON.parse(e.data.text);
			switch(o.action){
				case 'changeURL':		
					Ti.API.info('url Changed : '+o.url);
					webview.url = o.url;
                    break;
				case 'connect':
                    Ti.API.info('Socket connected');
					webview.url = o.url;
                    break;
			}
        } catch(event){ Ti.API.error('read error', event); }
    });

    // Cleanup
    win = win || Ti.UI.currentWindow;
    if(win){ 
        win.addEventListener('close', function(e) {
        	if (socket.isValid) {
        	    Ti.API.log('close socket');
        		socket.close();
        	}
        });
    }

    socket.connect();
    socket.write(JSON.stringify({ action: 'echo', message: 'Socket connected' }));
	
};

//webview 아래 컨트롤 view 생성
(function(){
	var autoIntervalID;
	//reload 버
	var reloadBtn = Titanium.UI.createButton({
		title : "Reload",
		width : 60
	});
	reloadBtn.addEventListener('click',function(){
		webview.reload();
	});
	
	//뒤로가기 버튼 
	var backBtn = Titanium.UI.createButton({
		title:'◀',
		enabled:false,
	});
	backBtn.addEventListener('click',function(){
		webview.goBack();
	});
	
	//앞으로가기 버튼
	var forwardBtn = Titanium.UI.createButton({
		title:'▶',
		enabled:false
	});
	forwardBtn.addEventListener('click',function(){
		webview.goForward();
	});
	
	//자동 리프레쉬 스위치
	var autoSwitch = Ti.UI.createSwitch({
		value:false,
		top:5,
		left:50,
		title:"",
		titleOn:"",
		titleOff:""
	});
	autoSwitch.addEventListener('change',function(e){
		if(e.value){
			autoIntervalID = setInterval(function(){
				webview.reload();
			},10000)
		}else{
			if(autoIntervalID) clearInterval(autoIntervalID);
		}
	});
	
	// setting Btn & setting Window
	var settingBtn = Ti.UI.createButton({
		title:'설정'
	});
	
	var preferenceWin = Ti.UI.createWindow({
		title:'설정'
	});
	var closeBtn = Ti.UI.createButton({
		title:'닫'
	});
	
	var autoReloadRow = Ti.UI.createTableViewRow({
		title:"Auto Reload"
	});
	autoReloadRow.add(reloadBtn);
	
	var prefTable = Ti.UI.createTableView({
		data : [autoReloadRow],
		//style: Titanium.UI.iPhone.TableViewStyle.GROUPED
	});
	preferenceWin.add(prefTable);
	
	settingBtn.addEventListener('click',function(){
		preferenceWin.open();
	});
	
	
	// 버튼 wrap
	var btnWrapView = Titanium.UI.createView({
		width:'100%',
		height:40,
		backgroundColor:'#2A2623',
		layout:'horizontal',
		bottom:0
	});
	
	btnWrapView.add(backBtn);
	btnWrapView.add(forwardBtn);
	btnWrapView.add(reloadBtn);
	btnWrapView.add(settingBtn);
	//btnWrapView.add(autoSwitch);
	win.add(btnWrapView);
	
	//webview의 loding activity indicator
	var toolActInd = Titanium.UI.createActivityIndicator({
		width:30,
		height:30
	});
	toolActInd.style = Titanium.UI.iPhone.ActivityIndicatorStyle.DARK;
	webview.add(toolActInd);
	webview.addEventListener('load',function(e){
		toolActInd.hide();
		forwardBtn.enabled = webview.canGoForward();
		backBtn.enabled = webview.canGoBack();
	});
	webview.addEventListener('beforeload',function(e){
		toolActInd.show();
		forwardBtn.enabled = webview.canGoForward();
		backBtn.enabled = webview.canGoBack();
	});
})();
win.open();	

if (Titanium.Platform.name == 'iPhone OS') {
	//iphone의 경우 socket으로 연결
	watchURLChange("192.168.12.102", 8128, win);
} else {
	//android의 경우 
	var oldModifyTime = "";
	setInterval(function(){
		var xhr = Ti.Network.createHTTPClient();
		xhr.open("GET","http://192.168.12.102:8080/getURL");
	    xhr.onload = function (){
				var resultObj = JSON.parse(this.responseText);
				oldMtime = resultObj.mTime;
				if(oldModifyTime != resultObj.mTime){
					oldModifyTime = resultObj.mTime;
					//안드로이드 웹뷰의 경우 주소가 같으면 reload하지 않아 강제로 reload
					if(webview.url == resultObj.url) webview.reload(); 
					webview.url = resultObj.url;
				}
		};
		xhr.send();	
	},2000);
}
