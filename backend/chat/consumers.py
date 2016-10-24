import json

from channels import Group
from channels.generic.websockets import WebsocketConsumer

from api.models import Message
from django.contrib.auth.models import User
 
 
class WsMessage(WebsocketConsumer):

    '''
    Routing function. Checks for custom
    message 'types' defined in message JSON,
    and route control to appropriate private
    function. Some types send messages themselves,
    and this function handles those replies.
    '''
    def receive(self, text=None):
        data = json.loads(text)
        if (data['type'] == 'handshake'):
            self._handshake(data)

        elif (data['type'] == 'message'):
            replies = self._message(data) 
            Group(str(data['recipient'])).send({
                'text': json.dumps(replies[0])
            })
            self.send(json.dumps(replies[1]))

        elif (data['type'] == 'messages_read'):
            self._messages_read(data)

    '''
    'handshake' messages are sent by the frontend
    and contain the current user. This information is
    used to attach the current connection to a channel
    Group--named by the current users's pk--
    so any messages sent by other users to current
    user will be broadcast.
    ''' 
    def _handshake(self, data):
        Group(str(data['user'])).add(self.message.reply_channel)
    
    '''
    'message' messages are just that:
    they contain new chat messages that should
    1) saved to the database
    2) broadcast to the recipient user, who may
       receive the message if they are currently
       in the Group with their pk
    3) echoed back to the sender so it can populate
       their message queue 
    '''
    def _message(self, data):
        new_message = Message.objects.create(
            text=data['text'],
            date_sent=int(data['date_sent']),
            author=User.objects.get(pk=data['author']),
            recipient=User.objects.get(pk=data['recipient'])
        )
        new_message.save()
        
        broadcast = {
            'type': 'new_message',
            'author': data['author'],
            'text': data['text']
        }
        reply = {
            'type': 'message_echo',
            'recipient': data['recipient'],
            'text': data['text']
        }
        return (broadcast, reply)

    '''
    'messages_read' messages indicated that the current
    user has seen all unread messages sent to them by
    another user. This method changes the 'read' field
    of all relevent Messages in the database to 'True'. 
    '''
    def _messages_read(self, data):
        author = data['author']
        recipient = data['recipient']
        query = Message.objects.filter(author=author, recipient=recipient)
        for message in query:
            message.read = True
            message.save()
