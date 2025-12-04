from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
import os
import jwt
from functools import wraps
import json
import socket

app = Flask(__name__)
# Enable CORS cho tất cả các domain và cho phép credentials
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/api/info', methods=['GET'])
def get_info():
    # Trả về ID của container đang xử lý
    return jsonify({
        'message': 'Hello form API Server',
        'server_id': socket.gethostname()
    })
# --- CONFIGURATION ---
SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
DB_HOST = os.environ.get('DB_HOST')
DB_NAME = os.environ.get('DB_NAME')
DB_USER = os.environ.get('DB_USER')
DB_PASS = os.environ.get('DB_PASS')

# MinIO Config
MINIO_ENDPOINT = os.environ.get('MINIO_ENDPOINT', 'http://storage-server:9000')
MINIO_ACCESS = os.environ.get('MINIO_ACCESS_KEY', 'admin')
MINIO_SECRET = os.environ.get('MINIO_SECRET_KEY', 'minio_secret_password')

# Fix endpoint URL cho boto3
S3_ENDPOINT_URL = MINIO_ENDPOINT
if not S3_ENDPOINT_URL.startswith('http'):
    S3_ENDPOINT_URL = f'http://{S3_ENDPOINT_URL}'

# MinIO Client
try:
    s3 = boto3.client('s3',
                        endpoint_url=S3_ENDPOINT_URL,
                        aws_access_key_id=MINIO_ACCESS,
                        aws_secret_access_key=MINIO_SECRET,
                        config=Config(signature_version='s3v4'),
                        region_name='us-east-1')
except Exception as e:
    print(f"MinIO Init Error: {e}")
    s3 = None

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)

# Middleware check Token (Dùng cho chức năng đăng bài)
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Lấy token từ header Authorization: Bearer <token>
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token: return jsonify({'message': 'Missing token'}), 401

        try:
            # Giải mã token
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user_id = data['user_id']
        except: return jsonify({'message': 'Invalid token'}), 401

        return f(current_user_id, *args, **kwargs)
    return decorated

# --- API ENDPOINTS CHO BLOG ---

# 1. Lấy danh sách bài viết (Public)
@app.route('/api/posts', methods=['GET'])
def get_posts():
    conn = None
    try:
        print("Connecting to DB to fetch posts...") # Log debug
        conn = get_db_connection()
        cur = conn.cursor()
        # Join bảng posts và users để lấy tên tác giả
        # Sử dụng LEFT JOIN để không bị mất bài nếu user bị xóa (tùy logic)
        cur.execute('''
            SELECT p.id, p.title, p.content, p.image_url, u.username, p.created_at
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.created_at DESC
        ''')
        rows = cur.fetchall()

        posts = []
        for r in rows:
            posts.append({
                'id': r[0],
                'title': r[1],
                'content': r[2],
                'image_url': r[3],
                'author_name': r[4] if r[4] else 'Unknown',
                'created_at': str(r[5])
            })

        print(f"Fetched {len(posts)} posts") # Log debug
        cur.close()
        return jsonify(posts)
    except psycopg2.Error as e:
        print(f"Database Error: {e}")
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        print(f"Error getting posts: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

# 2. Upload ảnh lên MinIO (Yêu cầu Login)
@app.route('/api/upload', methods=['POST'])
@token_required
def upload_file(current_user_id):
    if not s3: return jsonify({'error': 'Storage service unavailable'}), 503

    if 'file' not in request.files: return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({'error': 'No file selected'}), 400

    filename = f"user_{current_user_id}_{file.filename}"
    bucket_name = 'travel-avatars'

    try:
        try: s3.create_bucket(Bucket=bucket_name)
        except: pass

        s3.upload_fileobj(file, bucket_name, filename, ExtraArgs={'ContentType': file.content_type})

        # --- ĐOẠN SỬA QUAN TRỌNG NHẤT ---
        # Lấy Host từ Header mà trình duyệt gửi lên (VD: 13.211.149.243:4444)
        # Nginx đã forward header này vào rồi.
        host_header = request.headers.get('Host')

        # Nếu chạy sau proxy, lấy scheme (http/https) từ header
        scheme = request.headers.get('X-Forwarded-Proto', 'http')

        # Tạo URL động dựa theo địa chỉ người dùng đang truy cập
        url = f"{scheme}://{host_header}/storage/{bucket_name}/{filename}"
        # --------------------------------

        return jsonify({'url': url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 3. Tạo bài viết mới (Yêu cầu Login)
@app.route('/api/posts', methods=['POST'])
@token_required
def create_post(current_user_id):
    try:
        data = request.get_json()
        print(f"DEBUG: Received data: {data}") # <--- IN RA ĐỂ DEBUG

        # Dùng .get() để tránh KeyError crash
        title = data.get('title')
        content = data.get('content')
        image_url = data.get('image_url')

        if not title:
            return jsonify({'message': 'Title is required'}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # In ra câu SQL để check
        print(f"DEBUG: Inserting Post for User ID: {current_user_id}")

        cur.execute(
            'INSERT INTO posts (title, content, image_url, author_id) VALUES (%s, %s, %s, %s)',
            (title, content, image_url, current_user_id)
        )
        conn.commit()
        return jsonify({'message': 'Post created successfully'}), 201

    except Exception as e:
        # Quan trọng: In lỗi chi tiết ra console của Docker
        print(f"CRITICAL ERROR in create_post: {e}")
        if 'conn' in locals(): conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

# --- API ENDPOINTS CŨ (GIỮ NGUYÊN ĐỂ CHECK SYSTEM) ---
@app.route('/api/status', methods=['GET'])
def get_system_status():
    # ... (Giữ code check status cũ)
    container_id = socket.gethostname()
    db_message = "Unknown"
    connection_success = False
    conn = None
    try:
        conn = get_db_connection()
        db_message = "SECURE CONNECTED"
        connection_success = True
    except Exception as e:
        db_message = f"Error: {str(e)}"
    finally:
        if conn: conn.close()

    return jsonify({
        "container_id": container_id,
        "db_status": db_message,
        "is_success": connection_success
    })

# API Check Storage
@app.route('/api/storage/status', methods=['GET'])
def check_storage():
    status = "DISCONNECTED"
    bucket_count = 0
    if s3:
        try:
            response = s3.list_buckets()
            bucket_count = len(response['Buckets'])
            status = "CONNECTED"
        except Exception as e:
            status = f"ERROR: {str(e)}"
    else:
        status = "Boto3 Client Init Failed"

    return jsonify({
        "service": "MinIO Object Storage",
        "endpoint": S3_ENDPOINT_URL,
        "status": status,
        "buckets_count": bucket_count
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) # nosec
