document.addEventListener('DOMContentLoaded', () => {
  // 1. Navigation Active State Link Highlights
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath.substring(currentPath.lastIndexOf('/') + 1)) {
      link.classList.add('active');
    }
  });

  // 2. Feedback Form Interaction (Only runs on support.html)
  const feedbackForm = document.getElementById('feedbackForm');
  if (feedbackForm) {
    const fileInput = document.getElementById('screenshotInput');
    const dropzone = document.getElementById('dropzone');
    const previewContainer = document.getElementById('previewContainer');
    const submitBtn = document.getElementById('submitBtn');
    
    // Store uploaded files locally for mock preview
    let attachedFiles = [];

    // Drag and drop events
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleFiles(files);
    });

    dropzone.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });

    function handleFiles(files) {
      const newFiles = [...files].filter(file => file.type.startsWith('image/'));
      
      // Limit to 3 images max
      if (attachedFiles.length + newFiles.length > 3) {
        showToast('🔒 最多只能上传 3 张截图进行反馈哦');
        return;
      }

      newFiles.forEach(file => {
        attachedFiles.push(file);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          const previewItem = document.createElement('div');
          previewItem.className = 'preview-item';
          
          const img = document.createElement('img');
          img.src = reader.result;
          
          const removeBtn = document.createElement('div');
          removeBtn.className = 'preview-item-remove';
          removeBtn.innerHTML = '✕';
          removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            attachedFiles = attachedFiles.filter(f => f !== file);
            previewItem.remove();
          });

          previewItem.appendChild(img);
          previewItem.appendChild(removeBtn);
          previewContainer.appendChild(previewItem);
        };
      });
    }

    // Submit handler
    feedbackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const type = document.getElementById('feedbackType').value;
      const description = document.getElementById('description').value.trim();
      const appVersion = document.getElementById('appVersion').value;
      const systemVersion = document.getElementById('systemVersion').value;

      if (!email || !description) {
        showToast('⚠️ 请填写您的联系邮箱与详细的问题描述');
        return;
      }

      // Show loading spinner / state
      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span style="opacity: 0.7">正在提交反馈...</span>';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        // Show success modal with mailto fallback
        showSuccessModal(email, type, description, appVersion, systemVersion);
      }, 1200);
    });
  }

  // 3. Success Modal & Mailto Prefill Generator
  function showSuccessModal(email, type, description, appVersion, systemVersion) {
    // Dynamically insert modal if not exists
    let modal = document.getElementById('successModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'successModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const recipient = 'yebaihan@qq.com';
    const typeLabel = {
      'bug': 'Bug 反馈',
      'feature': '功能改进建议',
      'other': '其它合作或问题'
    }[type] || '意见反馈';

    const subject = encodeURIComponent(`[截屏即待办反馈] - ${typeLabel}`);
    const bodyContent = `反馈类型: ${typeLabel}
联系邮箱: ${email}
App版本: ${appVersion}
iOS系统版本: ${systemVersion}

详细描述:
${description}

---
提示：如有截图附件，请在邮件中添加该截图。`;
    const body = encodeURIComponent(bodyContent);
    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-icon">✓</div>
        <h3>反馈表单已生成！</h3>
        <p>感谢您的反馈！为了确保您的反馈 100% 能够送达开发者进行处理，建议您点击下方按钮，直接通过邮件客户端发送该反馈信息。</p>
        
        <div class="modal-actions">
          <a href="${mailtoUrl}" class="btn btn-primary" id="sendEmailBtn">
             ✉️ 唤起邮件客户端发送
          </a>
          <button class="btn btn-secondary" id="copyDetailsBtn">
            📋 复制反馈文本到剪贴板
          </button>
          <button class="btn btn-secondary" style="border: none; margin-top: 0.5rem;" id="closeModalBtn">
            返回网页
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');

    // Close handler
    document.getElementById('closeModalBtn').addEventListener('click', () => {
      modal.classList.remove('active');
      feedbackForm.reset();
      const previewContainer = document.getElementById('previewContainer');
      if (previewContainer) previewContainer.innerHTML = '';
    });

    // Copy to clipboard handler
    document.getElementById('copyDetailsBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(bodyContent).then(() => {
        showToast('📋 已将反馈格式化文本复制到剪贴板！');
      }).catch(err => {
        showToast('❌ 复制失败，请手动选择复制');
      });
    });
  }

  // 4. Custom Toast Notification
  function showToast(message) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    
    toast.innerHTML = `
      <span class="toast-icon">ℹ️</span>
      <span class="toast-content">${message}</span>
    `;
    
    toast.classList.add('active');
    
    setTimeout(() => {
      toast.classList.remove('active');
    }, 3000);
  }
});
