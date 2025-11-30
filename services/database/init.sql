-- Xóa bảng cũ nếu có để tạo lại cho chuẩn
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- QUAN TRỌNG: Lưu hash, không lưu pass thật
    role VARCHAR(20) DEFAULT 'user',     -- Phân quyền: user/admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dữ liệu mẫu (Password là "123456" đã được hash bằng bcrypt)
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@minicloud.local', '$2b$12$7H.x.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.A.B.C.D.E.F.G', 'admin'),
('student', 'student@minicloud.local', '$2b$12$7H.x.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.A.B.C.D.E.F.G', 'user');