import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import $ from 'jquery';

function getMessageList(resObj) {
    return resObj.map((obj) => {
        return obj.fields.text
    });
}

class App extends Component {
    render() {
        return (
            <div>
                <SPA />
            </div>
        );
    }
}

const SPA = React.createClass({
    getInitialState: function() {
        const tempUser = prompt('Enter a user pk.');
        return {
            userPk: parseInt(tempUser),
            currentStream: 0,
            streamsDict: {},
            userDict: {},
            socket: {}
        };
    },

    sockets: function() {
        const ws = new WebSocket('ws://localhost:8000');
        ws.onmessage = (message) => {
            const data = JSON.parse(message.data)
            if (data.type === 'new_message') {
                const newState = Object.assign({}, this.state.streamsDict);
                newState[data.author].push(data.text)
                this.setState({
                    streamsDict: newState 
                });
            } else if (data.type === 'message_echo') {
                const newState = Object.assign({}, this.state.streamsDict);
                newState[data.recipient].push(data.text)
                this.setState({
                    streamsDict: newState 
                });
            }
        }
        ws.onopen = () => {
            const handshake = {
                type: 'handshake',
                user: this.state.userPk
            }
            ws.send(JSON.stringify(handshake));
        }
        this.setState({
            socket: ws
        });
    },

    componentDidMount: function() {
        $.ajax({
            type: 'GET',
            url: 'api/v1/users/',
            success: (res) => {
                const users = {};
                res.forEach((user) => {
                    users[user.pk] = user.fields.username;
                });
                this.setState({
                    userDict: users
                });
            }
        });
       const streamURL = `/api/v1/users/${this.state.userPk}/streams/`;
       $.ajax({
           type: 'GET',
           url: streamURL,
           success: (res) => {
               const streamsDict = {}; 
               res.streams.forEach((stream) => {
                   console.log(stream);
                   streamsDict[stream.friend] = getMessageList(JSON.parse(stream.messages));
               });
               this.setState({
                   streamsDict: streamsDict, 
                   currentStream: Object.keys(streamsDict)[0]
               });
            }
       });
        this.sockets();
    },

    changeStream: function(userPk) {
        this.setState({
            currentStream: userPk 
       });
    },

    render: function() {
        let messageList;
        let friendList;
        if (Object.keys(this.state.streamsDict).length > 0) {
            const currentStream = this.state.streamsDict[this.state.currentStream];
            if (currentStream) {
                messageList = currentStream;
            } else {
                messageList = [];
            }
            friendList = Object.keys(this.state.streamsDict);
        } else {
            messageList = [];
            friendList = [];
        }       
        const otherUsers = Object.keys(this.state.userDict).filter((user) => {
            if (friendList.indexOf(user) === -1 && user !== this.state.userPk) {
                return true; 
            }
            return false;
        });

        return (
            <div>

            <h1>{this.state.userDict[this.state.userPk]}</h1>
                <Friends userDict={this.state.userDict} friendList={friendList} changeStream={this.changeStream}/>
            <hr />
<Friends userDict={this.state.userDict} friendList={otherUsers} changeStream={this.changeStream}/>
                <h3>{this.state.userDict[this.state.currentStream]}</h3>
                <Messages messageList={messageList} />
                <Write socket={this.state.socket} author={this.state.userPk} recipient={this.state.currentStream} />
            </div>
        );
    } 
});

const Messages = React.createClass({
    render: function() {
        const messages = this.props.messageList.map((message) => {
            return (<li> { message } </li>);
        });
        return (
            <div>
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
            <form onSubmit={this.postMessage}>
                <textarea onChange={this.editMessage} value={this.state.text} />
                <button type='submit'>Send Message</button>
            </form>
        )
    }
})

const Friends = React.createClass({
    render: function() {
        return (
            <div>
                <ul>
                    {
                       this.props.friendList.map((friend) => {
                           const data = {
                               pk: friend,
                               username: this.props.userDict[friend]
                           }
                           return (
                               <Friend data={data} changeStream={this.props.changeStream}/> 
                            );
                        })
                    }
                </ul>
            </div>
        );
    }
});

const Friend = React.createClass({
    render: function() {
        const changeStream = () =>  {
            this.props.changeStream(this.props.data.pk)
        };
        return (
            <li> <a href="#" onClick={changeStream}>{ this.props.data.username }</a></li>
        )
    }
})

export default App;
