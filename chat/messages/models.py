from django.db import models
from django.contrib.auth.models import User

class Message(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='author') 
    recipient  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recipient')
    date_sent = models.IntegerField()
    text = models.TextField()
