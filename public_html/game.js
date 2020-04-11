var socket = io();
var GAMESTATE = 0;
let PLAYING = 1;
let WAITINGFORCARD = 2;
var waitingRoomGameLoop = null;

$(document).ready(function(){

	$('#joinGame').click(joinGame);
	
	socket.on("counter",function(data){
		if(data===0){
			$("#preGame").hide();
			$("body").append("<p>Sorry, this game is already in progress.</p>")
		}else{
			$("#gameStartCoundown").empty();
			$("#gameStartCoundown").append("<p>Game will begin in "+data+" seconds!</p>");
		}
	});
	
	socket.on("userList",function(data){
		
		$("#userList").empty();
		if (data.users.length === 0){
			var ul = $("<li>Nobody's here</li>").appendTo("#userList");
		}else{			
			for (i = 0; i < data.users.length; i++){
				var ul = $("<li>"+data.users[i]+"</li>").appendTo("#userList");
			}
		}
	});
	
	$('#submitPage').click(submitPage);
	
	socket.on("nextCard", getNextCard);
	
	//socket.on("startGame", playGame);
	
	
});


function submitPage() {

	let description = $("#block2 textarea").val();
	console.log(description);
	let data = {};
	
	if (description===undefined){
		//must be a drawing
		description = canvas.toDataURL();
		data.type = 1;
	}else{
		data.type = 2;
	}
	console.log("we are here");
	data.description = description;
	socket.emit("submission", data);
	setToWaiting();
	socket.emit("getNext");
	
}

function joinGame(){
	
 var userName = prompt("What's your name?")||"User";
	
	socket.emit("intro", userName);
	
	socket.on("message",function(data){
		
		$("#userMessage").empty();
		$("#userMessage").append("<p>"+data+"</p>");
	});	

	socket.on("startGame",function(data){
		GAMESTATE = PLAYING;
		$("#preGame").hide();
		$("#game").show();
		$("#title").text("Let's start the game!");
		$("#block2").append(
			"<textarea/><p>Please enter a description here. It can be anything you want!</p>"
		);
	});	
	
	
}


function getNextCard(data){
	console.log("GOT NEXT CARD!");
	console.log(data)
	GAMESTATE = PLAYING;
	$("#message").empty();
	$("#game").show();
	
	
}

function setToWaiting(){
	console.log("waiting for next card");
	GAMESTATE = WAITINGFORCARD;
	$("#game").hide();
	$("#message").append("<p>Waiting...</p>");	
}

/*
function playGame(players){
	
	clearInterval(waitingRoomGameLoop)
	var currentPlayer = undefined;
	
	$("body").empty();
		$("body").append(
			"<h1 id = 'whoseTurn'></h1><canvas id='drawCanvas'></canvas><div id = 'users'><ul class = 'userlist'><li>Players</li><ul></div>"
		);
	
	var canvas = document.getElementById('drawCanvas');
	var context = canvas.getContext('2d');
	canvas.width = 700;
	canvas.height = 500;
		
	var playerTurns = [];
	  for (var id in players) {  
		playerTurns.push(id)	
	  }
	
	doTurn(playerTurns, players,0)
	
	
	
}



function doTurn(order, players, index){
	 	var canvas = document.getElementById('drawCanvas');
		var context = canvas.getContext('2d');
		
		var brushMovement = undefined;
		var mouseDown = false;
		
		var brush = {
			x: -100,
			y: -100		
		}
		
		document.addEventListener('mousedown', function(event){
			mouseDown = true;
			var rect = canvas.getBoundingClientRect()				
			brush.x = event.x-rect.left;
			brush.y = event.y-rect.top;
			brush.prevX = -100
			brush.prevY = -100
		});
		
		document.addEventListener('mouseup', function(event){
			mouseDown = false;
			brush.x = -100;
			brush.y = -100;
		});
		
		document.addEventListener('mousemove', function(event){
			if (mouseDown){
				var rect = canvas.getBoundingClientRect();
				brush.prevX = brush.x;
				brush.prevY = brush.y;
				brush.x = event.x-rect.left;
				brush.y = event.y-rect.top;
			}
		});
		
		
	socket.on("drawing", function(brush){
		
			if (brush.prevX == -100){
				context.beginPath();
				moveTo(brush.x,brush.y)
			}else if (brush.x != -100){
				context.lineWidth = 5;
				context.lineTo(brush.x,brush.y);
				context.stroke();
			}
				
				//context.arc(brush.x, brush.y, 10, 0, 2 * Math.PI);
				//context.fillStyle = "black";
				//context.fill();				
				
	});
	
	socket.on("timer", function(data){
		context.rect(0,0,canvas.width,10);
		context.rect(0,0,data,10)
	});
	
	socket.on("refresh", function(){
		context.clearRect(0,0,canvas.width,canvas.height);
	})
	
	if (order[index]!= socket.id){
		$("#whoseTurn").text(players[order[index]].name+" is drawing.");
	}else{
		$("#whoseTurn").text("You are drawing: dog");
		socket.emit('newTurn');
		brushMovement = setInterval(function() {
		  socket.emit('brushMovement', brush);
		}, 1000 / 60);
		
	}	
	//console.log("On ", players[order)
	
	$(".userlist").empty();
	$(".userlist").append("<li style='text-decoration:underline;font-weight:bold;'>Players</li>")
	for (i = (index+1); i<(order.length+index);i++){
		$(".userlist").append("<li>"+players[order[i%order.length]].name+"</li>")
	}	
		
	setTimeout(function(){ 
	
		if (brushMovement!=undefined){
			clearInterval(brushMovement)
		}
		
		index+=1;
		if (index<order.length){
			doTurn(order,players,index);
		}
		
	}, 20000);
	
	
}
*/