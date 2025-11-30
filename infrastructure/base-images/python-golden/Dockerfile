# 1. Chọn hệ điều hành
FROM python:3.9-slim

# 2. Metadata
LABEL maintainer="student-devsecops"
LABEL version="1.0-golden"

# 3. Env
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 4. Cài đặt thư viện hệ thống
RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
       curl \
    && rm -rf /var/lib/apt/lists/*

# 5. SECURITY: Tạo User non-root VÀ THIẾT LẬP HOME DIR
# Thay đổi quan trọng ở đây:
# - Tạo group và user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# - Tạo thư mục home rõ ràng và cấp quyền sở hữu cho appuser
# - Đây là nơi 'pip install --user' sẽ ghi dữ liệu vào (.local)
RUN mkdir -p /home/appuser && chown -R appuser:appgroup /home/appuser

# 6. Tạo thư mục làm việc /app và cấp quyền
WORKDIR /app
RUN chown appuser:appgroup /app

# 7. Chuyển sang user thường
USER appuser
