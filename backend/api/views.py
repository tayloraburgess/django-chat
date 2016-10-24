import json

from django.core import serializers
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt 

from .models import Message
from django.contrib.auth.models import User
from django.db.models import Q

FORBIDDEN = 403
METHOD_NOT_ALLOWED = 405

'''
Responds with the primary key of
the currently logged in user.
'''
def current_user(request):
    if request.method == 'GET':
        if request.user.is_authenticated:
            data = {
                'pk': request.user.pk 
            }
            return HttpResponse(json.dumps(data), content_type='application/json')
        else:
            return HttpResponse(status=FORBIDDEN)
    else:
        return HttpResponse(status=METHOD_NOT_ALLOWED)

'''
Responds with a list of all users in the database.
Only includes the users' usernames and primary keys.
'''
def all(request):
    if request.method == 'GET':
        if request.user.is_authenticated:
            query = User.objects.all()
            data = serializers.serialize('json', query, fields=('username'))
            return HttpResponse(data, content_type='application/json')
        else:
            return HttpResponse(status=FORBIDDEN)
    else:
       return HttpResponse(status=METHOD_NOT_ALLOWED)
    
'''
Responds with a list of 'streams'--
messages the provided user has had
with all other users, split into lists.
Each stream contains a primary key for
the other user, a boolean indicating whether
the user has read the messages,
and a list of messages.
'''
def streams(request, user_id):
    if request.method == 'GET':
        if request.user.is_authenticated and request.user.pk == int(user_id):
            '''
            Find all Messages with the user as either the author or recipient,
            and add the other user attached to the Message to a set--'friends.' 
            '''
            friends = set()
            for m in Message.objects.filter(author=user_id).select_related('recipient'):
                friends.add(m.recipient)
            for m in Message.objects.filter(recipient=user_id).select_related('author'):
                friends.add(m.author)

            data = {'streams': []}
            for friend_id in friends:
                messages_from = Q(author=user_id, recipient=friend_id)
                messages_to = Q(author=friend_id, recipient=user_id)
                query_1 = Message.objects.filter(messages_to)
                '''
                To determine whether the user has 'read' the stream,
                first assume they they have, and then check all messages
                where the user is the recipient--if even one is unread,
                mark the whole stream as such for ease of computation on
                the frontend.
                '''
                messages_read = True;
                for v in query_1.values():
                    if v['read'] == False:
                        messages_read = False;
                        break
                '''
                To assemble the messages for the stream, query all messages
                that are attached to the user or the current friend. Don't worry
                about sorting by date sent, as this is done dynamically
                on the frontend.
                '''
                query_2 = Message.objects.filter(messages_from | messages_to)
                message_list = serializers.serialize('json', query_2)
                data['streams'].append({
                    'friend': friend_id.pk,
                    'messages': message_list,
                    'read': messages_read
                })
            return HttpResponse(json.dumps(data), content_type='application/json')
        else:
            return HttpResponse(status=FORBIDDEN)
    else:
        return HttpResponse(status=METHOD_NOT_ALLOWED)
