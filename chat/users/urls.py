from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.all, name='all'),        
    url(r'^(?P<user_id>[0-9]+)/$', views.detail, name='detail'),
    url(r'^(?P<user_id>[0-9]+)/stream/(?P<chat_user_id>[0-9]+)/$', views.stream, name='stream'),
    url(r'^(?P<user_id>[0-9]+)/friends/$', views.friends, name='friends')
]
