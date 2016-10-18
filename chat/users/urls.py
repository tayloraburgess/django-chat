from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.all, name='all'),        
    url(r'^(?P<user_id>[0-9]+)$', views.detail, name='detail')
]
