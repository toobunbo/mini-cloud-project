# 1. Kế thừa từ bản Non-root chuẩn
FROM nginxinc/nginx-unprivileged:alpine

# 2. Chuyển sang quyền ROOT tạm thời để được phép cài phần mềm
USER root

# 3. Cài đặt bind-tools (chứa lệnh dig) và curl (để test api)
# --no-cache giúp không lưu rác cài đặt, giữ image nhẹ
# RUN apk add --no-cache bind-tools curl

# 4. Trả lại quyền cho user thường (nginx - UID 101)
# Để đảm bảo container chạy an toàn như cũ
USER nginx
