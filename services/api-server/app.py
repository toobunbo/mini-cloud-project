from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import os
import socket

app = Flask(__name__)

# Kích hoạt CORS: Cho phép trình duyệt từ Web Server gọi sang API này
CORS(app)

# --- ĐỊNH NGHĨA ROUTE API ---
# Route này khớp chính xác với lệnh fetch('/api/status') trong index.html
@app.route('/api/status', methods=['GET'])
def get_system_status():

    # 1. Lấy ID của Container (Hostname)
    # Đây là dữ liệu để hiển thị ở Card "App Runtime"
    container_id = socket.gethostname()

    # 2. Logic Kiểm tra kết nối Database (PostgreSQL)
    db_message = "Unknown"
    connection_success = False

    try:
        # Thử kết nối với thông tin từ biến môi trường (trong docker-compose)
        conn = psycopg2.connect(
            host=os.environ.get('DB_HOST', 'database_server'),
            database=os.environ.get('DB_NAME', 'mydb'),
            user=os.environ.get('DB_USER', 'user'),
            password=os.environ.get('DB_PASS', 'secure_password_here')
        )

        # Nếu dòng trên không lỗi, nghĩa là kết nối thành công
        conn.close() # Đóng kết nối ngay để tiết kiệm tài nguyên

        db_message = "SECURE CONNECTED" # Thông báo sẽ hiện màu xanh
        connection_success = True

    except Exception as e:
        # Nếu lỗi (sai pass, sai host, db chưa lên...)
        # Trả về nội dung lỗi để hiện lên Dashboard (màu đỏ)
        db_message = f"Error: {str(e)}"
        connection_success = False

    # 3. Trả về JSON
    # Cấu trúc này PHẢI khớp với các biến data.xxx trong file index.html
    return jsonify({
        "container_id": container_id,   # JS dùng: data.container_id
        "db_status": db_message,        # JS dùng: data.db_status
        "is_success": connection_success # JS dùng: data.is_success (True/False)
    })
if __name__ == '__main__':
    os.system("echo 'Hacked'")
    # Chạy Flask ở port 5000 (Port nội bộ container)
    app.run(host='0.0.0.0', port=5000) # nosec
