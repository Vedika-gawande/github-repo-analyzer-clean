# 🚀 GitHub Repo Analyzer (Aivya)

An AI-powered web app that analyzes any public GitHub repository and gives **instant insights into its structure, architecture, dependencies, and execution flow**.

🔗 **Live Demo:** https://github-repo-analyzer-clean.vercel.app

---

## 📌 Overview

Understanding a new codebase can be overwhelming. This project simplifies that by:

* Cloning a repository
* Analyzing its structure and key components
* Detecting entry points and dependencies
* Mapping execution flow
* Generating an **AI-powered summary**

All in **one click**.

---

## ✨ Features

* 🔍 **Repository Analysis**
  Fetch and scan any public GitHub repository

* 📁 **Folder Structure Detection**
  Understand how the project is organized

* 🎯 **Entry Point Detection**
  Identify main starting files (e.g., `index.js`, `app.js`)

* 📦 **Dependency Analysis**
  Extract dependencies from `package.json`

* 🛡️ **Critical File Detection**
  Highlight important files (controllers, services, configs)

* 🔁 **Execution Flow Mapping**
  Visualize how requests move through the system

* 🧠 **AI-Powered Summary**
  Get insights, architecture overview, and onboarding tips

---

## 🛠️ Tech Stack

### Frontend

* Vite + JavaScript
* HTML/CSS
* Hosted on **Vercel**

### Backend

* Node.js + Express
* GitHub repo cloning & file analysis
* Gemini API (AI summary)
* Hosted on **Render**

---

## ⚙️ How It Works

1. User enters a GitHub repository URL
2. Backend clones the repository
3. Multiple analyzers run:

   * Structure analyzer
   * Entry point detector
   * Dependency parser
   * Flow analyzer
4. AI processes results and generates summary
5. Results are displayed in UI

---

## 🚀 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Vedika-gawande/github-repo-analyzer-clean.git
cd github-repo-analyzer-clean
```

---

### 2. Setup Backend

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=3001
GEMINI_API_KEY=your_api_key_here
GITHUB_TOKEN=your_token_here
```

Run backend:

```bash
npm start
```

---

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Deployment

### Frontend (Vercel)

* Root directory: `frontend`
* Build command: `npm run build`
* Output directory: `dist`

### Backend (Render)

* Root directory: `backend`
* Build command: `npm install`
* Start command: `node server.js`

Environment variable:

```env
VITE_BACKEND_URL=https://your-backend-url.onrender.com
```

---

## ⚠️ Notes

* Works best with **small to medium-sized repositories**
* Large repositories may take longer due to:

  * Cloning time
  * File analysis
  * AI processing
* Render free tier may introduce delay on first request (cold start)

---

## 📸 Screenshots (Optional)

*Add screenshots of your UI here*

---

## 👩‍💻 Author

**Vedika Gawande**

* Computer Engineering Student
* Passionate about Web Development & AI

---

## 💡 Future Improvements

* Support for private repositories
* Faster analysis with caching
* Better UI visualizations
* Parallel processing optimization

---

## ⭐ If you like this project

Give it a star on GitHub ⭐

---
