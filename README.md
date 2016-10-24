# chat

A minimal person-to-person chat center, built with Django & React.

## Architecture

### General

This app tries to minimize communication between the frontend and the backend, while still maintaining close to real-time updating--i.e. users should see messages sent to them by other users as quickly as possible. 

To do this, the server communicates with the client in two ways--a REST API and a persistent WebSocket connection. The REST API is used when the client first establishes a connection to quickly send the (potentially large) load of initial data--i.e. the complete list of users, the current user's previous messages, etc--that the frontend can store in state.

After this initial transfer, the server & client establish a WebSocket connection (faciliated with [Django Channels](https://github.com/django/channels)) so the server can push updates--primarily new messages sent to the user.

With this architecture, the largest data chunks are sent using the API--a task it is well-suited for--and the subsequent smaller chunks are sent via WebSockets. 

The frontend uses React.js primarily because its state management and component updating is a good for a close to real-time chat client--i.e. adding a new message to the interface is as simple as updating the state to include it, and letting React take care of rendering the changes. 

### Frontend

An SPA built with [`create-react-app`](https://github.com/facebookincubator/create-react-app).
 
### Backend

The Django architecture is split across two apps:

#### chat

This app has a few functions:

- Serves static templates at specific routes, like `/login` and `/new_user`
- Serves the React build at the root route
- Manages all WebSocket connections

#### api

This app is a REST API that the React frontend requests data from.

## Environment Setup
(Assuming a Linux/Unix environment)

### In the `backend` directory:

1. If you haven't previously, install Python 3. All Python-related actions assume Python 3.

2. Create a virtual environment with `virtualenv venv` (if you haven't previously, install with `pip install virtualenv`)

3. Activate the environment with `. venv/bin/activate`

4. Install dependencies with `pip install -r requirements.txt`

5. Set environment variables in a `.env` file
   
   1. `DATABASE_NAME` should be a SQLite filename that you’d like Django to use, e.g. `export DATABASE_FILE='db.sqlite3'` 

   2. `DJANGO_SECRET_KEY` should be a long, unique, random string 

6. Source the `.env` file with `. .env`

7. Initialize the SQLite database with `python manage.py migrate`

8. If you haven't previously, install SQLite and Redis--e.g. `brew install sqlite` & `brew install redis`

### In the `frontend` directory:
(Note: only necessary for development. A complete React build is already packaged and included in the 'backend' directory. If you only want to run/test the app locally, skip these steps.) 

1. If you haven't previously, install [node.js](https://nodejs.org)

2. Install dependencies with `npm install`

## Running locally

1. Start redis (this app assumes the default port, 6379)

2. Change to the `backend` directory, and ensure the virtual environment is activated and `.env` sourced 

### To just start quickly:

3. `python manage.py runserver` 

4. Navigate to `localhost:8000`

### To simulate a production environment, with an interface server and multiple workers:

3. `daphne chat.asgi:channel_layer`

4. Start as many workers as you like with `python manage.py runworker`, depending on your preference &  environment's threading capabilites (but probaby minimum 2) 

5. Navigate to `localhost:8000`

### Using the app

This app is designed to be deployed & served to remote clients, and tracks those clients (i.e. logged-in users) across browser sessions. So, to test the app's messaging capabilites locally, you'll need to create multiple users and log those users into different browser sessions (you could do this using Chrome's incognito mode or something similar, or separate browsers). To create the users, you can either:

- Navigate directly to `localhost:8000` and selecting 'Create Account'

- Navigate directly to `localhost:8000/new_user`
