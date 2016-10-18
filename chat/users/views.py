from django.core import serializers
from django.shortcuts import get_object_or_404
from django.http import HttpResponse

from django.contrib.auth.models import User

def all(request):
    data = serializers.serialize('json', User.objects.all())
    return HttpResponse(data)

def detail(request, user_id):
    user = get_object_or_404(User, pk=user_id)
    data = serializers.serialize("json", [user])
    return HttpResponse(data)
