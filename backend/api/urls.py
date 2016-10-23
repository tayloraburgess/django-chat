from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^users/$', views.all, name='all'),        
    url(r'^users/current/$', views.current_user, name='current_user'),
    url(r'^users/(?P<user_id>[0-9]+)/streams/$', views.streams, name='streams'),
]
