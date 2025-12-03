-- 1. Xóa bảng cũ (để làm sạch)
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

-- 2. Tạo bảng Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tạo bảng Posts
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    image_url VARCHAR(500),
    author_id INTEGER REFERENCES users(id), -- Liên kết khóa ngoại
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Dữ liệu mẫu (Seed Data)
-- User admin (Pass: 123456)
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@local', '$2b$12$7H.x.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.A.B.C.D.E.F.G', 'admin');

-- Bài viết mẫu (Liên kết với user id=1 là admin)
INSERT INTO posts (title, content, image_url, author_id) VALUES
('Chào mừng đến MiniCloud', 'Đây là bài viết mẫu đầu tiên được tạo tự động từ Database.', 'https://via.placeholder.com/800x400', 1),
('Review Đà Lạt 2025', 'Đà Lạt mùa này lạnh lắm nhưng cảnh rất đẹp...', 'https://via.placeholder.com/800x400', 1);
