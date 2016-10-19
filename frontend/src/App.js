import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import $ from 'jquery';

function getUserList(resObj) {
    return resObj.map((obj) => {
        return {
            pk: obj.pk,
            username: obj.fields.username
        }
    });
}

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
        return {
            userPk: 3,
            currentStream: 0,
            friendList: [],
            streamsDict: {}
        };
    },

    componentDidMount: function() {
        const friendsURL = `/api/v1/users/${this.state.userPk}/friends`;
        $.ajax({
            type: 'GET',
            url: friendsURL,
            success: (res1) => {
                const users = getUserList(res1);
                this.setState({
                    friendList: users
                });
               this.state.friendList.forEach((user) => {
                   const streamURL = `/api/v1/users/${this.state.userPk}/stream/${user.pk}`;
                   $.ajax({
                       type: 'GET',
                       url: streamURL,
                       success: (res) => {
                           const newState = Object.assign({}, this.state.streamsDict);
                           newState[user.pk] = getMessageList(res);
                           this.setState({
                               streamsDict: newState, 
                               currentStream: user.pk
                           });
                        }
                   });
                });  
            } 
        });
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
                <Friends friendList={this.state.friendList} changeStream={this.changeStream}/>
                <Messages messageList={messageList} />
                <Write author={this.state.userPk} recipient={this.state.currentStream} />
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
            text: this.state.text,
            date_sent: Date.now(),
            author: this.props.author,
            recipient: this.props.recipient
        }
        event.preventDefault();
        $.ajax({
            type: 'POST',
            url: 'api/v1/messages/',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(data),
        })
    },

    editMessage: function(event) {
        this.setState({
            text: event.target.value
        })
    },

    render: function() {
        return (
            <form onSubmit={this.postMessage}>
                <textarea onChange={this.editMessage} />
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
                           return (
                               <Friend data={friend} changeStream={this.props.changeStream}/> 
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
