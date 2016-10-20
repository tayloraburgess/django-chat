from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.all, name='all'),        
    url(r'^get/$', views.get_info, name='get_info'),
    url(r'^(?P<user_id>[0-9]+)/$', views.detail, name='detail'),
    url(r'^(?P<user_id>[0-9]+)/streams/$', views.streams, name='streams'),
    url(r'^(?P<user_id>[0-9]+)/friends/$', views.friends, name='friends')
]
