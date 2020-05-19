document.addEventListener('DOMContentLoaded', () => {
    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    
	socket.on('deleted channel', () => {

        // Remove last channel
        localStorage.removeItem('last_channel');
		socket.emit('rest delete channel')
		window.location.replace('/');
    })
	
	
	// When connected, configure button
	socket.on('connect', () => {
        // Notify the server user has joined
        socket.emit('joined');
        // Forget user's last channel when clicked on '+ Channel'
        document.querySelector('#newChannel').addEventListener('click', () => {
            socket.emit('left');
			localStorage.removeItem('last_channel');
        });
		
		document.querySelector('.dropdown-item').addEventListener('click', () => {
            socket.emit('left');
			localStorage.removeItem('last_channel');
        });

        // Forget user's last channel when logged out
        document.querySelector('#logout').addEventListener('click', () => {
            localStorage.removeItem('last_channel');
        });

        // 'Enter'
        document.querySelector('#comment').addEventListener("keydown", event => {
            if (event.key == "Enter") {
                document.getElementById("send-button").click();
            }
        });
        
        // Send button emits a "message sent" event
        document.querySelector('#send-button').addEventListener("click", () => {
            
            // Save time in format HH:MM:SS
            let timestamp = new Date;
            timestamp = timestamp.toLocaleTimeString();

            // Save user input
            let msg = document.getElementById("comment").value;

            socket.emit('send message', msg, timestamp);
            
            // Clear input
            document.getElementById("comment").value = '';
        });
		
		document.querySelector('#delete-channel').addEventListener("click", () => {
            socket.emit("deletechannel");
			localStorage.removeItem('last_channel');
			window.location.replace('/');
        })
		
		function handleFileSelect(ele){
			var file = ele.target.files[0];
			var fileReader = new FileReader();
			fileReader.readAsArrayBuffer(file); 
			fileReader.onload = () => {
				var arrayBuffer = fileReader.result; 
				socketControl.uploadImage({ 
					name: file.name, 
					type: file.type, 
					size: file.size, 
					binary: arrayBuffer 
				 });
			 }
		}
		
		document.getElementById('files').addEventListener('change', event => {
			const file = event.target.files;
			socket.emit('image-upload', {'image_data': file})
		});
    });
    
	function appendImageMessage(data) {
		var messageContainer = document.getElementById('chat');
		messageContainer.appendChild(createImageMessageDOM(data))
	}

	function createImageMessageDOM(data) {
		var img = document.createElement("img");
		var str = String.fromCharCode.apply(null, new Uint8Array(data.binary));
		img.src = 'data:image/jpg;base64,' + btoa(str);    
		img.style.width = '100%';
	}
	
	//When a channel is deleted, make sure all client in room cannot send messages and need delete channel
	socket.on("send-image", function(data) {
            appendImageMessage(data)
        })
	
    // When user joins a channel, add a message and on users connected.
    socket.on('status', data => {

        // Broadcast message of joined user.
        let row = '<' + `${data.msg}` + '>'
        document.querySelector('#chat').value += row + '\n';
		
        // Save user current channel on localStorage
        localStorage.setItem('last_channel', data.channel)
    })

    // When a message is announced, add it to the textarea.
    socket.on('announce message', data => {

        // Format message
        let row = '<' + `${data.timestamp}` + '> - ' + '[' + `${data.user}` + ']:  ' + `${data.msg}`
        document.querySelector('#chat').value += row + '\n'
    })
 
});