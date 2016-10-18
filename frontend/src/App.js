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
            userPk: 3
        };
    },

    render: function() {
        return (
            <div>
                <Friends friendsURL={`/api/v1/users/${this.state.userPk}/friends`} />
            </div>
        );
    } 
});

const Friends = React.createClass({
    getInitialState: function() {
        return {
            friendList: []
        }
    },

    componentDidMount: function() {
        this.serverRequest =  $.get(this.props.friendsURL, (res) => {
           const users = getUserList(res);
           this.setState({
               friendList: users  
           }); 
        });
    }, 

    render: function() {
        const names = this.state.friendList.map((friend) => {
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
