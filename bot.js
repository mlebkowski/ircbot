#!/usr/local/bin/node

var irc = require('irc');
var http = require('http');

var opts = {
    userName: 'docplanner',
    realName: 'Doctor Planner',
    autoRejoin: false,
    channels: ['#docplanner'],        
}

var replies = [
	{
		"command": "sync",
		"callback": function (from, to, message) {
			this.say(to, "I'm sorry, " + from + ", I'm afraid I can't do that.");
		}
	},
	{
		"command": "help",
		"callback": function (from, to, message) {
			this.say(to, from + ": https://www.youtube.com/watch?v=ZNahS3OHPwA&feature=kp");
		}
	},
	{
		"re": /^czy ?znany( ?lekarz)? ?dzia.a/i,
		"nick": false,
		"callback": function (from, to, message) {
			this.say(to, from + ': Nope');
		}
	},
	{
		"re": /.+/,
		"nick": true,
		"callback": function (from, to, message) {
			this.say(to, from + ": Spierdalaj");		
		}
	}
];

var client = new irc.Client('irc.freenode.net', 'DocPlanner', opts);
var flood = false, server = http.createServer(function (request, response) {
	if (flood) {
		response.writeHead(509);
		response.end();
		return;
	}
    response.writeHead(200, {'Content-Type': 'text/plain'});
	flood = true;
	setTimeout(function () { flood = false; }, 1500);

    var post = "";
    request.on('data', function (data) { post += data; });
    request.on('end', function () {
		client.say('#docplanner', post.substr(0,150));
    	response.end("");
    });
}).listen(2080);

client.addListener('message', function (from, to, message) {
	var myNick = this.opt.nick.toLowerCase(), isNick, command;

	if (message.substr(0,myNick.length+1).toLowerCase() == myNick + ":") {
		message = message.substr(myNick.length+2);
		isNick = true;
	}
	
	if ("!" == message.substr(0,1)) {
		command = message.match(/!([a-z]+)/i)[1];
		message = message.substr(command.length+2);
	}
	
	for (var reply, i = 0; reply = replies[i]; i++) {
		if ((!reply.command || command === reply.command) && (!reply.re || reply.re.test(message)) && (!reply.nick || isNick)) {
			return reply.callback.call(this, from, to, message);
		}
	}
	
});


client.addListener('error', function(message) {
    console.log('error: ', message);
});
    
