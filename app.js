/*SocketIO based chat room.*/

var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.createServer(handleRequest); 
var io = socketIO(server);
var fs = require('fs');
var mime = require('mime-types');
var url = require('url');
const ROOT = "./public_html";

server.listen(80);
console.log('Server listening on port 80');


var GAME_STATE = 0;

function handleRequest(req, res) {
	
	//process the request
	console.log(req.method+" request for: "+req.url);
	
	//parse the url
	var urlObj = url.parse(req.url,true);
	var filename = ROOT+urlObj.pathname;
	var pathname = urlObj.pathname;
	
	
	if (pathname ==  "/pictionary/intro"){
		
		respond(200,JSON.stringify(players));
		
	}else{

		//the callback sequence for static serving...
		fs.stat(filename,function(err, stats){		
			if(err){   //try and open the file and handle the error, handle the error
				respondErr(err);
			}else{
				if(stats.isDirectory())	filename+="/index.html";
			
				fs.readFile(filename,"utf8",function(err, data){
					if(err)respondErr(err);
					else respond(200,data);
				});
			}
		});			
		
		//locally defined helper function
		//serves 404 files 
		function serve404(){
			fs.readFile(ROOT+"/404.html","utf8",function(err,data){ //async
				if(err)respond(500,err.message);
				else respond(404,data);
			});
		}
			
		//locally defined helper function
		//responds in error, and outputs to the console
		function respondErr(err){
			console.log("Handling error: ",err);
			if(err.code==="ENOENT"){
				serve404();
			}else{
				respond(500,err.message);
			}
		}
			
		//locally defined helper function
		//sends off the response message
		function respond(code, data){
			// content header
			res.writeHead(code, {'content-type': mime.lookup(filename)|| 'text/html'});
			// write message and signal communication is complete
			res.end(data);
		}	
	}	
	
	//locally defined helper function
	//sends off the response message
	function respond(code, data){
		// content header
		res.writeHead(code, {'content-type': mime.lookup(filename)|| 'text/html'});
		// write message and signal communication is complete
		res.end(data);
	}	
	
};//end handle request
	
	
	
var players = [];
var clients = [];

//send player countdown
var counter = 20;
var gameCountdown = setInterval(function(){
	io.sockets.emit('counter', counter);
	counter--;
	console.log(counter + " minutes left before start!");
	if (counter===0){
		io.sockets.emit('counter', -1);
		//game begins
		//emit to all players
		clearInterval(gameCountdown);
		io.sockets.emit('startGame');
	}
}, 1000);


io.on("connection", function(socket){
	  
	io.sockets.emit('counter', counter);
	
		let users = {users: getUserList()};
		
		console.log(users);
		io.emit("userList", users);
	
	 socket.on("intro",function(data){
		socket.username = data;
		console.log("Player " + data + " joined the game!");
	
		let message = "Thanks for joining, " + socket.username +"!";
		if (GAME_STATE != 0){
			message = "Sorry, the game has already begun!";
		}
		
		socket.emit("message",message);
		
		let newPlayer = {
			name: data,
			id: socket.id,
			cardQueue: [],
			currentCard: null,
			addCard: function (creator,prev,data) {
				
				//console.log("Adding new card from " + creator +"to me, " + this.name);
				
				let card = new Card(creator,prev,data.type,data.description);
				this.cardQueue.push(card);
				if(this.currentCard===null&&this.cardQueue[0]!=undefined){
					socket.emit("nextCard",this.cardQueue[0]);
					this.currentCard = this.cardQueue.pop();
				}			
			},
			getNextCard: function(){
				if(this.cardQueue[0]!=undefined){
					this.currentCard = this.cardQueue.pop();
					socket.emit("nextCard",this.currentCard);
				}else{
					this.currentCard = null;
				}
			}
		};
		
		players.push(newPlayer);
		
		
		users = {users: getUserList()};
		io.emit("userList", users);
	  		
	});
  
  
	  socket.on('submission', function(data) {
		  console.log("RECIEVED SUBMISSION")
		   console.log(data);
		   sendCardToNextUser(socket.id,data)
	  });
	  
	   socket.on("requestNextCard",function(data){
		   for(var i=0;i<players.length;i++){
				if(players[i].id === socket.id){	
					players[i].getNextCard();			
				}
		   }			
			
	   });
	  
	  
	/*
	  socket.on('new player', function() {
		  console.log("in new player!")
		players[socket.id] = {
		  x: 100,
		  y: 100,
		  colour: getRandomColor()
		};

	});*/
	
	/*
	socket.on("intro",function(data){
		socket.username = data;
		console.log(data);
		socket.broadcast.emit("message", timestamp()+": "+ socket.username+" has entered the chatroom.");
		socket.emit("message","Welcome, "+socket.username+".");
		users = {users: getUserList()};
		players[socket.id] = {
		  x: 100,
		  y: 100,
		  colour: getRandomColor(),
		  name: data, 
		  score: 0
		};
		waitingRoomState = setInterval(function() {
		 io.sockets.emit('state', players);
		}, 1000 / 60);
		
		io.emit("userList", users);
			
	});
	
	*/

	socket.on("message", function(data){
		socket.broadcast.emit("message",timestamp()+", "+ socket.username+": "+data);
	});
	
	
	socket.on("brushMovement", function(data){
		io.emit("drawing",data)	
	});
	
	socket.on("newTurn", function(){
		io.emit("refresh")
		timer = 600;
		
		setInterval(function() {
			timer-=1;
			io.sockets.emit('timer', timer);
		}, 1000 / 60);
		
	});
	
	
	
	socket.on("disconnect", function(){
		console.log(socket.username+" disconnected");
	
		//players.remove(socket.id);
		
		clients = clients.filter(function(ele){  
			return ele!==socket;
        });
		
		users = {users: getUserList()};
		io.emit("userList", users);
	});
	
	//adds socket to client
	clients.push(socket); 
	
	

	
});

function timestamp(){
	return new Date().toLocaleTimeString();
}

function getUser(username){

	for(var i=0;i<players.length;i++){
        if(players[i].username = username){
			return clients[i];
		}
    }
	
}

function sendCardToNextUser(id,data){

	for(var i=0;i<players.length;i++){
        if(players[i].id === id){
			let nextId = (i+1)%players.length;
			players[nextId].addCard(id,players[i].currentCard,data)
			players[i].getNextCard();
		}
    }	
}


//a card
//links to previous created card
//and is either a drawing (1) or text (0)
class Card {
	
	constructor(creator,prev,type,message) {
		    this.creator = creator;
			this.prev = prev;
			this.type = type;
			this.description = message;
			console.log("Creating a card of type" + type + " with message " + message);
	}
 
 
   getType() {
    return this.type;
  }
  getNextType(){
	  if (prev === null){
		  this.type = 0;
	  }else{
		  this.type = 1- prev.getType();
	  }
  }
}

function getUserList(){
    var ret = [];
	for(var player in players){
		ret.push(players[player].name); 
	}
    return ret;
}



function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
