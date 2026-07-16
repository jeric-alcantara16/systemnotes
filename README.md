# System Design & Architecture Masterclass

A premium, interactive educational web application covering the fundamentals of system design, architecture patterns, modern case studies, and coding in trending languages (Go, Rust, TypeScript, Python) from basic to advanced.

## 🚀 Features

- **Core System Design Topics**: 16 comprehensive chapters mapping key concepts from foundations to database sharding, caching, security, and cloud architectures.
- **Trending Languages Guides**: Curated, structured paths for Go, Rust, TypeScript, and Python ranging from basic syntax up to advanced concurrency and performance patterns.
- **Interactive Diagrams**: Custom interactive SVG/HTML visualizers demonstrating load balancers, caching flow, UML representations, and CAP theorem trade-offs.
- **Self-Assessment Quizzes**: End-of-chapter interactive quizzes to test your understanding.
- **Interactive System Planner Checklist**: A persistent checklist to track your architecture design requirements, saved offline via browser local storage.
- **Fully Offline Capable**: Runs completely offline without any package installations or local server requirements.

## 📂 Project Structure

- `index.html` - Main structure of the application.
- `styles.css` - Responsive, glassmorphic layout and styling (both Dark and Light modes supported).
- `lessons.js` - Complete lessons content database (System Design chapters, Programming Language guides, quizzes, glossary).
- `app.js` - SPA routing, dynamic search, checklist tracking, theme management, and quiz calculations.

## 💻 Running Locally (Offline)

Simply open the `index.html` file in any modern web browser:
```bash
# On Windows, you can double-click index.html or open it from the command line:
Start-Process index.html
```

Or run it using any static HTTP server if preferred:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve .
```

## 🛠️ GitHub Publishing

To publish this website on your GitHub profile, run the following commands in your terminal:

1. **Configure Git Settings** (your email has already been set up in local commits):
   ```bash
   git config --global user.email "jericalcantara018@gmail.com"
   git config --global user.name "Jer ic Alcantara"
   ```

2. **Add a GitHub remote** (Create a repository named `systemnotes` on github.com first):
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/systemnotes.git
   git branch -M main
   ```

3. **Push to GitHub**:
   ```bash
   git push -u origin main
   ```

To publish it on **GitHub Pages** for easy online access:
1. Go to your repository settings on GitHub.
2. Select **Pages** on the left menu.
3. Under "Build and deployment", set the source to **Deploy from a branch** and select the `main` branch.
4. Save, and your site will be live at `https://YOUR_GITHUB_USERNAME.github.io/systemnotes/` in a few minutes!
