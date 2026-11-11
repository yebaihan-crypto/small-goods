# 🚀 「截屏即待办」官方网站 GitHub Pages 部署教程

本教程将引导您将刚刚生成的静态网站（主页、反馈支持页、隐私政策页）免费部署到 **GitHub Pages**。部署成功后，您将获得一个可供全球访问的网址（如 `https://<your-username>.github.io/ScreenshotTodo/`），可以直接填入 App Store 提审的 **Support URL** 与 **Privacy Policy URL** 中。

---

## 💡 为什么推荐使用 GitHub Pages？
1. **完全免费**：对于个人公开仓库，GitHub Pages 服务完全免费，且自带高速 CDN。
2. **安全省心**：纯静态托管，无任何后端数据库泄露风险，100% 契合本应用的纯本地隐私策略。
3. **支持自定义域名**：后续您可以绑定您自己的独立域名（如 `https://screenshottodo.com`）。

---

## 🛠️ 准备工作
1. 拥有一个 [GitHub](https://github.com/) 账号。
2. 本地电脑已安装 Git（Mac 通常自带）。
3. 网页代码已存在于您本地的 `website` 目录下：
   - `index.html` (首页)
   - `support.html` (反馈支持页)
   - `privacy.html` (隐私政策页)
   - `styles.css` (样式表)
   - `app.js` (交互逻辑)

---

## 📖 部署步骤

### 第一步：在 GitHub 上新建仓库
1. 登录 [GitHub.com](https://github.com/)。
2. 点击右上角的 **「+」** 按钮，选择 **「New repository」**。
3. 填写仓库信息：
   - **Repository name**：建议起名为 `ScreenshotTodo`（或其它英文名）。
   - **Public/Private**：必须选择 **Public**（公开仓库才能免费使用 GitHub Pages 服务）。
   - **Initialize this repository with**：所有勾选项（README, gitignore 等）都**不要勾选**，保持完全空白。
4. 点击底部的 **「Create repository」**。

---

### 第二步：将本地网页文件推送到 GitHub
1. 打开 Mac 自带的 **终端 (Terminal)**。
2. 进入到本网页资源目录（`website` 文件夹）：
   ```bash
   cd "/Users/arcade/Documents/截屏即待办/website"
   ```
3. 初始化本地 Git 仓库并提交代码：
   ```bash
   # 初始化 git 仓库
   git init

   # 将所有网页文件加入暂存区
   git add .

   # 提交到本地版本库
   git commit -m "feat: init website for ScreenshotTodo"

   # 重命名主分支为 main
   git branch -M main
   ```
4. 将本地仓库与 GitHub 远程仓库关联，并推送：
   > ⚠️ **请将下方命令行中的 `<your-username>` 和 `<repo-name>` 替换为您在第一步中实际创建的 GitHub 账号名与仓库名**。
   ```bash
   # 关联 GitHub 远程仓库 (示例)
   git remote add origin https://github.com/<your-username>/<repo-name>.git

   # 推送代码至 GitHub
   git push -u origin main
   ```
   *（注：如果您是第一次在终端推送，GitHub 可能会要求您输入账号和 Token 进行认证，请按照终端提示进行操作。）*

---

### 第三步：在 GitHub 中开启 Pages 服务
1. 在浏览器中打开您刚刚推送代码的 GitHub 仓库页面。
2. 点击仓库导航栏最右侧的 **「Settings」**（齿轮图标）。
3. 在左侧边栏找到并点击 **「Pages」** 选项。
4. 在 **Build and deployment** 下方的 **Source** 选择：
   - 选择 **「Deploy from a branch」**。
5. 在下方 **Branch** 区域：
   - 将默认的 `None` 改选为 **`main`**。
   - 旁边的目录选择 **`/ (root)`**。
   - 点击 **「Save」** 保存。

---

### 第四步：检查并测试访问
1. 保存后，GitHub 会启动自动化构建任务。您可以在仓库顶部的 **「Actions」** 选项卡中看到正在运行的构建流程。
2. 等待大约 1~2 分钟，回到 **「Settings -> Pages」** 页面，顶部会出现一行绿色的提示：
   > **Your site is live at `https://<your-username>.github.io/<repo-name>/`**
3. 点击该链接，检查您的官方展示官网、技术支持页和隐私政策页是否已全部上线且排版完全正常。

---

## 🔗 如何在 App Store 提审中填写链接？

当网站部署完毕并验证无误后，您可以在 App Store Connect 的版本提审页面中如下填写：

- **技术支持网址 (Support URL)**：
  `https://<your-username>.github.io/<repo-name>/support.html`
  *(App Store 要求支持网址必须具有交互性，我们的 support.html 包含一个完整的反馈表单，完全符合要求。)*

- **隐私政策网址 (Privacy Policy URL)**：
  `https://<your-username>.github.io/<repo-name>/privacy.html`
  *(包含无服务器、本地 Vision OCR、EventKit 提醒事项同步以及不使用第三方 SDK 等条款声明，可确保顺利通过关于用户数据收集的隐私审核。)*

---

## 🛠️ 后续维护与修改
如果以后您想修改网页内容（例如修改隐私政策条款或增加功能介绍）：
1. 在本地修改对应的 `.html` 或 `.css` 文件。
2. 在终端执行以下命令重新提交并推送到 GitHub 即可，网站会自动更新：
   ```bash
   git add .
   git commit -m "chore: update website content"
   git push origin main
   ```
