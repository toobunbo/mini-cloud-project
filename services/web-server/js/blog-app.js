// ===== CONFIGURATION =====
const API_BASE = ''; // Thay đổi theo domain thực tế
const STORAGE_KEY = 'blog_auth_token';
const USERNAME_KEY = 'blog_username';

// ===== AUTH SERVICE =====
const AuthService = {
  // Lưu token vào localStorage
  saveToken(token, username) {
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
  },

  // Lấy token từ localStorage
  getToken() {
    return localStorage.getItem(STORAGE_KEY);
  },

  // Lấy username
  getUsername() {
    return localStorage.getItem(USERNAME_KEY);
  },

  // Kiểm tra đã đăng nhập chưa
  isLoggedIn() {
    return !!this.getToken();
  },

  // Logout - xóa token
  logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USERNAME_KEY);
    window.location.reload();
  },

  // Login API call
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Đăng nhập thất bại');
      }

      const data = await response.json();
      this.saveToken(data.token, data.username);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
};

// ===== API SERVICE =====
const ApiService = {
  // Headers với authentication
  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (includeAuth) {
      const token = AuthService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  },

  // Lấy danh sách bài viết
  async getPosts() {
    try {
      const response = await fetch(`${API_BASE}/api/posts`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Không thể tải bài viết');
      }

      return await response.json();
    } catch (error) {
      console.error('Get posts error:', error);
      throw error;
    }
  },

  // Upload ảnh
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AuthService.getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload ảnh thất bại');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload image error:', error);
      throw error;
    }
  },

  // Tạo bài viết mới
  async createPost(postData) {
    try {
      const response = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('Tạo bài viết thất bại');
      }

      return await response.json();
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  },

  // ⭐ MỚI: Lấy Load Balancer Status
  async getStatus() {
    try {
      const response = await fetch(`${API_BASE}/api/status`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Không thể lấy status');
      }

      return await response.json();
    } catch (error) {
      console.error('Get status error:', error);
      return null;
    }
  },
};

// ===== UI CONTROLLER =====
const UIController = {
  // Cập nhật UI dựa trên trạng thái login
  updateAuthUI() {
    const isLoggedIn = AuthService.isLoggedIn();
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const postForm = document.getElementById('postForm');
    const userWelcome = document.getElementById('userWelcome');

    if (loginBtn) {
      loginBtn.style.display = isLoggedIn ? 'none' : 'inline-block';
    }

    if (logoutBtn) {
      logoutBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
    }

    if (postForm) {
      postForm.style.display = isLoggedIn ? 'block' : 'none';
    }

    if (userWelcome && isLoggedIn) {
      const username = AuthService.getUsername();
      userWelcome.textContent = `Xin chào, ${username}!`;
      userWelcome.style.display = 'block';
    }
  },

  // Hiển thị modal login
  showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  // Ẩn modal login
  hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  // Render danh sách bài viết
  async renderPosts(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      // Hiển thị loading
      container.innerHTML = '<div class="loading">Đang tải bài viết...</div>';

      // Lấy dữ liệu từ API
      const posts = await ApiService.getPosts();

      if (!posts || posts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Chưa có bài viết nào.</p>';
        return;
      }

      // Render các bài viết
      container.innerHTML = posts
        .map(
          (post) => `
        <article class="post-card">
          <div class="post-image">
            <a href="/blog/post.html?id=${post.id || ''}">
              <img src="${post.image_url || '/images/default.jpg'}"
                   alt="${post.title || 'Blog post'}"
                   onerror="this.src='https://picsum.photos/800/600';">
            </a>
          </div>
          <div class="post-content">
            <div class="post-meta">
              <span><i class="far fa-calendar-alt"></i> ${this.formatDate(post.created_at)}</span>
              <span><i class="fas fa-user"></i> ${post.author_name || 'Admin'}</span>
            </div>
            <h3><a href="/blog/post.html?id=${post.id || ''}" style="text-decoration: none; color: inherit;">
              ${post.title || 'Không có tiêu đề'}
            </a></h3>
            <p>${this.truncateText(post.content || '', 150)}</p>
            <a href="/blog/post.html?id=${post.id || ''}" class="read-more">
              Đọc thêm <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </article>
      `
        )
        .join('');
    } catch (error) {
      console.error('Render posts error:', error);
      container.innerHTML = '<p style="text-align: center; color: #e74c3c;">Có lỗi khi tải bài viết. Vui lòng thử lại sau.</p>';
    }
  },

  // Format ngày tháng
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  },

  // Cắt ngắn văn bản
  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Hiển thị thông báo
  showNotification(message, type = 'success') {
    // Tạo element thông báo
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Tự động xóa sau 3 giây
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  // ⭐ MỚI: Tạo Load Balancer Badge
  createLoadBalancerBadge() {
    // Tạo badge element
    const badge = document.createElement('div');
    badge.id = 'lb-status-badge';
    badge.className = 'lb-status-badge';
    badge.innerHTML = `
      <span class="lb-badge-icon">🔄</span>
      <span class="lb-badge-text">Đang kết nối...</span>
    `;

    document.body.appendChild(badge);
    return badge;
  },

  // ⭐ MỚI: Cập nhật Load Balancer Status
  async updateLoadBalancerStatus() {
    let badge = document.getElementById('lb-status-badge');

    // Tạo badge nếu chưa có
    if (!badge) {
      badge = this.createLoadBalancerBadge();
    }

    try {
      // Gọi API status
      const status = await ApiService.getStatus();

      if (status && status.container_id) {
        // Cập nhật badge với thông tin server
        badge.innerHTML = `
          <span class="lb-badge-icon lb-pulse">🟢</span>
          <span class="lb-badge-text">
            <strong>Served by:</strong> ${status.container_id}
          </span>
        `;
        badge.classList.remove('lb-status-warning', 'lb-status-error');
        badge.classList.add('lb-status-active');

        console.log('✅ Load Balancer Status:', status.container_id);
      } else {
        // Nếu không lấy được status
        badge.innerHTML = `
          <span class="lb-badge-icon">⚠️</span>
          <span class="lb-badge-text">Status unknown</span>
        `;
        badge.classList.remove('lb-status-active', 'lb-status-error');
        badge.classList.add('lb-status-warning');
      }
    } catch (error) {
      console.error('Update LB status error:', error);
      badge.innerHTML = `
        <span class="lb-badge-icon">🔴</span>
        <span class="lb-badge-text">Connection failed</span>
      `;
      badge.classList.remove('lb-status-active', 'lb-status-warning');
      badge.classList.add('lb-status-error');
    }
  },
};

// ===== POST FORM HANDLER =====
const PostFormHandler = {
  async handleSubmit(e) {
    e.preventDefault();

    // Lấy các element
    const titleInput = document.getElementById('postTitle');
    const contentInput = document.getElementById('postContent');
    const imageInput = document.getElementById('postImage');
    const submitBtn = document.getElementById('submitPost');

    if (!titleInput || !contentInput || !imageInput) {
      alert('Không tìm thấy form elements');
      return;
    }

    // Validate
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const imageFile = imageInput.files[0];

    if (!title || !content) {
      UIController.showNotification('Vui lòng điền đầy đủ tiêu đề và nội dung', 'error');
      return;
    }

    if (!imageFile) {
      UIController.showNotification('Vui lòng chọn ảnh', 'error');
      return;
    }

    try {
      // Disable nút submit
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

      // Bước 1: Upload ảnh
      UIController.showNotification('Đang upload ảnh...', 'info');
      const imageUrl = await ApiService.uploadImage(imageFile);

      // Bước 2: Tạo bài viết
      UIController.showNotification('Đang tạo bài viết...', 'info');
      await ApiService.createPost({
        title,
        content,
        image_url: imageUrl,
      });

      // Bước 3: Thông báo thành công
      UIController.showNotification('Đăng bài thành công!', 'success');

      // Reset form
      titleInput.value = '';
      contentInput.value = '';
      imageInput.value = '';

      // Reload danh sách bài viết sau 1 giây
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Submit post error:', error);
      UIController.showNotification(error.message || 'Có lỗi xảy ra khi đăng bài', 'error');
    } finally {
      // Enable lại nút submit
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Đăng bài';
    }
  },
};

// ===== LOGIN FORM HANDLER =====
const LoginFormHandler = {
  async handleSubmit(e) {
    e.preventDefault();

    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const submitBtn = document.getElementById('loginSubmit');

    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      UIController.showNotification('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';

      await AuthService.login(username, password);

      UIController.showNotification('Đăng nhập thành công!', 'success');
      UIController.hideLoginModal();

      // Reload trang sau 1 giây
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      UIController.showNotification('Đăng nhập thất bại. Vui lòng kiểm tra lại.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng nhập';
    }
  },
};

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
  // Nút Login
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => UIController.showLoginModal());
  }

  // Nút Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn đăng xuất?')) {
        AuthService.logout();
      }
    });
  }

  // Form đăng bài
  const postFormEl = document.getElementById('postFormElement');
  if (postFormEl) {
    postFormEl.addEventListener('submit', PostFormHandler.handleSubmit);
  }

  // Form login
  const loginFormEl = document.getElementById('loginFormElement');
  if (loginFormEl) {
    loginFormEl.addEventListener('submit', LoginFormHandler.handleSubmit);
  }

  // Đóng modal khi click outside
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) {
        UIController.hideLoginModal();
      }
    });
  }

  // Nút đóng modal
  const closeModal = document.getElementById('closeLoginModal');
  if (closeModal) {
    closeModal.addEventListener('click', () => UIController.hideLoginModal());
  }
}

// ===== INITIALIZE APP =====
function initializeApp() {
  console.log('🚀 Initializing Blog App...');

  // Cập nhật UI auth
  UIController.updateAuthUI();

  // Khởi tạo event listeners
  initializeEventListeners();

  // ⭐ MỚI: Hiển thị và cập nhật Load Balancer Status
  UIController.updateLoadBalancerStatus();

  // Render posts nếu đang ở trang blog list
  const blogListContainer = document.getElementById('blogListContainer');
  if (blogListContainer) {
    UIController.renderPosts('blogListContainer');
  }

  // Render featured posts nếu đang ở trang home
  const featuredPostsContainer = document.getElementById('featuredPostsContainer');
  if (featuredPostsContainer) {
    UIController.renderPosts('featuredPostsContainer');
  }

  console.log('✅ Blog app initialized successfully!');
}

// ===== AUTO-INITIALIZE WHEN DOM READY =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// ===== CSS ANIMATIONS =====
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
