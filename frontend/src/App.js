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
            friendList: [],
            streamsDict: {},
            userDict: {},
            socket: {}
        };
    },

    eventListen: function() {
        const ws = new WebSocket('ws://localhost:8000');
        ws.onmessage = (message) => {
            const data = JSON.parse(message.data)
            const newState = Object.assign({}, this.state.streamsDict);
            newState[data.author].push(data.text)
            this.setState({
                streamsDict: newState, 
            });
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
        const friendsURL = `/api/v1/users/${this.state.userPk}/friends`;
        $.ajax({
            type: 'GET',
            url: friendsURL,
            success: (res1) => {
                const users = res1.map((user) => {
                    return user.pk;
                }); 
                this.setState({
                    friendList: users
                });
               this.state.friendList.forEach((user) => {
                   const streamURL = `/api/v1/users/${this.state.userPk}/stream/${user}`;
                   $.ajax({
                       type: 'GET',
                       url: streamURL,
                       success: (res) => {
                           const newState = Object.assign({}, this.state.streamsDict);
                           newState[user] = getMessageList(res);
                           this.setState({
                               streamsDict: newState, 
                               currentStream: user
                           });
                        }
                   });
                });  
            } 
        });
        this.eventListen();
    },

    changeStream: function(userPk) {
        this.setState({
            currentStream: userPk 
       });
    },

    render: function() {
        let messageList;
        if (Object.keys(this.state.streamsDict).length > 0) {
            messageList = this.state.streamsDict[this.state.currentStream];
        } else {
            messageList = [];
        }
        return (
            <div>

            <h1>{this.state.userDict[this.state.userPk]}</h1>
                <Friends userDict={this.state.userDict} friendList={this.state.friendList} changeStream={this.changeStream}/>
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
        $.ajax({
            type: 'POST',
            url: 'api/v1/messages/',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: (res) => {
                this.setState({
                    text: ''
                });
            }
        })
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
