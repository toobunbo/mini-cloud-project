FROM nginx:alpine

# Xóa trang html mặc định của Nginx ("Welcome to Nginx")
RUN rm -rf /usr/share/nginx/html/*

# Copy toàn bộ code (Dashboard, Blog, Images, CSS) của bạn vào
COPY . /usr/share/nginx/html
