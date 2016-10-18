import json

from django.core import serializers
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt 

from messages.models import Message
from django.contrib.auth.models import User
from django.db.models import Q

@csrf_exempt
def all(request):
    if request.method == 'GET':
        data = serializers.serialize('json', User.objects.all())
        return HttpResponse(data, content_type='application/json')
    else:
       return HttpResponse(status=405)

def detail(request, user_id):
    if request.method == 'GET':
        user = get_object_or_404(User, pk=user_id)
        data = serializers.serialize("json", [user])
        return HttpResponse(data, content_type='application/json')
    else:
        return HttpResponse(status=405)
    
def stream(request, user_id, chat_user_id):
    if request.method == 'GET':
        messages_from = Q(author=user_id, recipient=chat_user_id)
        messages_to = Q(author=chat_user_id, recipient=user_id)
        query = Message.objects.filter(messages_from | messages_to)
        data = serializers.serialize('json', query)
        return HttpResponse(data, content_type='application/json')
    else:
        return HttpResponse(status=405)

def friends(request, user_id):
    if request.method == 'GET':
        users = set()
        for m in Message.objects.filter(author=user_id).select_related('recipient'):
            users.add(m.recipient)
        for m in Message.objects.filter(recipient=user_id).select_related('author'):
            users.add(m.author)
        data = serializers.serialize('json', users)
        return HttpResponse(data, content_type='application/json')
    else:
        return HttpResponse(status=405)
