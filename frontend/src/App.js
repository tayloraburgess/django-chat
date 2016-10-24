import React from 'react';
import './App.css';

import $ from 'jquery';

const DEV = true;

const App = React.createClass({
    getInitialState: function() {
        return {
            userPk: 0, 
            currentStream: 0,
            streamsDict: {},
            userDict: {},
            socket: {}
        };
    },

    componentDidMount: function() {
    	function sortMessages(messageList) {
		    return messageList.sort((a, b) => {
		       return a.date_sent <= b.date_sent ? -1 :1;  
		    });
		}

		function getMessageList(resObj) {
		    const messageList = resObj.map((obj) => {
		        return {
		            text: obj.fields.text,
		            author: obj.fields.author,
		            date_sent: obj.fields.date_sent,
		            read: obj.fields.read
		        }
		    });
		    return sortMessages(messageList);
		}

		function ajaxUsersSuccess(res) {
			const users = {};
            res.forEach((user) => {
                users[user.pk] = user.fields.username;
            });
            this.setState({
                userDict: users
            });
		}

		function ajaxStreamsSuccess(res) {
			const streamsDict = {}; 
            res.streams.forEach((stream) => {
                streamsDict[stream.friend] = {
                    messages: getMessageList.call(this, JSON.parse(stream.messages)),
                    read: stream.read
                };
            });
            this.setState({
               streamsDict: streamsDict, 
            });
		}

		function ajaxCurrentSuccess(res) {
			this.sockets(res.pk);
            this.setState({
                userPk: res.pk
            });
            $.get('api/v1/users', ajaxUsersSuccess.bind(this));
            const streamURL = `api/v1/users/${this.state.userPk}/streams/`;
            $.get(streamURL, ajaxStreamsSuccess.bind(this));
		}

        $.get('api/v1/users/current', ajaxCurrentSuccess.bind(this));
    },

    sockets: function(userPk) {
    	function newMessage(data) {
    		const newState = Object.assign({}, this.state.streamsDict);
            if (!newState[data.author]) {
                newState[data.author] = {
                    messages: [],
                    read: false
                } 
            }
            newState[data.author].messages.push({
                text: data.text,
                author: data.author,
                read: data.read
            });
            newState[data.author].read = false;
            this.setState({
                streamsDict: newState 
            });
    	}

    	function messageEcho(data) {
    		const newState = Object.assign({}, this.state.streamsDict);
            if (!newState[data.recipient]) {
                newState[data.recipient] = {
                    messages: [],
                    read: true
                } 
            }
            newState[data.recipient].messages.push({
                text: data.text,
                author: this.state.userPk,
                read: true
            });
            this.setState({
                streamsDict: newState 
            });
    	}

    	function newSocket(URI) {
    		const ws = new WebSocket(URI);

	        ws.onmessage = (message) => {
	            const messageData = JSON.parse(message.data)
	            if (messageData.type === 'new_message') {
	                newMessage.call(this, messageData)
	            } else if (messageData.type === 'message_echo') {
	                messageEcho.call(this, messageData)
	            }
	        }

	        ws.onopen = () => {
	            const handshake = {
	                type: 'handshake',
	                user: userPk
	            }
	            ws.send(JSON.stringify(handshake));
	        }
	        return ws;
    	}

        let socketURI;
        if (DEV) {
            socketURI = 'ws://localhost:8000';
        } else {
            socketURI = `ws://${location.host}`
        }
        const ws = newSocket.call(this, socketURI);
        this.setState({
            socket: ws
        });
    },

    changeStream: function(userPk) {
        this.setState({
            currentStream: userPk 
        });
        this.readStream(userPk);
    },

    readStream: function(userStream) {
        if (this.state.streamsDict[userStream]) {
            const newState = Object.assign({}, this.state.streamsDict);
            newState[userStream].read = true;
            this.setState({
                streamsDict: newState 
            });
            const message = {
                type: 'messages_read',
                author: userStream,
                recipient: this.state.userPk 
            } 
            this.state.socket.send(JSON.stringify(message));
        }
    },

    generateMessagesView: function() {
    	let messages;
        if (this.state.currentStream > 0) {
            const currentStream = this.state.streamsDict[this.state.currentStream];
            let messageList;
            if (currentStream) {
                messageList = currentStream.messages;
            }
            messages = (
                <div className='flex-item-2'>
                    <h2>chat with { this.state.userDict[this.state.currentStream] }</h2>
                    <Messages
                        messageList={ messageList }
                        userPk={ this.state.userPk }
                    />
                    <Write
                        socket={ this.state.socket }
                        author={ this.state.userPk }
                        recipient={ this.state.currentStream }
                    />
                </div>
            );
        }
        return messages;
    },

    generateFriendList: function() {
    	let friendList = [];
        if (Object.keys(this.state.streamsDict).length > 0) {
            friendList = Object.keys(this.state.streamsDict);
        }
        return friendList;
    },

    generateOtherUsers: function(friendList) {
    	return Object.keys(this.state.userDict).filter((user) => {
            if (friendList.indexOf(user) === -1 && parseInt(user, 10) !== this.state.userPk) {
                return true; 
            }
            return false;
        });
    },

    showFriendsOrNot: function(friendList) {
    	let friends;
    	if (friendList.length > 0) {
            friends = (
                <div>
                    <h2>friends</h2>
                    <Users 
                        userDict={ this.state.userDict }
                        streamsDict={ this.state.streamsDict }  
                        userList={ friendList }
                        changeStream={ this.changeStream }
                        id='friends'
                    />
                </div>
            );
        }
        return friends;
    },

    render: function() {
        const friendList = this.generateFriendList();
        const otherUsers = this.generateOtherUsers(friendList);
        const friends = this.showFriendsOrNot(friendList);
        let usersText = 'users';
        if (friends) {
        	usersText = 'other users';
        }
        const messages = this.generateMessagesView();
        return (
            <div>
                <div>
                    <h1>hi, {this.state.userDict[this.state.userPk]}</h1>
                    <form action='logout/'>
                        <button type='submit'>logout</button>
                    </form>
                </div>
                <br />
                <div className='flex-container'>
                    <div className='flex-item-1'>
                        { friends }
                        <h2>{ usersText }</h2>
                        <Users
                            userDict={ this.state.userDict }
                            streamsDict={ this.state.streamsDict }
                            userList={ otherUsers }
                            changeStream={ this.changeStream }
                            id='other-users'
                        />
                    </div>
                    { messages } 
                </div>
            </div>
        );
    } 
});

const Users = React.createClass({
	generateUserComponents: function() {
		return this.props.userList.map((user) => {
           let read = true;
           if (this.props.streamsDict[user]) {
               read = this.props.streamsDict[user].read;
           } 
           return {
               pk: user,
               username: this.props.userDict[user],
               read: read 
           };
        }).sort((a, b) => {
           return a > b ? -1 : 1
        }).sort((a, b) => {
           return a.read ? 1 : -1 
        }).map((data, i) => {
           return (
               <User
                   key={ i }
                   data={ data }
                   changeStream={ this.props.changeStream }
               /> 
            ); 
        });
	},

    render: function() {
        const userComponents = this.generateUserComponents();
        return (
            <div className="splits" id={ this.props.id }>
                <ul>
                    { userComponents.map((component, i ) => {
                        return (
                            <li key={ i }>
                                { component }
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
});

const User = React.createClass({
    render: function() {
        const changeStream = () =>  {
            this.props.changeStream(this.props.data.pk);
        };
        let notification = "";
        if (this.props.data.read === false) {
            notification = "[ ! ] "; 
        } 
        return (
            <span
                className='fake-link'
                onClick={ changeStream }
            >
            { notification }
            { this.props.data.username }
            </span>
        )
    }
});

const Messages = React.createClass({
    componentDidUpdate: function() {
        this.refs.messagesDiv.scrollTop = this.refs.messagesDiv.scrollHeight;
    },

    generateMessages: function() {
    	return this.props.messageList.map((message, i) => {
            if (message.author === this.props.userPk) {
                return (<li className='from-user' key={ i }> { message.text } </li>);
            } else {
                return (<li className='from-other' key={ i }> { message.text } </li>);
            }
        });
    },

    render: function() {
        const messages = this.generateMessages();
        return (
            <div className='splits' id='messages' ref='messagesDiv'>
                <ul>
                    { messages }
                </ul>
            </div>
        );
    }
});

const Write = React.createClass({
    getInitialState: function() {
        return {
            text: ''
        };
    },

    postMessage: function(event) {
        const data = {
            type: 'message',
            text: this.state.text,
            date_sent: Date.now(),
            author: this.props.author,
            recipient: this.props.recipient
        }
        this.props.socket.send(JSON.stringify(data));
        event.preventDefault();
        this.setState({
            text: ''
        });
    },

    editMessage: function(event) {
        this.setState({
            text: event.target.value
        });
    },

    render: function() {
        return (
            <div className='send-message'>
                <form onSubmit={ this.postMessage }>
                    <textarea
                        onChange={ this.editMessage }
                        value={ this.state.text }
                    />
                    <button className='message-button' type='submit'>
                        send message
                    </button>
                </form>
            </div>
        );
    }
});

export default App;
