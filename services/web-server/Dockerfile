# 1. Dùng image không quyền root
FROM nginxinc/nginx-unprivileged:alpine

# 2. Chuyển sang ROOT tạm thời để có quyền xóa file
USER root

# 3. Xóa file mặc định và copy code mới
RUN rm -rf /usr/share/nginx/html/*
COPY . /usr/share/nginx/html

# 4. Trả lại quyền sở hữu file cho user 'nginx' (QUAN TRỌNG)
# Nếu không làm bước này, Nginx sẽ không đọc được file bạn vừa copy
RUN chown -R nginx:nginx /usr/share/nginx/html

# 5. Chuyển lại về user thường để chạy an toàn
USER nginx
