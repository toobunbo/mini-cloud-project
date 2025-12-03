# Mini Cloud – Microservices & DevSecOps on AWS EC2 + Docker Compose

Mini Cloud là mô hình mô phỏng hạ tầng **microservices** theo tư duy **Cloud Native** trên **AWS EC2 (Ubuntu)**, được điều phối bằng **Docker Compose**, có **phân đoạn mạng 3-zone (DMZ / App / Data)**, chuẩn hóa **Golden Image** cho Python services và tích hợp **CI/CD DevSecOps** (security gates + auto deploy lên EC2).

---

## 1) Kiến trúc tổng quan

### 1.1 4 tầng chức năng (4-layer)
- **Gateway**: Reverse Proxy (Nginx)
- **Application**: Web Server (SPA), API Server (Flask), Auth Server (Flask)
- **Data & Infrastructure**: PostgreSQL, MinIO, CoreDNS (optional)
- **Observability**: Prometheus, Grafana, cAdvisor

### 1.2 3-zone network segmentation (Defense in Depth)
- **public-net (DMZ)**: chỉ Reverse Proxy (public ingress)
- **app-net (internal)**: Web/API/Auth/MinIO/Monitoring (không public ingress trực tiếp)
- **data-net (secure)**: PostgreSQL (chỉ backend join network mới truy cập được)

---

## 2) Tech Stack
- **AWS**: EC2 (Ubuntu)
- **Containerization**: Docker, Docker Compose
- **Gateway**: Nginx (Reverse Proxy, routing theo URL prefix, rewrite)
- **Backend**: Python Flask (API/Auth), JWT
- **Database**: PostgreSQL
- **Object Storage**: MinIO (S3-compatible)
- **Observability**: Prometheus + Grafana + cAdvisor
- **CI/CD**: GitHub Actions
  - Security gates: **Bandit**, **Hadolint**, **git-secrets**
  - CD: Deploy lên EC2 qua **SSH** và restart bằng `docker compose`

---

## 3) Repo Structure

Demo bổ sung
