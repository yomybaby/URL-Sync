// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

var webview = Titanium.UI.createWebView({
	url:'http://plac.kr/8ptim',
	bottom:40
});

var win = Titanium.UI.createWindow();
win.add(webview);
	
var watchURLChange = function(host, port, win){
    var connectSocket = Titanium.Network.Socket.createTCP({
    	host: host, 
    	port: port, 
    	connected:function(e) {
	        Ti.API.info("Socket <" + e.socket + "> connected to host <" + e.socket.host + ">");
	        postConnect();
	    }
    });
    
    function postConnect() {
		try {
			// write some data
			/*
			Ti.API.info( "STATUS: sending data");
			var outData = Ti.createBuffer({
				value:"Howdy listener socket! How are you?"
			});
			var bytesWritten = connectSocket.write(outData);
			Ti.API.info( "STATUS: <" + bytesWritten + "> bytes written" );
			*/
			// start read loop
			Ti.API.info( "STATUS: reading data" );
			var readBuffer = Ti.createBuffer({
				length:1024
			});
			var bytesRead = 0;
	
			function readCallback(e) {
				if (e.bytesProcessed == -1) { // EOF
					Ti.API.info( "STATUS: closing");
					connectSocket.close(); // close the socket on our end
					Ti.API.info( "STATUS: closed");
					return;
				}
				var str = Ti.Codec.decodeString({
					source:readBuffer,
					length:e.bytesProcessed
				});
				Ti.API.info( "RECV FROM LISTENER: " + str);
				var o = JSON.parse(str);
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
				readBuffer.clear(); // clear the buffer before the next read
	
				// queue up the next read
				Ti.Stream.read(connectSocket,readBuffer,readCallback);
			}
	
			Ti.Stream.read(connectSocket,readBuffer,readCallback);
		} catch (e) {
			// IO error on socket. socket is closed and connectSocket.error is called
			Ti.API.info( "STATUS: error - closed");
		}
	}
    // Cleanup
    win = win || Ti.UI.currentWindow;
    if(win){ 
        win.addEventListener('close', function(e) {
        	if (connectSocket.isValid) {
        	    Ti.API.log('close socket');
        		connectSocket.close();
        	}
        });
    }
    connectSocket.connect();
    //socket.write(JSON.stringify({ action: 'echo', message: 'Socket connected' }));
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
	(function(){
		var settingBtn = Ti.UI.createButton({
			title:'설정'
		});
		
		var preferenceWin = Ti.UI.createWindow({
			title:'설정'
		});
		var closeBtn = Ti.UI.createButton({
			title:'닫기'
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
	})//();
	////////
	
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
	//btnWrapView.add(settingBtn);
	//btnWrapView.add(autoSwitch);
	win.add(btnWrapView);
	
	//webview의 loding activity indicator
	var toolActInd = Titanium.UI.createActivityIndicator({
		width:30,
		height:30,
		style:Titanium.UI.iPhone.ActivityIndicatorStyle.DARK
	});
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

watchURLChange(Titanium.Platform.address, 8128, win);