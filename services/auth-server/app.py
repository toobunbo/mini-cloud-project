from flask import Flask, request, jsonify
from flask_cors import CORS  # <--- Đã thêm
import psycopg2
import jwt
import bcrypt
import datetime
import os

app = Flask(__name__)
CORS(app)  # <--- Đã thêm

# --- SECRETS MANAGEMENT ---
DB_HOST = os.environ.get('DB_HOST')
DB_NAME = os.environ.get('DB_NAME')
DB_USER = os.environ.get('DB_USER')
DB_PASS = os.environ.get('DB_PASS')
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-unsafe-key-for-dev')

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')      # <--- Đã có email
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'Missing fields'}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Check trùng lặp
        cur.execute('SELECT id FROM users WHERE username = %s OR email = %s', (username, email))
        if cur.fetchone():
            return jsonify({'message': 'Username or Email already exists'}), 409

        # Hash Password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insert
        cur.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)',
            (username, email, hashed_password)
        )
        conn.commit()
        return jsonify({'message': 'User created successfully'}), 201

    except Exception as e:
        conn.rollback()
        print(f"Error: {e}") # In lỗi ra log để dễ debug
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute('SELECT id, username, password_hash, role FROM users WHERE username = %s', (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if user:
        user_id, db_user, db_hash, role = user
        # Check Hash
        if bcrypt.checkpw(password.encode('utf-8'), db_hash.encode('utf-8')):
            # Tạo Token
            token = jwt.encode({
                'user_id': user_id,
                'role': role,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            }, SECRET_KEY, algorithm="HS256")

            return jsonify({'token': token, 'message': 'Login successful'})
    
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/verify', methods=['POST'])
def verify_token():
    token = request.json.get('token')
    if not token:
         return jsonify({'valid': False, 'error': 'Token missing'}), 401
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return jsonify({'valid': True, 'user': decoded})
    except jwt.ExpiredSignatureError:
        return jsonify({'valid': False, 'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'valid': False, 'error': 'Invalid token'}), 401

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)