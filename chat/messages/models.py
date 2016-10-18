from django.db import models
from django.contrib.auth.models import User

class Message(models.Model):
    user_1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_1')
    user_2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_2')
    date_sent = models.IntegerField()
    text = models.TextField()
