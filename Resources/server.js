// extend array
Array.prototype.remove = function(e){
	for(var i=0;i<this.length;i++){
		if(e==this[i]) {return this.splice(i,1);}
	}
};

var file = './url.txt',	//browser에서 보낸 url을 저장해놓는 파
	fileModifyTime=0;	//url.txt파일의 수정된 시간 저장용 

/**
 * stream server
 */ 
var sys = require('util'),
	fs = require('fs'),
	net = require('net'),
	clients = [];

// 다중 접속이 가능하도록 clinet관리
function Client(stream){ 
	this.name = null;
	this.stream = stream;
}

net.createServer(function(stream) {
	var client = new Client(stream);
	clients.push(client);
	
	stream.setTimeout(0);
	stream.setEncoding('utf8');
	
    stream.on('connect', function() {
        sys.puts('[S#1] App connected');
		fs.readFile(file, function(err, data){
            stream.write(JSON.stringify({
                action: 'connect',
                url: data.toString()
            }));
        });
    });
	
    stream.on('end', function() {
		sys.puts('[S#1] disconnected');
		clients.remove(client);
	    stream.end();
	});
}).listen(8128,function(){
	sys.puts('[S#1] Stream server running, please start application');
	fs.watchFile(file, { interval: 100, persistent: true }, function(curr, prev) {
        //파일 수정 시간을 비교하여 판
		if(curr.mtime.getTime() != prev.mtime.getTime()){
			fileModifyTime = curr.mtime.getTime();
			sys.puts("modify Time :" + fileModifyTime);
            fs.readFile(file, function(err, data){
				//접속된 모든 client로 url을 수정시간과 함께 JSON으로 보냄
				clients.forEach(function(c){
					c.stream.write(JSON.stringify({
                        action: 'changeURL',
                        url: data.toString()
                    }));
					sys.puts('[S#1] URL file updated: ' + file + ":" + data.toString());
				});
            });
        }
    });
});



/**
 * http Server
 */
var http = require('http'),
	path = require('path'),
	url = require('url');

http.createServer(function(req,res){
	var uri = url.parse(req.url).pathname;
	var queryString = url.parse(req.url).query;
	console.log('[S#2] ' + uri);
	switch(uri){
		case '/rd':
		case '/redirect':
			fs.readFile(file, function(err, data){
				res.writeHead(302, {
				  'Location': data.toString()
				});
				res.end();
				console.log("[S#2] redirect : " + data.toString());
            });
		break;
		case '/getURL':
			fs.readFile(file, function(err, data){
				res.writeHead(200,{"Content-Type" : "text/html"});
				console.log("[S#2] getURL : " + data.toString());
				res.write(JSON.stringify({
					url : data.toString(),
					mTime : fileModifyTime
				}));
				res.end();
            });
		break;
		case '/newURL':
		default:
			res.writeHead(200,{"Content-Type" : "text/html"});
			res.write(queryString);			
			console.log("[S#2] bookmarklet update :" + queryString);
			fs.writeFile(file,queryString,function(err){
				if (err) {
					console.log("[S#2] write file error");
				}
				else {
					console.log("[S#2] write file success");
				}
			});
			res.end();
		break;
	}
}).listen(8080,function(){
	console.log('[S#2] http Server Running');
});
