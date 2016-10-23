import json

from django.test import TestCase, Client

from .models import Message
from django.contrib.auth.models import User

USERS_URL = '/api/v1/users/'
CURRENT_URL = '/api/v1/users/current/'

def STREAMS_URL(user):
    return '/api/v1/users/' + str(user) + '/streams/'

class TestUtilities:
    def create_user_login(self):
        User.objects.create_user(username='user_1', password='test')
        self.c = Client()
        self.c.login(username='user_1', password='test')
    def create_second_user(self):
        User.objects.create_user(username='user_2', password='test')

class AllEndpointsTestCase(TestUtilities, TestCase):
    def setUp(self):
       self.create_user_login()

    def test_status_code_users(self):
        res = self.c.get(USERS_URL)
        self.assertEqual(res.status_code, 200)

    def test_status_code_current(self):
        res = self.c.get(CURRENT_URL)
        self.assertEqual(res.status_code, 200)

    def test_status_code_streams(self):
        res = self.c.get(STREAMS_URL(1))
        self.assertEqual(res.status_code, 200)

class CurrentEndpointTestCase(TestUtilities, TestCase):
    def setUp(self):
        self.create_user_login()
    
    def test_response_data(self):
        res = self.c.get(CURRENT_URL)
        self.assertEqual(res.json()['pk'], 1)

class UsersEndpointTestCase(TestUtilities, TestCase):
    def setUp(self):
        self.create_user_login()
        self.create_second_user()

    def test_response_data(self):
        res = self.c.get(USERS_URL)
        data = res.json()
        user_1 = data[0]
        self.assertEqual(user_1['pk'], 1)
        self.assertEqual(user_1['fields']['username'], 'user_1')
        user_2 = data[1]
        self.assertEqual(user_2['pk'], 2)
        self.assertEqual(user_2['fields']['username'], 'user_2')

class StreamsEndpointTestCase(TestUtilities, TestCase):
    def setUp(self):
        self.create_user_login()
        self.create_second_user()
        Message.objects.create(
           text='test 1',
           author=User.objects.get(pk=1),
           recipient=User.objects.get(pk=2),
           date_sent=1
        ) 
        Message.objects.create(
           text='test 2',
           author=User.objects.get(pk=2),
           recipient=User.objects.get(pk=1),
           date_sent=2
        )
    
    def test_response_data(self):
        res = self.c.get(STREAMS_URL(1))
        stream = res.json()['streams'][0]
        self.assertEqual(stream['friend'], 2)
        self.assertEqual(stream['read'], False)
        messages = json.loads(stream['messages'])
        message_1 = messages[0]['fields']
        self.assertEqual(message_1['text'], 'test 1')
        self.assertEqual(message_1['author'], 1)
        self.assertEqual(message_1['recipient'], 2)
        message_2 = messages[1]['fields']
        self.assertEqual(message_2['text'], 'test 2')
        self.assertEqual(message_2['author'], 2)
        self.assertEqual(message_2['recipient'], 1)
