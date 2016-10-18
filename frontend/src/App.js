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
            currentStream: 2,
            friendList: [],
            messageList: []
        };
    },

    componentDidMount: function() {
        const friendsURL = `/api/v1/users/${this.state.userPk}/friends`
        const streamURL = `/api/v1/users/${this.state.userPk}/stream/${this.state.currentStream}`
        this.serverRequest = $.get(streamURL, (res) => {
            const messages = getMessageList(res);
            this.setState({
                messageList: messages
            });
        });
        this.serverRequest =  $.get(friendsURL, (res) => {
           const users = getUserList(res);
           this.setState({
               friendList: users  
           }); 
        });
    },

    render: function() {
        return (
            <div>
                <Friends friendList={this.state.friendList} />
                <Messages messageList={this.state.messageList} />
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

const Friends = React.createClass({
    render: function() {
        const names = this.props.friendList.map((friend) => {
            return (
               <li>{ friend.username }</li> 
            );
        });
 
        return(
            <div>
                <ul>
                    {names}
                </ul>
            </div>
        );
    }
});

export default App;
