import json

from channels import Group
from channels.generic.websockets import WebsocketConsumer

from api.models import Message
from django.contrib.auth.models import User
 
class WsMessage(WebsocketConsumer):

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

    def _handshake(self, data):
        Group(str(data['user'])).add(self.message.reply_channel)
        
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

    def _messages_read(self, data):
        author = data['author']
        recipient = data['recipient']
        query = Message.objects.filter(author=author, recipient=recipient)
        for message in query:
            message.read = True
            message.save()

