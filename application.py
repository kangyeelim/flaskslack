import os
	
from collections import deque
from flask import Flask, render_template, request, session, redirect, flash
from loginhelper import login_required
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Keep track of channels created (Check for channel name)
channels = []

# Keep track of users logged (Check for username)
users = []

# Instanciate a dict
channelMessages = dict()

creators = dict()


@app.route("/")
@login_required
def home():
	return render_template("home.html", username=session["username"], 
	channels=channels)
		
@app.route("/start")
def index():
	return render_template("index.html")


@app.route("/signin", methods=['POST'])
def signin():
	session.clear()
	username = request.form.get("username")
	if username in users:
		return render_template("error.html", username=username)
	session["username"] = username
	session.permanent = True
	users.append(username)
	return redirect("/")

@app.route("/create",  methods=['POST'])
def create():
	channel = request.form.get("channel")
	if channel in channels: 
		flash('Channel already exists. Choose another name to create a new channel.')
		return redirect("/")
	channels.append(channel)
	session["channel"] = channel
	channelMessages[channel] = deque()
	creators[channel] = session["username"]
	return redirect("/channels/" + channel)
	
@app.route("/channels/<channel>", methods=['GET','POST'])
@login_required
def enterchannel(channel):
	""" Show channel page to send and receive messages """

    # Updates user current channel
	session['channel'] = channel
	if request.method == "POST":   
		return redirect("/")
	else:
		return render_template("chat.html", username = session["username"],
		channels=channels, messages=channelMessages[channel])


@socketio.on("joined", namespace='/')
def joined():
	""" Send message to announce that user has entered the channel """
	
    # Save current channel to join room.
	room = session.get('channel')

	join_room(room)
    
	emit('status', {
		'channel': room,
        'msg': session.get('username') + ' has entered the channel'}, 
        room=room)

@socketio.on("left", namespace='/')
def left():
    """ Send message to announce that user has left the channel """

    room = session.get('channel')

    leave_room(room)

    emit('status', {
        'msg': session.get('username') + ' has left the channel'}, 
        room=room)
		

@socketio.on('send message')
def send_msg(msg, timestamp):
    """ Receive message with timestamp and broadcast on the channel """

    # Broadcast only to users on the same channel.
    room = session.get('channel')

    # Save 100 messages and pass them when a user joins a specific channel.

    if len(channelMessages[room]) > 100:
        # Pop the oldest message
        channelMessages[room].popleft()

    channelMessages[room].append([timestamp, session.get('username'), msg])

    emit('announce message', {
        'user': session.get('username'),
        'timestamp': timestamp,
        'msg': msg}, 
        room=room)		
		
@socketio.on("deletechannel", namespace='/')
def deletechannel():

	# Broadcast only to users on the same channel.
	room = session.get('channel')

	# Delete messages from channel and remove channel
	if creators[room] == session["username"]:
		channelMessages.pop(room)
		channels.remove(room)
		leave_room(room)

		emit('deleted channel', room=room)
	else:
		emit('status', {'msg': session.get('username') + ' tried to delete the channel. Only the channel creator can.'}, room=room)
	
@socketio.on('rest delete channel')
def restdeletechannel():

	# Broadcast only to users on the same channel.
	room = session.get('channel')

	# Leave room
	leave_room(room)	
	
@socketio.on('image-upload')
def imageUpload(image_data):
    room = session.get('channel')
    emit('send-image', image_data, room=room)
	
@app.route("/signout")
def signout():
	""" Logout user from list and delete cookie."""

	# Remove from list
	try:
		users.remove(session['username'])
	except ValueError:
		pass

	session.clear()

	return redirect("/")