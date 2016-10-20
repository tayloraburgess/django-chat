"""chat URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import include, url
from django.contrib import admin
from django.contrib.auth import views as auth_views
from . import views

login_data = {
    'template_name': 'login.html',
}

urlpatterns = [
    url(r'^$', views.main, name='main'),
    url(r'^admin/', admin.site.urls),
    url(r'^login/$', auth_views.login, login_data, name='login'),
    url(r'^logout/$', auth_views.logout_then_login, name='logout'),
    url(r'^new_user/$', views.new_user, name='new_user'),
    url(r'^api/v1/', include('api.urls')),
]
