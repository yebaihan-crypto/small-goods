/* ==========================================================================
   SocialGraphy Website JavaScript
   Interactive stars background, FAQs, and support form management
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
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
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.shadowBlur = this.size * 2;
            ctx.shadowColor = "#c084fc";
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }

        update() {
            // Twinkle
            this.alpha += this.twinkleSpeed * this.twinkleDirection;
            if (this.alpha >= 1) {
                this.alpha = 1;
                this.twinkleDirection = -1;
            } else if (this.alpha <= 0.1) {
                this.alpha = 0.1;
                this.twinkleDirection = 1;
            }

            // Drift slowly
            this.x += this.speedX;
            this.y += this.speedY;

            // Boundary wrap-around
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;

            // Mouse interact (push slightly)
            if (mouse.x !== null && mouse.y !== null) {
                let dx = this.x - mouse.x;
                let dy = this.y - mouse.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    let force = (mouse.radius - dist) / mouse.radius;
                    this.x += (dx / dist) * force * 1.2;
                    this.y += (dy / dist) * force * 1.2;
                }
            }
        }
    }

    // Initialize stars array
    function setup() {
        stars = [];
        for (let i = 0; i < starCount; i++) {
            stars.push(new Star());
        }
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);
        stars.forEach(star => {
            star.update();
            star.draw();
        });
        requestAnimationFrame(animate);
    }

    // Listeners
    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        setup();
    });

    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener("mouseleave", () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Run
    setup();
    animate();
}

/**
 * FAQ Toggle Accordions
 */
function initFAQ() {
    const faqQuestions = document.querySelectorAll(".faq-question");
    faqQuestions.forEach(question => {
        question.addEventListener("click", () => {
            const item = question.parentElement;
            const isActive = item.classList.contains("active");

            // Close all items
            document.querySelectorAll(".faq-item").forEach(i => {
                i.classList.remove("active");
            });

            // Open clicked item if not previously active
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

        if (!name || !email || !category || !subject || !message) {
            alert("请完整填写表单中所有的必填项。");
            return;
        }

        // Visual submitting feedback
        btnSubmit.disabled = true;
        btnSubmit.querySelector("span").textContent = "正在提交，请稍候...";

        // Simulate network API request
        setTimeout(() => {
            // Hide form and show success card
            form.classList.add("hidden");
            successCard.classList.remove("hidden");

            // Clear inputs
            form.reset();

            // Restore submit button state for next time
            btnSubmit.disabled = false;
            btnSubmit.querySelector("span").textContent = "🚀 提交支持请求";
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
            // Stop parent rotation temporarily on hover or make it scale
            node.style.transform = "scale(1.5)";
            node.style.transition = "transform 0.2s ease";
        });
        node.style.cursor = "pointer";
        node.addEventListener("mouseleave", () => {
            node.style.transform = "scale(1)";
        });

        node.addEventListener("click", () => {
            const name = node.getAttribute("data-name");
            const role = node.getAttribute("data-role");
            // Highlight contact selection by showing a subtle toast or change app UI card content
            const cardTitle = document.querySelector(".app-card .card-title");
            const cardText = document.querySelector(".app-card .card-text");
            if (cardTitle && cardText) {
                cardTitle.textContent = `🪐 星座节点: ${name}`;
                if (role === "Family") {
                    cardText.textContent = `角色: 家庭成员。通过 CloudKit 与伴侣建立实时双向信息共享。`;
                } else if (role === "Friend") {
                    cardText.textContent = `角色: 亲密好友。最近 30 天包含 5 次互动记事，轨道平稳。`;
                } else {
                    cardText.textContent = `角色: 工作伙伴。本周无日程记录，运行在偏远外层星轨。`;
                }
            }
        });
    });
}
