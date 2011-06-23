// Common
// var persistence = require('persistencejs/lib/persistence').persistence;
// 
// var persistenceStore = require('persistencejs/lib/persistence.store.sqlite');
// persistenceStore.config(persistence, './url.db');
// var session = persistenceStore.getSession();

// extend array
Array.prototype.remove = function(e){
	for(var i=0;i<this.length;i++){
		if(e==this[i]) {return this.splice(i,1);}
	}
};

var file = './url.txt',	//browser에서 보낸 url을 저장해놓는 파
	fileModifyTime=0;	//url.txt파일의 수정된 시간 저장용

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
        //while(true);
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
				var newURL = data.toString();
				clients.forEach(function(c){
					c.stream.write(JSON.stringify({
                        action: 'changeURL',
                        url: newURL
                    }));
					sys.puts('[S#1] URL file updated: ' + file + ":" + newURL);
				});
            });
        }
    });
});
