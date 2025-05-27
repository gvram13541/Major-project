from flask import Flask
from flask_socketio import SocketIO
import psutil
import time

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

def get_system_data():
    cpu_percent = psutil.cpu_percent()
    memory_percent = psutil.virtual_memory().percent
    return {'cpu': cpu_percent, 'memory': memory_percent}

def send_system_data():
    while True:
        data = get_system_data()
        socketio.emit('system_data', data)
        time.sleep(1)

if __name__ == '__main__':
    socketio.start_background_task(send_system_data)
    socketio.run(app, debug=True, port = 5000)