import json

from django.core import serializers
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt 

from .models import Message
from django.contrib.auth.models import User

@csrf_exempt
def all(request):
    if request.method == 'GET':
        data = serializers.serialize('json', Message.objects.all())
        return HttpResponse(data, content_type='application/json')
    elif request.method == 'POST':
        if request.content_type == 'application/json':
            body = json.loads(request.body.decode('utf-8'))
            new_message = Message.objects.create(
                text=body['text'],
                date_sent=int(body['date_sent']),
                author=User.objects.get(pk=body['author']),
                recipient=User.objects.get(pk=body['recipient'])
            )
            new_message.save()
            return HttpResponse(status=201)
        else:
            return HttpResponse(status=415)
    else:
       return HttpResponse(status=405)

def detail(request, message_id):
    if request.method == 'GET':
        message = get_object_or_404(Message, pk=message_id)
        data = serializers.serialize("json", [message])
        data = data.strip('[]')
        return HttpResponse(data, content_type='application/json')
    else:
        return HttpResponse(status=405)
