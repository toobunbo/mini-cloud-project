FROM my-mini-cloud/python-golden:v1

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file requirements trước để tận dụng Docker Cache
COPY requirements.txt .

# Cài đặt thư viện vào thư mục user
RUN pip install --user --no-cache-dir -r requirements.txt

# Cập nhật đường dẫn để hệ thống tìm thấy thư viện vừa cài
ENV PATH="/home/appuser/.local/bin:${PATH}"

# --- SỬA NHẸ Ở ĐÂY ---
# Copy code và chuyển luôn quyền sở hữu cho appuser:appgroup
# (Tên user/group này ta đã tạo trong Golden Image)
COPY --chown=appuser:appgroup . .

EXPOSE 5000
CMD ["python", "app.py"]
