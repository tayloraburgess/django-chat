from django.core import serializers
from django.shortcuts import get_object_or_404
from django.http import HttpResponse

from .models import Message
from django.contrib.auth.models import User

def all(request):
    data = serializers.serialize('json', Message.objects.all())
    return HttpResponse(data)

def detail(request, message_id):
    message = get_object_or_404(Message, pk=message_id)
    data = serializers.serialize("json", [message])
    return HttpResponse(data)
