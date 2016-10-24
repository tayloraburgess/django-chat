from channels.routing import route_class
from .consumers import WsMessage
channel_routing = [
    route_class(WsMessage),
]
