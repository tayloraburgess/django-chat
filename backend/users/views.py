import json

from django.core import serializers
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt 

from messages.models import Message
from django.contrib.auth.models import User
from django.db.models import Q

def all(request):
    if request.method == 'GET':
        query = User.objects.all()
        data = serializers.serialize('json', query, fields=('username'))
        return HttpResponse(data, content_type='application/json')
    else:
       return HttpResponse(status=405)

def detail(request, user_id):
    if request.method == 'GET':
        user = get_object_or_404(User, pk=user_id)
        data = serializers.serialize("json", [user], fields=('username'))
        data = data.strip('[]')
        return HttpResponse(data, content_type='application/json')
    else:
        return HttpResponse(status=405)
    
def streams(request, user_id):
    if request.method == 'GET':
        friends = set()
        for m in Message.objects.filter(author=user_id).select_related('recipient'):
            friends.add(m.recipient)
        for m in Message.objects.filter(recipient=user_id).select_related('author'):
            friends.add(m.author)

        data = {'streams': []}
        for friend_id in friends:
            messages_from = Q(author=user_id, recipient=friend_id)
            messages_to = Q(author=friend_id, recipient=user_id)
            query = Message.objects.filter(messages_from | messages_to)
            message_list = serializers.serialize('json', query)
            data['streams'].append({'friend': friend_id.pk, 'messages': message_list})
        return HttpResponse(json.dumps(data), content_type='application/json')
    else:
        return HttpResponse(status=405)

def friends(request, user_id):
    if request.method == 'GET':
        users = set()
        for m in Message.objects.filter(author=user_id).select_related('recipient'):
            users.add(m.recipient)
        for m in Message.objects.filter(recipient=user_id).select_related('author'):
            users.add(m.author)
        data = serializers.serialize('json', users, fields=('username'))
        return HttpResponse(data, content_type='application/json')
    else:
        return HttpResponse(status=405)
