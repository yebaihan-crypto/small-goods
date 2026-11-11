/* ==========================================================================
   SocialGraphy Website JavaScript
   Interactive stars background, FAQs, and support form management
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // 0. Language Switcher Logic
    initLanguageToggle();

    // 1. Twinkling & Interactive Stars Background
    initStarsBackground();

    // 2. FAQ Accordion Logic
    initFAQ();

    // 3. Support Form Submission Simulation
    initSupportForm();

    // 4. Interactive Phone Mockup Galaxy Nodes
    initGalaxyNodes();
});

/**
 * Canvas Stars Particle Background
 */
function initStarsBackground() {
    const canvas = document.getElementById("stars-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let stars = [];
    const starCount = window.innerWidth < 768 ? 60 : 120;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: null, y: null, radius: 100 };

    // Star Class
    class Star {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 1.5 + 0.5;
            this.baseAlpha = Math.random() * 0.5 + 0.3;
            this.alpha = this.baseAlpha;
            this.twinkleSpeed = Math.random() * 0.02 + 0.005;
            this.twinkleDirection = Math.random() > 0.5 ? 1 : -1;
            this.speedX = (Math.random() - 0.5) * 0.05;
            this.speedY = (Math.random() - 0.5) * 0.05;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(235, 230, 255, ${this.alpha})`;
            ctx.shadowBlur = this.size > 1.2 ? 6 : 0;
            ctx.shadowColor = "rgba(168, 85, 247, 0.8)";
            ctx.fill();
        }

        update() {
            // Twinkle effect
            this.alpha += this.twinkleSpeed * this.twinkleDirection;
            if (this.alpha > 0.9) {
                this.alpha = 0.9;
                this.twinkleDirection = -1;
            } else if (this.alpha < this.baseAlpha * 0.4) {
                this.alpha = this.baseAlpha * 0.4;
                this.twinkleDirection = 1;
            }

            // Subtle drift
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;

            // Interactive response to mouse cursor
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    const directionX = dx / distance;
                    const directionY = dy / distance;
                    this.x -= directionX * force * 1.5;
                    this.y -= directionY * force * 1.5;
                }
            }

            this.draw();
        }
    }

    // Initialize Star Population
    function createStars() {
        stars = [];
        for (let i = 0; i < starCount; i++) {
            stars.push(new Star());
        }
    }

    createStars();

    // Render Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);
        stars.forEach(star => star.update());
        requestAnimationFrame(animate);
    }

    animate();

    // Resize Handler
    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        createStars();
    });

    // Mouse Tracking
    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener("mouseout", () => {
        mouse.x = null;
        mouse.y = null;
    });
}

/**
 * FAQ Accordion Expand/Collapse
 */
function initFAQ() {
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {
        const question = item.querySelector(".faq-question");
        question.addEventListener("click", () => {
            const isActive = item.classList.contains("active");

            // Close other items
            faqItems.forEach(other => {
                if (other !== item) {
                    other.classList.remove("active");
                }
            });

            // Toggle current
            if (!isActive) {
                item.classList.add("active");
            }
        });
    });
}

/**
 * Support Form Simulation & Validation
 */
function initSupportForm() {
    const form = document.getElementById("support-form");
    const successCard = document.getElementById("form-success");
    const btnSubmit = document.getElementById("btn-submit-support");
    const btnReset = document.getElementById("btn-reset-form");

    if (!form || !successCard) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Basic validation
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const category = document.getElementById("category").value;
        const subject = document.getElementById("subject").value.trim();
        const message = document.getElementById("message").value.trim();

        const isEn = document.documentElement.getAttribute("data-lang") === "en";

        if (!name || !email || !category || !subject || !message) {
            alert(isEn ? "Please fill in all required fields." : "请完整填写表单中所有的必填项。");
            return;
        }

        // Visual submitting feedback
        btnSubmit.disabled = true;
        const zhSpan = btnSubmit.querySelector(".lang-zh");
        const enSpan = btnSubmit.querySelector(".lang-en");
        if (zhSpan) zhSpan.textContent = "正在提交，请稍候...";
        if (enSpan) enSpan.textContent = "Submitting, please wait...";

        // Simulate network API request
        setTimeout(() => {
            // Hide form and show success card
            form.classList.add("hidden");
            successCard.classList.remove("hidden");

            // Clear inputs
            form.reset();

            // Restore submit button state for next time
            btnSubmit.disabled = false;
            if (zhSpan) zhSpan.textContent = "🚀 提交支持请求";
            if (enSpan) enSpan.textContent = "🚀 Submit Support Request";
        }, 1200);
    });

    if (btnReset) {
        btnReset.addEventListener("click", () => {
            // Show form and hide success card
            successCard.classList.add("hidden");
            form.classList.remove("hidden");
        });
    }
}

/**
 * Interactive Phone Mockup Galaxy Nodes
 */
function initGalaxyNodes() {
    const nodes = document.querySelectorAll(".person-node");
    nodes.forEach(node => {
        node.addEventListener("mouseenter", () => {
            node.style.transform = "scale(1.5)";
            node.style.transition = "transform 0.2s ease";
        });
        node.style.cursor = "pointer";
        node.addEventListener("mouseleave", () => {
            node.style.transform = "scale(1)";
        });

        node.addEventListener("click", () => {
            const isEn = document.documentElement.getAttribute("data-lang") === "en";
            const name = isEn ? (node.getAttribute("data-name-en") || node.getAttribute("data-name")) : node.getAttribute("data-name");
            const role = node.getAttribute("data-role");

            const cardTitle = document.querySelector(".app-card .card-title");
            const cardText = document.querySelector(".app-card .card-text");
            if (cardTitle && cardText) {
                cardTitle.textContent = isEn ? `🪐 Node: ${name}` : `🪐 星座节点: ${name}`;
                if (role === "Family") {
                    cardText.textContent = isEn
                        ? "Role: Family Member. Real-time two-way synchronization via CloudKit."
                        : "角色: 家庭成员。通过 CloudKit 与伴侣建立实时双向信息共享。";
                } else if (role === "Friend") {
                    cardText.textContent = isEn
                        ? "Role: Close Friend. 5 interactions recorded in the past 30 days, stable orbit."
                        : "角色: 亲密好友。最近 30 天包含 5 次互动记事，轨道平稳。";
                } else {
                    cardText.textContent = isEn
                        ? "Role: Work Partner. No recent schedule recorded, residing in outer orbit."
                        : "角色: 工作伙伴。本周无日程记录，运行在偏远外层星轨。";
                }
            }
        });
    });
}

/**
 * 5. Language Switcher Logic
 */
function initLanguageToggle() {
    const LANG_KEY = "socialgraphy_lang";
    
    const categoryOptions = {
        zh: [
            { value: "", text: "请选择问题类型..." },
            { value: "bug", text: "Bug 汇报 (程序闪退/异常)" },
            { value: "sync", text: "同步问题 (iCloud / 伴侣同步失败)" },
            { value: "feature", text: "功能建议 (希望增加新功能)" },
            { value: "refund", text: "退款或账单咨询" },
            { value: "other", text: "其他问题" }
        ],
        en: [
            { value: "", text: "Select problem category..." },
            { value: "bug", text: "Bug Report (Crash/Anomaly)" },
            { value: "sync", text: "Sync Issue (iCloud / Partner Share)" },
            { value: "feature", text: "Feature Request (Suggestions)" },
            { value: "refund", text: "Billing & Subscriptions" },
            { value: "other", text: "Other Inquiries" }
        ]
    };

    function getInitialLang() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get("lang");
        if (urlLang === "zh" || urlLang === "en") return urlLang;
        const saved = localStorage.getItem(LANG_KEY) || localStorage.getItem("hub-lang");
        if (saved === "zh" || saved === "en") return saved;
        return (navigator.language || "zh").toLowerCase().startsWith("zh") ? "zh" : "en";
    }

    function applyLang(lang) {
        document.documentElement.setAttribute("data-lang", lang);
        document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
        localStorage.setItem(LANG_KEY, lang);
        
        document.querySelectorAll("[data-lang-set]").forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-lang-set") === lang);
        });

        // Update form placeholders & options
        const nameInput = document.getElementById("name");
        if (nameInput) {
            nameInput.placeholder = lang === "en" ? "e.g. Alex" : "例如：王小明";
        }
        const emailInput = document.getElementById("email");
        if (emailInput) {
            emailInput.placeholder = lang === "en" ? "e.g. alex@example.com" : "例如：xiaoming@example.com";
        }
        const subjectInput = document.getElementById("subject");
        if (subjectInput) {
            subjectInput.placeholder = lang === "en" ? "Brief summary of your question" : "一句话概括您遇到的问题";
        }
        const messageInput = document.getElementById("message");
        if (messageInput) {
            messageInput.placeholder = lang === "en" 
                ? "Please describe your issue in detail. If related to sync, please note if partner device has enabled iCloud."
                : "请详细描述您的问题，包含操作步骤，如涉及同步，请说明伴侣设备是否已开启 iCloud。";
        }

        const catSelect = document.getElementById("category");
        if (catSelect) {
            const currentVal = catSelect.value;
            catSelect.innerHTML = "";
            const opts = categoryOptions[lang] || categoryOptions.zh;
            opts.forEach(opt => {
                const o = document.createElement("option");
                o.value = opt.value;
                o.textContent = opt.text;
                if (!opt.value) {
                    o.disabled = true;
                    if (!currentVal) o.selected = true;
                } else if (opt.value === currentVal) {
                    o.selected = true;
                }
                catSelect.appendChild(o);
            });
        }

        // Title update
        const titleEl = document.querySelector("title");
        if (titleEl) {
            if (location.pathname.includes("privacy")) {
                titleEl.textContent = lang === "en"
                    ? "SocialGraphy Privacy Policy | Official App Store Compliance"
                    : "SocialGraphy 隐私政策 | App Store 官方合规文件";
            } else {
                titleEl.textContent = lang === "en"
                    ? "SocialGraphy - Explore Your Relational Cosmos | Couple Shared Calendar & Journal"
                    : "SocialGraphy - 探索你的人际星系 | 伴侣共享日历与成长记录";
            }
        }
    }

    document.querySelectorAll("[data-lang-set]").forEach(btn => {
        btn.addEventListener("click", () => {
            applyLang(btn.getAttribute("data-lang-set"));
        });
    });

    applyLang(getInitialLang());
}
