# 1. Kế thừa từ Golden Image (Đã có user, OS sạch)
FROM my-mini-cloud/python-golden:v1

# 2. Thiết lập thư mục làm việc (Đã được tạo ở Golden Image)
WORKDIR /app

# 3. Copy file thư viện trước (Để tận dụng Cache của Docker)
COPY requirements.txt .

# 4. Cài đặt thư viện
# Lưu ý: Vì ta đang ở user 'appuser', nên cần thêm --user để cài vào thư mục home
# và thêm vào PATH (đã làm ở Golden Image hoặc set ngay đây)
RUN pip install --user --no-cache-dir -r requirements.txt

# Đảm bảo biến môi trường PATH nhận diện được thư viện vừa cài
ENV PATH="/home/appuser/.local/bin:${PATH}"

# 5. Copy toàn bộ code nguồn vào
COPY . .

# 6. Mở cổng (Document only)
EXPOSE 5000

# 7. Chạy ứng dụng
CMD ["python", "app.py"]
