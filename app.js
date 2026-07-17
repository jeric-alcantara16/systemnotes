// ==========================================================================
// STATE MANAGEMENT
// ==========================================================================
function safeJSONParse(key, fallback = {}) {
    try {
        const item = localStorage.getItem(key);
        if (item === null || item === "undefined") return fallback;
        return JSON.parse(item);
    } catch (e) {
        console.error("Error parsing localStorage key " + key, e);
        return fallback;
    }
}

let state = {
    currentMode: "system-design", // "system-design" or "languages"
    activeChapterId: null, // ID of the currently active chapter (null = welcome/glossary/checklist)
    activeTab: "learn", // "learn", "visualizer", "quiz"
    activeGlobalPageIndex: 0, // Current global page index inside the active mode
    completedItems: safeJSONParse("sysnotes_completed"),
    checklistState: safeJSONParse("sysnotes_checklist"),
    systems: safeJSONParse("sysnotes_systems", []),
    activeSystemId: localStorage.getItem("sysnotes_active_system_id") || null,
    theme: localStorage.getItem("sysnotes_theme") || "dark",
    
    // Task Tracker state
    trackerTasks: safeJSONParse("sysnotes_tracker_tasks", null),
    trackerFilterStatus: "All",
    trackerFilterPriority: "All",
    trackerSystemName: localStorage.getItem("sysnotes_system_name") || "My System Architecture"
};

// Initialize default tasks if empty
if (state.trackerTasks === null) {
    state.trackerTasks = [
        { id: "task_1", title: "Define Functional & Non-Functional Requirements", desc: "List core features and SLA constraints.", category: "Foundations", priority: "High", status: "Completed", dueDate: "2026-07-17" },
        { id: "task_2", title: "Design High-Level Schema & Choose Database", desc: "Map tables/collections. Compare PostgreSQL vs MongoDB.", category: "Database", priority: "High", status: "In Progress", dueDate: "2026-07-20" },
        { id: "task_3", title: "Configure CDN & Redis Cache Aside Routing", desc: "Set cache TTL policies and static edge delivery.", category: "Caching", priority: "Medium", status: "To Do", dueDate: "2026-07-24" },
        { id: "task_4", title: "Implement JWT Sessions & TLS Encryption", desc: "Verify secure token payload and transport boundaries.", category: "Security", priority: "Low", status: "To Do", dueDate: "2026-07-28" }
    ];
    localStorage.setItem("sysnotes_tracker_tasks", JSON.stringify(state.trackerTasks));
}

// Cached lookup arrays from lessons.js
let currentLessonsList = [];
let globalPages = [];

// ==========================================================================
// DOM ELEMENT REFERENCES
// ==========================================================================
const appSidebar = document.getElementById("appSidebar");
const sidebarNav = document.getElementById("sidebarNav");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuToggleBtn = document.getElementById("menuToggleBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");

const btnSystemDesign = document.getElementById("btnSystemDesign");
const btnLanguages = document.getElementById("btnLanguages");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

const btnGlossary = document.getElementById("btnGlossary");
const btnChecklist = document.getElementById("btnChecklist");

const themeToggleBtn = document.getElementById("themeToggleBtn");
const breadcrumbs = document.getElementById("breadcrumbs");
const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");

const contentContainer = document.getElementById("contentContainer");
const welcomeView = document.getElementById("welcomeView");
const lessonView = document.getElementById("lessonView");
const glossaryView = document.getElementById("glossaryView");
const checklistView = document.getElementById("checklistView");

const startCourseBtn = document.getElementById("startCourseBtn");
const welcomeChecklistBtn = document.getElementById("welcomeChecklistBtn");
const prevChapterBtn = document.getElementById("prevChapterBtn");
const nextChapterBtn = document.getElementById("nextChapterBtn");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanes = document.querySelectorAll(".tab-pane");

const lessonBody = document.getElementById("lessonBody");
const visualizerCanvas = document.getElementById("visualizerCanvas");
const visualizerTitle = document.getElementById("visualizerTitle");
const visualizerDesc = document.getElementById("visualizerDesc");
const quizContainer = document.getElementById("quizContainer");

// ==========================================================================
// THEME & CORE INITIALIZATION
// ==========================================================================
function initTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    // Icons are toggled via CSS selectors on data-theme
}

themeToggleBtn.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("sysnotes_theme", state.theme);
    document.documentElement.setAttribute("data-theme", state.theme);
});

// ==========================================================================
// NAVIGATION & SPA ROUTING
// ==========================================================================
function updateActiveModeData() {
    currentLessonsList = state.currentMode === "system-design" ? SYSTEM_DESIGN_LESSONS : PROGRAMMING_LANGUAGE_LESSONS;
    
    // Rebuild globalPages flat list for the active mode
    globalPages = [];
    currentLessonsList.forEach(lesson => {
        const pages = lesson.content.split('<!-- pagebreak -->');
        pages.forEach((pageContent, idx) => {
            globalPages.push({
                lessonId: lesson.id,
                pageIndex: idx,
                content: pageContent,
                lessonTitle: lesson.title,
                visualizer: lesson.visualizer,
                quiz: lesson.quiz
            });
        });
    });
}

function buildSidebarNav(searchQuery = "") {
    sidebarNav.innerHTML = "";
    updateActiveModeData();

    // Grouping by category
    const categories = {};
    currentLessonsList.forEach(lesson => {
        const matchesQuery = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             lesson.content.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (searchQuery === "" || matchesQuery) {
            if (!categories[lesson.category]) {
                categories[lesson.category] = [];
            }
            categories[lesson.category].push(lesson);
        }
    });

    Object.keys(categories).forEach(cat => {
        const header = document.createElement("div");
        header.className = "nav-section-title";
        header.textContent = cat;
        sidebarNav.appendChild(header);

        categories[cat].forEach(lesson => {
            const item = document.createElement("a");
            item.className = "nav-item";
            if (state.activeChapterId === lesson.id) item.classList.add("active");
            if (state.completedItems[lesson.id]) item.classList.add("completed");
            item.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>${lesson.title}</span>
            `;
            item.addEventListener("click", () => {
                const firstPageIdx = globalPages.findIndex(p => p.lessonId === lesson.id);
                if (firstPageIdx !== -1) {
                    showPage(firstPageIdx);
                }
                closeSidebarMobile();
            });
            sidebarNav.appendChild(item);
        });
    });
}

function showView(viewName) {
    // Hide all views
    welcomeView.classList.remove("active");
    lessonView.classList.remove("active");
    glossaryView.classList.remove("active");
    checklistView.classList.remove("active");

    // Remove active states from footer buttons
    btnGlossary.classList.remove("active");
    btnChecklist.classList.remove("active");

    // Clear active links in sidebar
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));

    if (viewName === "welcome") {
        welcomeView.classList.add("active");
        breadcrumbs.innerHTML = `<span>Home</span>`;
        state.activeChapterId = null;
    } else if (viewName === "glossary") {
        glossaryView.classList.add("active");
        btnGlossary.classList.add("active");
        breadcrumbs.innerHTML = `<span>Home</span> &nbsp;&raquo;&nbsp; <span>Glossary</span>`;
        state.activeChapterId = null;
        renderGlossary();
    } else if (viewName === "checklist") {
        checklistView.classList.add("active");
        btnChecklist.classList.add("active");
        breadcrumbs.innerHTML = `<span>Home</span> &nbsp;&raquo;&nbsp; <span>Task Tracker</span>`;
        state.activeChapterId = null;
        renderChecklist();
    } else if (viewName === "lesson") {
        lessonView.classList.add("active");
    }
}

function updateLessonNavigation() {
    const pageIndex = state.activeGlobalPageIndex;
    const pageIndicator = document.getElementById("lessonPageIndicator");
    const pageObj = globalPages[pageIndex];
    if (!pageObj) return;

    const currentIndex = currentLessonsList.findIndex(l => l.id === pageObj.lessonId);

    if (state.activeTab === "learn" && globalPages.length > 1) {
        // Show page indicator
        pageIndicator.style.display = "flex";
        pageIndicator.textContent = `Page ${pageIndex + 1} of ${globalPages.length}`;

        // Previous button
        if (pageIndex > 0) {
            prevChapterBtn.classList.remove("disabled");
            prevChapterBtn.querySelector("span").textContent = "Previous Page";
            prevChapterBtn.onclick = () => {
                showPage(pageIndex - 1);
            };
        } else {
            prevChapterBtn.classList.add("disabled");
            prevChapterBtn.querySelector("span").textContent = "Previous Page";
            prevChapterBtn.onclick = null;
        }

        // Next button
        if (pageIndex < globalPages.length - 1) {
            nextChapterBtn.classList.remove("disabled");
            nextChapterBtn.querySelector("span").textContent = "Next Page";
            nextChapterBtn.onclick = () => {
                showPage(pageIndex + 1);
            };
        } else {
            nextChapterBtn.classList.add("disabled");
            nextChapterBtn.querySelector("span").textContent = "Next Page";
            nextChapterBtn.onclick = null;
        }
    } else {
        // Hide page indicator
        pageIndicator.style.display = "none";

        // Previous Chapter button
        if (currentIndex > 0) {
            prevChapterBtn.classList.remove("disabled");
            prevChapterBtn.querySelector("span").textContent = "Previous Chapter";
            prevChapterBtn.onclick = () => {
                const prevLesson = currentLessonsList[currentIndex - 1];
                const prevFirstPageIdx = globalPages.findIndex(p => p.lessonId === prevLesson.id);
                showPage(prevFirstPageIdx);
            };
        } else {
            prevChapterBtn.classList.add("disabled");
            prevChapterBtn.querySelector("span").textContent = "Previous Chapter";
            prevChapterBtn.onclick = null;
        }

        // Next Chapter button
        if (currentIndex < currentLessonsList.length - 1) {
            nextChapterBtn.classList.remove("disabled");
            nextChapterBtn.querySelector("span").textContent = "Next Chapter";
            nextChapterBtn.onclick = () => {
                const nextLesson = currentLessonsList[currentIndex + 1];
                const nextFirstPageIdx = globalPages.findIndex(p => p.lessonId === nextLesson.id);
                showPage(nextFirstPageIdx);
            };
        } else {
            nextChapterBtn.classList.add("disabled");
            nextChapterBtn.querySelector("span").textContent = "Next Chapter";
            nextChapterBtn.onclick = null;
        }
    }
}

function showPage(globalPageIndex) {
    state.activeGlobalPageIndex = globalPageIndex;
    updateActiveModeData();
    
    const pageObj = globalPages[globalPageIndex];
    if (!pageObj) return;

    state.activeChapterId = pageObj.lessonId;
    
    showView("lesson");

    // Highlight active link in sidebar
    document.querySelectorAll(".nav-item").forEach(item => {
        const spanText = item.querySelector("span").textContent;
        if (spanText === pageObj.lessonTitle) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Set Breadcrumbs
    breadcrumbs.innerHTML = `<span>${state.currentMode === "system-design" ? "System Design" : "Languages"}</span> &nbsp;&raquo;&nbsp; <span>${pageObj.lessonTitle}</span>`;

    // Render contents
    lessonBody.innerHTML = pageObj.content;
    
    // Configure Visualizer Tab visibility
    const tabVisualizerBtn = document.getElementById("tabVisualizerBtn");
    if (pageObj.visualizer) {
        tabVisualizerBtn.style.display = "flex";
    } else {
        tabVisualizerBtn.style.display = "none";
        if (state.activeTab === "visualizer") {
            switchTab("learn");
        }
    }

    // Load active tab
    switchTab(state.activeTab);

    // Initialize/Render Quiz
    const lesson = currentLessonsList.find(l => l.id === pageObj.lessonId);
    renderQuiz(lesson);

    // Update Navigation UI
    updateLessonNavigation();

    // Scroll to top of article
    document.querySelector(".app-main").scrollTop = 0;
}

function showChapter(chapterId, pageIndex = null) {
    updateActiveModeData();
    const firstPageIdx = globalPages.findIndex(p => p.lessonId === chapterId);
    if (firstPageIdx === -1) return;
    
    if (pageIndex !== null) {
        const targetIdx = globalPages.findIndex(p => p.lessonId === chapterId && p.pageIndex === pageIndex);
        if (targetIdx !== -1) {
            showPage(targetIdx);
            return;
        }
    }
    showPage(firstPageIdx);
}

// Tab Switching logic
function switchTab(tabId) {
    state.activeTab = tabId;
    
    // Update button styling
    tabButtons.forEach(btn => {
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Update panel visibility
    tabPanes.forEach(pane => {
        if (pane.id === `pane${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`) {
            pane.classList.add("active");
        } else {
            pane.classList.remove("active");
        }
    });

    // Trigger visualizer renderer if loaded
    if (tabId === "visualizer" && state.activeChapterId) {
        const lesson = currentLessonsList.find(l => l.id === state.activeChapterId);
        if (lesson && lesson.visualizer) {
            initVisualizer(lesson.visualizer);
        }
    }

    // Update Navigation UI
    updateLessonNavigation();
}

tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        switchTab(btn.getAttribute("data-tab"));
    });
});

// Mode Switching (System Design vs Programming Languages)
function setMode(mode) {
    state.currentMode = mode;
    state.activeGlobalPageIndex = 0;
    state.activeChapterId = null;
    
    if (mode === "system-design") {
        btnSystemDesign.classList.add("active");
        btnLanguages.classList.remove("active");
    } else {
        btnSystemDesign.classList.remove("active");
        btnLanguages.classList.add("active");
    }

    updateActiveModeData();
    buildSidebarNav();
    showView("welcome");
    updateGlobalProgress();
}

btnSystemDesign.addEventListener("click", () => setMode("system-design"));
btnLanguages.addEventListener("click", () => setMode("languages"));

// Search implementation
searchInput.addEventListener("input", (e) => {
    const val = e.target.value;
    if (val.length > 0) {
        clearSearchBtn.style.display = "block";
    } else {
        clearSearchBtn.style.display = "none";
    }
    buildSidebarNav(val);
});

clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    buildSidebarNav("");
});

// Navigation shortcuts on home screen
startCourseBtn.addEventListener("click", () => {
    updateActiveModeData();
    if (globalPages.length > 0) {
        showPage(0);
    }
});

welcomeChecklistBtn.addEventListener("click", () => showView("checklist"));

btnGlossary.addEventListener("click", () => showView("glossary"));
btnChecklist.addEventListener("click", () => showView("checklist"));

// Mobile Sidebar toggle control
function openSidebarMobile() {
    appSidebar.classList.add("open");
    sidebarOverlay.classList.add("active");
}

function closeSidebarMobile() {
    appSidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
}

menuToggleBtn.addEventListener("click", openSidebarMobile);
closeSidebarBtn.addEventListener("click", closeSidebarMobile);
sidebarOverlay.addEventListener("click", closeSidebarMobile);

// ==========================================================================
// GLOSSARY VIEW IMPLEMENTATION
// ==========================================================================
const glossarySearchInput = document.getElementById("glossarySearchInput");
const glossaryGrid = document.getElementById("glossaryGrid");

function renderGlossary(filterText = "") {
    glossaryGrid.innerHTML = "";
    const filtered = GLOSSARY_ITEMS.filter(item => 
        item.term.toLowerCase().includes(filterText.toLowerCase()) || 
        item.definition.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        glossaryGrid.innerHTML = `<div class="no-results">No definitions match your search.</div>`;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "glossary-card";
        card.innerHTML = `
            <div class="glossary-term">${item.term}</div>
            <div class="glossary-definition">${item.definition}</div>
        `;
        glossaryGrid.appendChild(card);
    });
}

glossarySearchInput.addEventListener("input", (e) => {
    renderGlossary(e.target.value);
});

// ==========================================================================
// PLANNER CHECKLIST VIEW IMPLEMENTATION
// ==========================================================================
const checklistWrapper = document.getElementById("checklistWrapper");

function renderChecklist() {
    checklistWrapper.innerHTML = "";

    // Safely verify state.trackerTasks
    if (!state.trackerTasks || !Array.isArray(state.trackerTasks)) {
        state.trackerTasks = [];
    }

    // 0. RENDER ACTIVE SYSTEM NAME FIELD
    const systemNameHeader = document.createElement("div");
    systemNameHeader.style.cssText = "display:flex; align-items:center; gap:16px; margin-bottom:24px; padding:16px; background:var(--bg-secondary); border:1px solid var(--border); border-radius:10px; flex-wrap:wrap;";
    systemNameHeader.innerHTML = `
        <label style="font-size:0.85rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap;">Active System Under Design:</label>
        <input type="text" id="activeSystemNameField" placeholder="Enter system name (e.g. Video Streaming API)..." style="flex:1; min-width:280px; background:var(--surface); border:1px solid var(--border); color:#fff; padding:8px 14px; border-radius:6px; font-size:1rem; outline:none; font-family:var(--font-sans); font-weight:700; border-color:var(--accent-cyan); box-shadow:var(--glow-cyan); transition:var(--transition-smooth);">
    `;
    checklistWrapper.appendChild(systemNameHeader);

    // Event listener for active system name edits
    const sysNameField = systemNameHeader.querySelector("#activeSystemNameField");
    sysNameField.value = state.trackerSystemName || "";
    sysNameField.oninput = (e) => {
        state.trackerSystemName = e.target.value;
        localStorage.setItem("sysnotes_system_name", state.trackerSystemName);
    };

    // Statistics Calculations
    const totalTasks = state.trackerTasks.length;
    const completedTasks = state.trackerTasks.filter(t => t.status === "Completed").length;
    const inProgressTasks = state.trackerTasks.filter(t => t.status === "In Progress").length;
    const todoTasks = state.trackerTasks.filter(t => t.status === "To Do").length;
    
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const highPriority = state.trackerTasks.filter(t => t.priority === "High").length;
    const medPriority = state.trackerTasks.filter(t => t.priority === "Medium").length;
    const lowPriority = state.trackerTasks.filter(t => t.priority === "Low").length;

    // Local timezone date string helper (YYYY-MM-DD)
    const getLocalDateStr = (dObj) => {
        if (!dObj) return "";
        const date = new Date(dObj);
        if (isNaN(date.getTime())) return "";
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // Calculate timeframe analytics metrics
    const now = new Date();
    const todayStr = getLocalDateStr(now);

    // Current week start (Monday) and end (Sunday) in local time
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(now);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mondayStr = getLocalDateStr(monday);
    const sundayStr = getLocalDateStr(sunday);

    const currentMonthStr = todayStr.substring(0, 7); // "YYYY-MM"
    const currentYearStr = todayStr.substring(0, 4); // "YYYY"

    // Helper calculation function
    const getTimeframeStats = (filterFn) => {
        const tasks = state.trackerTasks.filter(filterFn);
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === "Completed").length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, percent };
    };

    const dayStats = getTimeframeStats(t => t.dueDate === todayStr);
    const weekStats = getTimeframeStats(t => (t.dueDate || getLocalDateStr(t.completedAt)) && (t.dueDate || getLocalDateStr(t.completedAt)) >= mondayStr && (t.dueDate || getLocalDateStr(t.completedAt)) <= sundayStr);
    const monthStats = getTimeframeStats(t => (t.dueDate || getLocalDateStr(t.completedAt)) && (t.dueDate || getLocalDateStr(t.completedAt)).startsWith(currentMonthStr));
    const yearStats = getTimeframeStats(t => (t.dueDate || getLocalDateStr(t.completedAt)) && (t.dueDate || getLocalDateStr(t.completedAt)).startsWith(currentYearStr));

    // 1. RENDER DASHBOARD METRICS HEADER (MindForm Sheets style)
    const dashboard = document.createElement("div");
    dashboard.style.cssText = "display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:20px; margin-bottom:30px;";
    
    dashboard.innerHTML = `
        <!-- Card 1: Completion Ring -->
        <div style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:20px; display:flex; align-items:center; gap:20px; box-shadow:var(--shadow-sm);">
            <div style="position:relative; width:70px; height:70px; border-radius:50%; background:var(--surface); display:flex; align-items:center; justify-content:center; font-size:1.25rem; font-weight:800; color:var(--accent-green); border:4px solid var(--border); box-shadow:var(--glow-green);">
                ${completionPercent}%
            </div>
            <div>
                <h4 style="font-size:0.8rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Progress Rate</h4>
                <div style="font-size:1.4rem; font-weight:800; color:var(--text-primary); margin-top:2px;">${completedTasks}/${totalTasks}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">Tasks marked Done</div>
            </div>
        </div>

        <!-- Card 2: Status breakdown -->
        <div style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:20px; box-shadow:var(--shadow-sm); display:flex; flex-direction:column; justify-content:center;">
            <h4 style="font-size:0.8rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Status Distribution</h4>
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700;">
                <span style="color:var(--text-secondary); display:flex; align-items:center; gap:6px;">
                    <span style="width:8px; height:8px; border-radius:50%; background:var(--text-muted);"></span> To Do: <strong style="color:var(--text-primary);">${todoTasks}</strong>
                </span>
                <span style="color:var(--accent-orange); display:flex; align-items:center; gap:6px;">
                    <span style="width:8px; height:8px; border-radius:50%; background:var(--accent-orange);"></span> Focus: <strong style="color:var(--text-primary);">${inProgressTasks}</strong>
                </span>
                <span style="color:var(--accent-green); display:flex; align-items:center; gap:6px;">
                    <span style="width:8px; height:8px; border-radius:50%; background:var(--accent-green);"></span> Done: <strong style="color:var(--text-primary);">${completedTasks}</strong>
                </span>
            </div>
        </div>

        <!-- Card 3: Priorities bar charts -->
        <div style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:20px; box-shadow:var(--shadow-sm); display:flex; flex-direction:column; justify-content:center;">
            <h4 style="font-size:0.8rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Priority Load</h4>
            <div style="display:flex; flex-direction:column; gap:6px; font-size:0.75rem; font-weight:600;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="width:50px; color:#ef4444;">High (${highPriority})</span>
                    <div style="flex:1; height:6px; background:var(--surface); border-radius:3px; overflow:hidden;">
                        <div style="height:100%; background:#ef4444; width:${totalTasks > 0 ? (highPriority / totalTasks) * 100 : 0}%;"></div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="width:50px; color:#eab308;">Medium (${medPriority})</span>
                    <div style="flex:1; height:6px; background:var(--surface); border-radius:3px; overflow:hidden;">
                        <div style="height:100%; background:#eab308; width:${totalTasks > 0 ? (medPriority / totalTasks) * 100 : 0}%;"></div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="width:50px; color:#3b82f6;">Low (${lowPriority})</span>
                    <div style="flex:1; height:6px; background:var(--surface); border-radius:3px; overflow:hidden;">
                        <div style="height:100%; background:#3b82f6; width:${totalTasks > 0 ? (lowPriority / totalTasks) * 100 : 0}%;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    checklistWrapper.appendChild(dashboard);

    // 1.5 RENDER TIMEFRAME LINE GRAPH CARD
    // Calculate timeframe line graph metrics
    if (!state.trackerGraphTab) {
        state.trackerGraphTab = "Daily";
    }

    let graphLabels = [];
    let graphValues = [];
    let points = [];
    let maxVal = 4;

    // SVG plotting variables
    const svgW = 500;
    const svgH = 150;
    const paddingX = 40;
    const paddingRight = 20;
    const availW = svgW - paddingX - paddingRight;

    if (state.trackerGraphTab === "Daily") {
        const todayTasks = state.trackerTasks.filter(t => {
            if (t.status !== "Completed") return false;
            const compDateStr = t.completedAt ? getLocalDateStr(t.completedAt) : (t.dueDate || "");
            return compDateStr === todayStr;
        });

        // Sort tasks chronologically by completion timestamp
        todayTasks.sort((a, b) => {
            const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return timeA - timeB;
        });

        if (todayTasks.length === 0) {
            graphLabels = ["No completions"];
            graphValues = [0];
            const x = paddingX + (availW / 2);
            const y = svgH - 20;
            points.push({ x, y, val: 0, label: "No completions", tooltipLabel: "No completions today", desc: "No completed tasks today", isBaseline: false });
        } else {
            todayTasks.forEach((t, index) => {
                let formattedTime = "12:00 PM";
                if (t.completedAt) {
                    const dateObj = new Date(t.completedAt);
                    formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                } else if (t.status === "Completed") {
                    // Graceful fallback for pre-existing completed tasks loaded from local storage
                    formattedTime = "09:30 AM (Est.)";
                }
                
                graphLabels.push(formattedTime);
                graphValues.push(index + 1);
            });

            maxVal = Math.max(...graphValues, 4);
            for (let i = 0; i < graphLabels.length; i++) {
                const x = graphLabels.length > 1 ? paddingX + (i / (graphLabels.length - 1)) * availW : paddingX + (availW / 2);
                const y = svgH - (graphValues[i] / maxVal) * (svgH - 40) - 20;
                points.push({
                    x,
                    y,
                    val: graphValues[i],
                    label: graphLabels[i],
                    tooltipLabel: graphLabels[i] + " Today",
                    desc: todayTasks[i] ? todayTasks[i].title : "Task Completed",
                    isBaseline: false
                });
            }
        }

    } else {
        // Weekly, Monthly, Yearly
        if (state.trackerGraphTab === "Weekly") {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                const dateStr = getLocalDateStr(d);
                const label = d.toLocaleDateString('en-US', { weekday: 'short' });
                graphLabels.push(label);
                
                const count = state.trackerTasks.filter(t => {
                    if (t.status !== "Completed") return false;
                    const compDateStr = t.completedAt ? getLocalDateStr(t.completedAt) : (t.dueDate || "");
                    return compDateStr === dateStr;
                }).length;
                graphValues.push(count);
            }
        } else if (state.trackerGraphTab === "Monthly") {
            for (let i = 4; i >= 0; i--) {
                const d = new Date(now);
                d.setMonth(now.getMonth() - i);
                const yearMonth = getLocalDateStr(d).substring(0, 7);
                const label = d.toLocaleDateString('en-US', { month: 'short' });
                graphLabels.push(label);
                
                const count = state.trackerTasks.filter(t => {
                    if (t.status !== "Completed") return false;
                    const compDateStr = t.completedAt ? getLocalDateStr(t.completedAt) : (t.dueDate || "");
                    return compDateStr && compDateStr.startsWith(yearMonth);
                }).length;
                graphValues.push(count);
            }
        } else if (state.trackerGraphTab === "Yearly") {
            const currentYear = now.getFullYear();
            for (let i = 4; i >= 0; i--) {
                const yr = currentYear - i;
                graphLabels.push(yr.toString());
                
                const count = state.trackerTasks.filter(t => {
                    if (t.status !== "Completed") return false;
                    const compDateStr = t.completedAt ? getLocalDateStr(t.completedAt) : (t.dueDate || "");
                    return compDateStr && compDateStr.startsWith(yr.toString());
                }).length;
                graphValues.push(count);
            }
        }

        maxVal = Math.max(...graphValues, 4);
        for (let i = 0; i < graphLabels.length; i++) {
            const x = paddingX + (i / (graphLabels.length - 1)) * availW;
            const y = svgH - (graphValues[i] / maxVal) * (svgH - 40) - 20;
            
            // Generate detailed date strings for tooltips
            let tooltipLabel = graphLabels[i];
            if (state.trackerGraphTab === "Weekly") {
                const d = new Date(now);
                d.setDate(now.getDate() - (graphLabels.length - 1 - i));
                tooltipLabel = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            } else if (state.trackerGraphTab === "Monthly") {
                const d = new Date(now);
                d.setMonth(now.getMonth() - (graphLabels.length - 1 - i));
                tooltipLabel = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            } else if (state.trackerGraphTab === "Yearly") {
                tooltipLabel = `Year ${graphLabels[i]}`;
            }

            points.push({ x, y, val: graphValues[i], label: graphLabels[i], tooltipLabel, desc: "Tasks Completed", isBaseline: false });
        }
    }

    // Build SVG Path
    let pathD = "";
    let fillD = "";
    if (points.length > 0) {
        pathD = `M ${points[0].x} ${points[0].y}`;
        fillD = `M ${points[0].x} ${svgH} L ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathD += ` L ${points[i].x} ${points[i].y}`;
            fillD += ` L ${points[i].x} ${points[i].y}`;
        }
        fillD += ` L ${points[points.length - 1].x} ${svgH} Z`;
    }

    // Draw horizontal guidelines
    let guideLinesHtml = "";
    const numGuides = 3;
    for (let i = 0; i <= numGuides; i++) {
        const val = Math.round((i / numGuides) * maxVal);
        const y = svgH - (val / maxVal) * (svgH - 40) - 20;
        guideLinesHtml += `
            <line x1="${paddingX}" y1="${y}" x2="${svgW - paddingRight}" y2="${y}" stroke="var(--border-light)" stroke-width="1" stroke-dasharray="4 4" />
            <text x="${paddingX - 10}" y="${y + 4}" text-anchor="end" fill="var(--text-muted)" style="font-size:0.7rem; font-weight:700;">${val}</text>
        `;
    }

    // Draw X Axis labels
    let xAxisLabelsHtml = "";
    points.forEach(pt => {
        xAxisLabelsHtml += `
            <text x="${pt.x}" y="${svgH + 18}" text-anchor="middle" fill="var(--text-secondary)" style="font-size:0.75rem; font-weight:800;">${pt.label}</text>
        `;
    });

    // Filter baseline markers (like midnight padding) from displaying as physical points
    const renderedPoints = points.filter(pt => !pt.isBaseline);

    // Draw data line path, glowing markers, and overlays
    let svgGraphicHtml = `
        <svg viewBox="0 0 ${svgW} ${svgH + 25}" style="width:100%; height:180px; overflow:visible; display:block;">
            <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="var(--accent-cyan)" />
                    <stop offset="100%" stop-color="var(--accent-green)" />
                </linearGradient>
                <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="var(--accent-cyan)" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="var(--accent-cyan)" stop-opacity="0.0" />
                </linearGradient>
            </defs>

            <!-- Guide Lines -->
            ${guideLinesHtml}

            <!-- Area Shading -->
            ${fillD ? `<path d="${fillD}" fill="url(#areaGrad)" />` : ""}

            <!-- Glowing Line -->
            ${pathD ? `<path d="${pathD}" fill="none" stroke="url(#lineGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />` : ""}

            <!-- Data Point Labels and Highlight Markers -->
            ${renderedPoints.map(pt => `
                <circle cx="${pt.x}" cy="${pt.y}" r="5" fill="var(--accent-cyan)" stroke="#fff" stroke-width="1.5" />
                <text x="${pt.x}" y="${pt.y - 12}" text-anchor="middle" fill="var(--accent-green)" style="font-size:0.75rem; font-weight:800; pointer-events:none;">${pt.val}</text>
            `).join("")}

            <!-- X Axis Text -->
            ${xAxisLabelsHtml}
        </svg>
    `;

    // Format current time and date
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDate = todayStr;

    const analyticsRow = document.createElement("div");
    analyticsRow.style.cssText = "background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:30px; box-shadow:var(--shadow-sm);";
    analyticsRow.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
            <div>
                <h3 style="font-size:0.9rem; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:8px; text-transform:uppercase; letter-spacing:0.5px; margin:0;">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>
                    Task Completions Trend Graph
                </h3>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px; font-weight:600;">
                    Last analyzed: <span style="color:var(--accent-cyan); font-weight:700;">${formattedDate} at ${formattedTime}</span>
                </div>
            </div>
            <div style="display:flex; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:2px;" id="graphTimeframeTabs">
                <button class="graph-tab-btn ${state.trackerGraphTab === 'Daily' ? 'active' : ''}" data-tab="Daily" style="padding:6px 12px; font-size:0.72rem; font-weight:700; border-radius:6px; border:none; cursor:pointer; background:${state.trackerGraphTab === 'Daily' ? 'var(--accent-cyan)' : 'transparent'}; color:${state.trackerGraphTab === 'Daily' ? '#0f172a' : 'var(--text-secondary)'}; transition:all 0.2s;">Daily</button>
                <button class="graph-tab-btn ${state.trackerGraphTab === 'Weekly' ? 'active' : ''}" data-tab="Weekly" style="padding:6px 12px; font-size:0.72rem; font-weight:700; border-radius:6px; border:none; cursor:pointer; background:${state.trackerGraphTab === 'Weekly' ? 'var(--accent-cyan)' : 'transparent'}; color:${state.trackerGraphTab === 'Weekly' ? '#0f172a' : 'var(--text-secondary)'}; transition:all 0.2s;">Weekly</button>
                <button class="graph-tab-btn ${state.trackerGraphTab === 'Monthly' ? 'active' : ''}" data-tab="Monthly" style="padding:6px 12px; font-size:0.72rem; font-weight:700; border-radius:6px; border:none; cursor:pointer; background:${state.trackerGraphTab === 'Monthly' ? 'var(--accent-cyan)' : 'transparent'}; color:${state.trackerGraphTab === 'Monthly' ? '#0f172a' : 'var(--text-secondary)'}; transition:all 0.2s;">Monthly</button>
                <button class="graph-tab-btn ${state.trackerGraphTab === 'Yearly' ? 'active' : ''}" data-tab="Yearly" style="padding:6px 12px; font-size:0.72rem; font-weight:700; border-radius:6px; border:none; cursor:pointer; background:${state.trackerGraphTab === 'Yearly' ? 'var(--accent-cyan)' : 'transparent'}; color:${state.trackerGraphTab === 'Yearly' ? '#0f172a' : 'var(--text-secondary)'}; transition:all 0.2s;">Yearly</button>
            </div>
        </div>
        <div style="position:relative; padding-top:10px;">
            ${svgGraphicHtml}
        </div>
    `;
    checklistWrapper.appendChild(analyticsRow);

    // Setup interactive custom tooltips on hover
    let tooltipEl = document.getElementById("graphTooltip");
    if (!tooltipEl) {
        tooltipEl = document.createElement("div");
        tooltipEl.id = "graphTooltip";
        tooltipEl.style.cssText = "position:absolute; display:none; background:var(--surface); border:1.5px solid var(--accent-cyan); color:var(--text-primary); padding:10px 14px; border-radius:8px; font-size:0.8rem; pointer-events:none; box-shadow:var(--shadow-lg); z-index:10000; font-family:var(--font-sans); font-weight:700; transition:opacity 0.15s ease-out; opacity:0; line-height:1.4; min-width:160px; pointer-events:none;";
        document.body.appendChild(tooltipEl);
    }

    analyticsRow.querySelectorAll("circle").forEach((circle, idx) => {
        circle.style.cursor = "pointer";
        circle.style.transition = "r 0.2s ease, fill 0.2s ease";
        
        const pt = renderedPoints[idx];
        if (!pt) return;

        circle.onmouseenter = (e) => {
            circle.setAttribute("r", "8");
            circle.setAttribute("fill", "var(--accent-green)");
            
            const taskDetail = pt.desc && pt.desc !== "Tasks Completed" && pt.desc !== "Start of Day" && pt.desc !== "End of Day" ? `
                <div style="height:1px; background:var(--border-light); margin-bottom:6px;"></div>
                <div style="color:var(--accent-cyan); font-size:0.75rem; font-style:italic; margin-bottom:4px; max-width:180px; white-space:normal; line-height:1.2;">Task: ${pt.desc}</div>
            ` : "";

            tooltipEl.innerHTML = `
                <div style="color:var(--text-muted); font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Date/Time</div>
                <div style="color:var(--text-primary); font-size:0.85rem; margin-bottom:6px;">${pt.tooltipLabel || pt.label}</div>
                ${taskDetail}
                <div style="height:1px; background:var(--border-light); margin-bottom:6px;"></div>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                    <span style="color:var(--text-secondary); font-size:0.75rem;">Completions:</span>
                    <span style="color:var(--accent-green); font-size:0.9rem; font-weight:800;">${pt.val}</span>
                </div>
            `;
            tooltipEl.style.display = "block";
            tooltipEl.offsetHeight; // trigger reflow
            tooltipEl.style.opacity = "1";
        };

        circle.onmousemove = (e) => {
            tooltipEl.style.left = (e.pageX + 15) + "px";
            tooltipEl.style.top = (e.pageY - 20) + "px";
        };

        circle.onmouseleave = () => {
            circle.setAttribute("r", "5");
            circle.setAttribute("fill", "var(--accent-cyan)");
            tooltipEl.style.opacity = "0";
            setTimeout(() => {
                if (tooltipEl.style.opacity === "0") {
                    tooltipEl.style.display = "none";
                }
            }, 150);
        };
    });

    // Event listener for tab controls
    analyticsRow.querySelectorAll(".graph-tab-btn").forEach(btn => {
        btn.onclick = () => {
            state.trackerGraphTab = btn.getAttribute("data-tab");
            renderChecklist();
        };
    });

    // 2. RENDER ADD TASK INLINE FORM CARD
    const addCard = document.createElement("div");
    addCard.style.cssText = "background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:30px; box-shadow:var(--shadow-sm);";
    
    addCard.innerHTML = `
        <h3 style="font-size:0.95rem; font-weight:800; color:var(--text-primary); margin-bottom:14px; display:flex; align-items:center; gap:8px;">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Tracker Task
        </h3>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:12px;">
            <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Task Title</label>
                <input type="text" id="newTaskTitle" placeholder="e.g., Design API endpoints..." style="width:100%; background:var(--surface); border:1px solid var(--border); color:#fff; padding:8px 12px; border-radius:6px; font-size:0.85rem; outline:none; font-family:var(--font-sans);">
            </div>
            <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Category / Subsystem</label>
                <input type="text" id="newTaskCategory" placeholder="e.g., API Gateway, DB..." style="width:100%; background:var(--surface); border:1px solid var(--border); color:#fff; padding:8px 12px; border-radius:6px; font-size:0.85rem; outline:none; font-family:var(--font-sans);">
            </div>
            <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Priority</label>
                <select id="newTaskPriority" style="width:100%; background:var(--surface); border:1px solid var(--border); color:#fff; padding:8px 12px; border-radius:6px; font-size:0.85rem; outline:none; font-family:var(--font-sans); cursor:pointer;">
                    <option value="High">High</option>
                    <option value="Medium" selected>Medium</option>
                    <option value="Low">Low</option>
                </select>
            </div>
            <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Due Date</label>
                <input type="date" id="newTaskDueDate" style="width:100%; background:var(--surface); border:1px solid var(--border); color:#fff; padding:8px 12px; border-radius:6px; font-size:0.85rem; outline:none; font-family:var(--font-sans);">
            </div>
        </div>
        <div style="display:flex; align-items:center; gap:12px; margin-top:16px;">
            <input type="text" id="newTaskDesc" placeholder="Brief requirement details / description (optional)..." style="flex:1; background:var(--surface); border:1px solid var(--border); color:#fff; padding:8px 12px; border-radius:6px; font-size:0.85rem; outline:none; font-family:var(--font-sans);">
            <button class="primary-btn" id="btnAddTask" style="padding:8px 18px; font-size:0.85rem; background:var(--gradient-success); color:#fff; box-shadow:none;">Add Task</button>
        </div>
    `;
    checklistWrapper.appendChild(addCard);

    // Event Listener for Adding Tasks
    const tTitle = addCard.querySelector("#newTaskTitle");
    const tCategory = addCard.querySelector("#newTaskCategory");
    const tPriority = addCard.querySelector("#newTaskPriority");
    const tDueDate = addCard.querySelector("#newTaskDueDate");
    const tDesc = addCard.querySelector("#newTaskDesc");
    const tBtn = addCard.querySelector("#btnAddTask");

    // Set today's date default
    const today = new Date().toISOString().split('T')[0];
    tDueDate.value = today;

    const handleAddTask = () => {
        const titleVal = tTitle.value.trim();
        if (!titleVal) {
            alert("Please enter a task title.");
            return;
        }

        const categoryVal = tCategory.value.trim() || "General";
        const descVal = tDesc.value.trim() || "No extra description provided.";
        const priorityVal = tPriority.value;
        const dueDateVal = tDueDate.value || today;

        state.trackerTasks.push({
            id: "task_" + Date.now(),
            title: titleVal,
            category: categoryVal,
            desc: descVal,
            priority: priorityVal,
            dueDate: dueDateVal,
            status: "To Do"
        });

        localStorage.setItem("sysnotes_tracker_tasks", JSON.stringify(state.trackerTasks));
        renderChecklist();
    };

    tBtn.onclick = handleAddTask;

    // 3. RENDER CONTROLS ROW (Filters: Status and Priority)
    const filterRow = document.createElement("div");
    filterRow.style.cssText = "display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:20px; border-bottom:1px solid var(--border-light); padding-bottom:16px;";
    
    // Status Filter buttons layout
    const filterStates = ["All", "To Do", "In Progress", "Completed"];
    let filterButtonsHtml = "";
    filterStates.forEach(fs => {
        const isActive = state.trackerFilterStatus === fs;
        filterButtonsHtml += `
            <button class="filter-status-btn ${isActive ? 'active' : ''}" data-status="${fs}" style="background:${isActive ? 'var(--accent-cyan)' : 'var(--surface)'}; color:${isActive ? '#0f172a' : 'var(--text-secondary)'}; border:none; padding:6px 14px; font-size:0.8rem; font-weight:700; border-radius:6px; cursor:pointer; transition:var(--transition-smooth); margin-right:4px;">
                ${fs}
            </button>
        `;
    });

    filterRow.innerHTML = `
        <!-- Left side: Status Filter Buttons -->
        <div style="display:flex; flex-wrap:wrap;">
            ${filterButtonsHtml}
        </div>

        <!-- Right side: Priority Dropdown Filter -->
        <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Priority:</label>
            <select id="filterPriorityDropdown" style="background:var(--surface); border:1px solid var(--border); color:var(--text-primary); padding:6px 10px; border-radius:6px; font-family:var(--font-sans); outline:none; font-size:0.8rem; font-weight:600; cursor:pointer;">
                <option value="All" ${state.trackerFilterPriority === "All" ? 'selected' : ''}>All Priorities</option>
                <option value="High" ${state.trackerFilterPriority === "High" ? 'selected' : ''}>High</option>
                <option value="Medium" ${state.trackerFilterPriority === "Medium" ? 'selected' : ''}>Medium</option>
                <option value="Low" ${state.trackerFilterPriority === "Low" ? 'selected' : ''}>Low</option>
            </select>
        </div>
    `;
    checklistWrapper.appendChild(filterRow);

    // Filter Listeners
    filterRow.querySelectorAll(".filter-status-btn").forEach(btn => {
        btn.onclick = () => {
            state.trackerFilterStatus = btn.getAttribute("data-status");
            renderChecklist();
        };
    });

    const priorityFilter = filterRow.querySelector("#filterPriorityDropdown");
    priorityFilter.onchange = (e) => {
        state.trackerFilterPriority = e.target.value;
        renderChecklist();
    };

    // 4. FILTER THE TASKS
    const filteredTasks = state.trackerTasks.filter(task => {
        const matchesStatus = state.trackerFilterStatus === "All" || task.status === state.trackerFilterStatus;
        const matchesPriority = state.trackerFilterPriority === "All" || task.priority === state.trackerFilterPriority;
        return matchesStatus && matchesPriority;
    });

    // 5. RENDER THE TASKS TABLE CONTAINER
    if (filteredTasks.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.style.cssText = "text-align:center; padding:40px; border:1.5px dashed var(--border); border-radius:12px; color:var(--text-secondary); font-size:0.9rem; margin-top:10px;";
        emptyState.textContent = "No tasks found matching active filter. Create or filter items above!";
        checklistWrapper.appendChild(emptyState);
        return;
    }

    const tableContainer = document.createElement("div");
    tableContainer.style.cssText = "background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; overflow-x:auto; box-shadow:var(--shadow-sm);";
    
    let rowsHtml = "";
    filteredTasks.forEach(task => {
        const isDone = task.status === "Completed";
        
        // Priority Select Styling
        let prColor = "#3b82f6"; // Low (Blue)
        let prText = "#ffffff";
        if (task.priority === "High") { prColor = "rgba(239, 68, 68, 0.15)"; prText = "#ef4444"; }
        else if (task.priority === "Medium") { prColor = "rgba(234, 179, 8, 0.15)"; prText = "#eab308"; }
        else if (task.priority === "Low") { prColor = "rgba(59, 130, 246, 0.15)"; prText = "#3b82f6"; }

        // Status Select Styling
        let stColor = "var(--surface)";
        let stText = "var(--text-secondary)";
        if (task.status === "Completed") { stColor = "rgba(16, 185, 129, 0.15)"; stText = "#10b981"; }
        else if (task.status === "In Progress") { stColor = "rgba(249, 115, 22, 0.15)"; stText = "#f97316"; }

        rowsHtml += `
            <tr style="border-bottom:1px solid var(--border-light);" data-task-id="${task.id}">
                <!-- Checkbox -->
                <td style="padding:16px; text-align:center; width:60px;">
                    <div class="task-grid-checkbox ${isDone ? 'checked' : ''}" style="display:flex; align-items:center; justify-content:center; width:20px; height:20px; border:2px solid var(--border); border-radius:4px; cursor:pointer; transition:var(--transition-smooth); margin: 0 auto; background:${isDone ? 'var(--accent-green)' : 'transparent'}; border-color:${isDone ? 'var(--accent-green)' : 'var(--border)'};">
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="${isDone ? '#0f172a' : 'currentColor'}" stroke-width="4" fill="none" style="display:${isDone ? 'block' : 'none'}"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                </td>
                
                <!-- Task Title & Description -->
                <td style="padding:16px; min-width:240px; cursor:pointer;" class="task-name-cell">
                    <div style="font-weight:700; font-size:0.925rem; color:${isDone ? 'var(--text-muted)' : 'var(--text-primary)'}; text-decoration:${isDone ? 'line-through' : 'none'};">${task.title}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">${task.desc}</div>
                </td>

                <!-- Category -->
                <td style="padding:16px; text-align:center; width:120px;">
                    <span style="background:var(--surface); color:var(--text-secondary); padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:700;">${task.category}</span>
                </td>

                <!-- Priority Select Dropdown -->
                <td style="padding:16px; text-align:center; width:120px;">
                    <select class="grid-priority-select" style="background:${prColor}; color:${prText}; border:none; padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:700; outline:none; cursor:pointer;">
                        <option value="High" ${task.priority === "High" ? 'selected' : ''}>🔴 High</option>
                        <option value="Medium" ${task.priority === "Medium" ? 'selected' : ''}>🟡 Medium</option>
                        <option value="Low" ${task.priority === "Low" ? 'selected' : ''}>🔵 Low</option>
                    </select>
                </td>

                <!-- Status Select Dropdown -->
                <td style="padding:16px; text-align:center; width:140px;">
                    <select class="grid-status-select" style="background:${stColor}; color:${stText}; border:none; padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:700; outline:none; cursor:pointer;">
                        <option value="To Do" ${task.status === "To Do" ? 'selected' : ''}>To Do</option>
                        <option value="In Progress" ${task.status === "In Progress" ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${task.status === "Completed" ? 'selected' : ''}>Completed</option>
                    </select>
                </td>

                <!-- Due Date -->
                <td style="padding:16px; text-align:center; width:125px;">
                    <input type="date" class="grid-due-date" value="${task.dueDate}" style="background:none; border:none; color:var(--text-secondary); font-family:var(--font-sans); font-size:0.8rem; cursor:pointer; outline:none; text-align:center;">
                </td>

                <!-- Delete -->
                <td style="padding:16px; text-align:center; width:60px;">
                    <button class="grid-delete-btn" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem; line-height:1; transition:var(--transition-smooth);">
                        &times;
                    </button>
                </td>
            </tr>
        `;
    });

    tableContainer.innerHTML = `
        <table style="width:100%; border-collapse:collapse; text-align:left;">
            <thead>
                <tr style="background:var(--surface); border-bottom:2px solid var(--border); font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:800;">
                    <th style="padding:12px; text-align:center;">Done</th>
                    <th style="padding:12px;">Task Details</th>
                    <th style="padding:12px; text-align:center;">Category</th>
                    <th style="padding:12px; text-align:center;">Priority</th>
                    <th style="padding:12px; text-align:center;">Status</th>
                    <th style="padding:12px; text-align:center;">Due Date</th>
                    <th style="padding:12px; text-align:center;">Action</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    `;
    checklistWrapper.appendChild(tableContainer);

    // Setup Row Interactability Actions
    tableContainer.querySelectorAll("tbody tr").forEach(row => {
        const taskId = row.getAttribute("data-task-id");
        const task = state.trackerTasks.find(t => t.id === taskId);
        if (!task) return;

        // Toggle Done Checkbox
        row.querySelector(".task-grid-checkbox").onclick = () => {
            if (task.status === "Completed") {
                task.status = "To Do";
                task.completedAt = null;
            } else {
                task.status = "Completed";
                task.completedAt = new Date().toISOString();
            }
            localStorage.setItem("sysnotes_tracker_tasks", JSON.stringify(state.trackerTasks));
            renderChecklist();
        };

        // Edit Priority dropdown
        const pSelect = row.querySelector(".grid-priority-select");
        pSelect.onchange = (e) => {
            task.priority = e.target.value;
            localStorage.setItem("sysnotes_tracker_tasks", JSON.stringify(state.trackerTasks));
            renderChecklist();
        };

        // Edit Status dropdown
        const sSelect = row.querySelector(".grid-status-select");
        sSelect.onchange = (e) => {
            task.status = e.target.value;
            if (task.status === "Completed") {
                task.completedAt = new Date().toISOString();
            } else {
                task.completedAt = null;
            }
            localStorage.setItem("sysnotes_tracker_tasks", JSON.stringify(state.trackerTasks));
            renderChecklist();
        };

        // Edit Due Date
        const dInput = row.querySelector(".grid-due-date");
        dInput.onchange = (e) => {
            task.dueDate = e.target.value;
            localStorage.setItem("sysnotes_tracker_tasks", JSON.stringify(state.trackerTasks));
            renderChecklist();
        };

        // Delete Row
        row.querySelector(".grid-delete-btn").onclick = () => {
            state.trackerTasks = state.trackerTasks.filter(t => t.id !== taskId);
            localStorage.setItem("sysnotes_tracker_tasks", JSON.stringify(state.trackerTasks));
            renderChecklist();
        };
    });
}

// ==========================================================================
// ASSESSMENT QUIZ COMPONENT
// ==========================================================================
let currentQuizState = {
    selectedAnswers: {}, // index of question -> index of selected option
    submitted: false
};

function renderQuiz(lesson) {
    quizContainer.innerHTML = "";
    currentQuizState = { selectedAnswers: {}, submitted: false };

    if (!lesson.quiz || lesson.quiz.length === 0) {
        quizContainer.innerHTML = `<div class="no-quiz">No quiz available for this chapter.</div>`;
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "quiz-wrapper";
    
    // Generate questions markup
    let questionsHtml = "";
    lesson.quiz.forEach((q, qIndex) => {
        let optionsHtml = "";
        q.options.forEach((opt, optIndex) => {
            optionsHtml += `
                <div class="quiz-option" data-question="${qIndex}" data-option="${optIndex}">
                    <div class="quiz-option-radio"></div>
                    <div class="quiz-option-text">${opt}</div>
                </div>
            `;
        });

        questionsHtml += `
            <div class="quiz-question-block" id="questionBlock_${qIndex}" style="margin-bottom: 30px;">
                <div class="quiz-question-header">
                    <span class="question-num">Question ${qIndex + 1} of ${lesson.quiz.length}</span>
                    <h4 class="question-text">${q.question}</h4>
                </div>
                <div class="quiz-options">
                    ${optionsHtml}
                </div>
                <div class="quiz-feedback" id="feedback_${qIndex}"></div>
            </div>
        `;
    });

    wrapper.innerHTML = `
        ${questionsHtml}
        <div class="quiz-footer">
            <div class="quiz-footer-status" id="quizFooterStatus">Select answers to complete the assessment.</div>
            <button class="primary-btn" id="submitQuizBtn" style="padding: 10px 24px;">Submit Answers</button>
        </div>
    `;

    quizContainer.appendChild(wrapper);

    // Setup interactive options click listeners
    const optionEls = wrapper.querySelectorAll(".quiz-option");
    optionEls.forEach(optEl => {
        optEl.addEventListener("click", () => {
            if (currentQuizState.submitted) return;

            const qIndex = parseInt(optEl.getAttribute("data-question"));
            const optIndex = parseInt(optEl.getAttribute("data-option"));

            // Clear previously selected in this question
            wrapper.querySelectorAll(`.quiz-option[data-question="${qIndex}"]`).forEach(el => el.classList.remove("selected"));

            // Add selected status
            optEl.classList.add("selected");
            currentQuizState.selectedAnswers[qIndex] = optIndex;
        });
    });

    // Submit handler
    const submitQuizBtn = wrapper.querySelector("#submitQuizBtn");
    submitQuizBtn.addEventListener("click", () => {
        if (currentQuizState.submitted) {
            // Retake logic
            renderQuiz(lesson);
            return;
        }

        // Validate all questions answered
        const answeredCount = Object.keys(currentQuizState.selectedAnswers).length;
        if (answeredCount < lesson.quiz.length) {
            alert(`Please answer all ${lesson.quiz.length} questions before submitting.`);
            return;
        }

        // Process score calculations
        currentQuizState.submitted = true;
        let score = 0;

        lesson.quiz.forEach((q, qIndex) => {
            const selected = currentQuizState.selectedAnswers[qIndex];
            const correct = q.answer;
            const feedbackEl = wrapper.querySelector(`#feedback_${qIndex}`);
            feedbackEl.style.display = "block";

            // Color option nodes
            wrapper.querySelectorAll(`.quiz-option[data-question="${qIndex}"]`).forEach((el, optIndex) => {
                if (optIndex === correct) {
                    el.classList.add("correct");
                }
                if (optIndex === selected && selected !== correct) {
                    el.classList.add("incorrect");
                }
            });

            if (selected === correct) {
                score++;
                feedbackEl.innerHTML = `
                    <div class="quiz-feedback-title correct">✓ Correct</div>
                    <p>${q.explanation}</p>
                `;
            } else {
                feedbackEl.innerHTML = `
                    <div class="quiz-feedback-title incorrect">✗ Incorrect</div>
                    <p>${q.explanation}</p>
                `;
            }
        });

        // Show global scores dashboard
        submitQuizBtn.textContent = "Retake Assessment";
        
        // Mark chapter completed
        state.completedItems[lesson.id] = true;
        localStorage.setItem("sysnotes_completed", JSON.stringify(state.completedItems));
        updateGlobalProgress();
        buildSidebarNav(searchInput.value);

        // Score display insertion
        const footerStatus = wrapper.querySelector("#quizFooterStatus");
        footerStatus.innerHTML = `<strong>Result: ${score}/${lesson.quiz.length} Correct.</strong> Assessment logged.`;
    });
}

// ==========================================================================
// DYNAMIC PROGRESS BAR CALCULATOR
// ==========================================================================
function updateGlobalProgress() {
    updateActiveModeData();
    const total = currentLessonsList.length;
    if (total === 0) {
        progressBar.style.width = "0%";
        progressPercent.textContent = "0%";
        return;
    }

    let completed = 0;
    currentLessonsList.forEach(l => {
        if (state.completedItems[l.id]) completed++;
    });

    const percent = Math.round((completed / total) * 100);
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
}

// ==========================================================================
// INTERACTIVE VISUALIZERS IMPLEMENTATION ENGINE
// ==========================================================================
function initVisualizer(config) {
    visualizerTitle.textContent = config.title;
    visualizerDesc.textContent = config.desc;
    visualizerCanvas.innerHTML = "";

    const id = state.activeChapterId;
    if (id === "architecture-styles") {
        renderMonolithVsMicroVisualizer();
    } else if (id === "uml-diagrams") {
        renderSequenceDiagramVisualizer();
    } else if (id === "cap-pacelc") {
        renderCapTheoremVisualizer();
    } else if (id === "load-balancing") {
        renderLoadBalancingVisualizer();
    } else if (id === "caching") {
        renderCacheAsideVisualizer();
    } else if (id === "message-queues") {
        renderMessageQueueVisualizer();
    } else if (id === "api-design") {
        renderApiPayloadVisualizer();
    } else if (id === "database-design") {
        renderShardingVisualizer();
    } else if (id === "high-availability") {
        renderActivePassiveVisualizer();
    } else if (id === "design-patterns") {
        renderObserverPatternVisualizer();
    } else if (id === "security-architecture") {
        renderJwtVisualizer();
    } else if (id === "cloud-architecture") {
        renderCloudCalculator();
    } else if (id === "case-studies") {
        renderCaseStudiesSelector();
    } else if (id === "go") {
        renderGoConcurrencyVisualizer();
    } else if (id === "rust") {
        renderRustBorrowChecker();
    } else if (id === "typescript") {
        renderJsEventLoopVisualizer();
    } else if (id === "python") {
        renderPythonGilVisualizer();
    } else if (id === "monitoring-observability") {
        renderObservabilityVisualizer();
    } else if (id === "php") {
        renderPhpOpcacheVisualizer();
    } else if (id === "laravel") {
        renderLaravelLifecycleVisualizer();
    } else if (id === "flutter") {
        renderFlutterWidgetTreeVisualizer();
    } else {
        visualizerCanvas.innerHTML = `<div class="no-visualizer">Default model viewer. No animation logic defined.</div>`;
    }
}

// 1. Monolith vs Microservices Visualizer
function renderMonolithVsMicroVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <div style="display: flex; gap: 20px; margin-bottom: 10px;">
                <button class="flow-button" id="btnShowMonolith">Monolithic DB Architecture</button>
                <button class="flow-button" id="btnShowMicro" style="background: var(--surface); color: var(--text-primary);">Microservice Isolated DBs</button>
            </div>
            
            <div id="architectureBox" style="width:100%; max-width: 500px; padding: 20px; background: rgba(255,255,255,0.02); border:1px solid var(--border); border-radius: 8px;">
                <!-- Content gets updated by click -->
            </div>
        </div>
    `;

    const box = document.getElementById("architectureBox");
    const bMonolith = document.getElementById("btnShowMonolith");
    const bMicro = document.getElementById("btnShowMicro");

    const showMonolith = () => {
        bMonolith.style.background = "var(--gradient-primary)";
        bMonolith.style.color = "#0f172a";
        bMicro.style.background = "var(--surface)";
        bMicro.style.color = "var(--text-primary)";
        box.innerHTML = `
            <h4 style="color:var(--accent-cyan); margin-bottom:12px; text-align:center;">Shared Database Model (Coupled)</h4>
            <div style="display: flex; justify-content: space-around; align-items: center; margin-bottom: 20px;">
                <div style="background:var(--surface); border:1px solid var(--border); padding: 10px; border-radius:6px; font-weight:700;">Order Module</div>
                <div style="background:var(--surface); border:1px solid var(--border); padding: 10px; border-radius:6px; font-weight:700;">User Module</div>
                <div style="background:var(--surface); border:1px solid var(--border); padding: 10px; border-radius:6px; font-weight:700;">Payment Module</div>
            </div>
            <div style="text-align:center; color: var(--text-muted); margin-bottom: 10px;">↓↓↓ Calls directly (Tight Coupling) ↓↓↓</div>
            <div class="node-box active" style="margin: 0 auto; background: var(--surface); width: 150px; border-color: var(--accent-orange);">
                Shared MySQL DB
            </div>
            <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:14px; text-align:center;">
                ⚠️ <strong>Risk:</strong> A schema update to the user records by the User Module could immediately break SQL commands in the Order Module.
            </p>
        `;
    };

    const showMicro = () => {
        bMicro.style.background = "var(--gradient-primary)";
        bMicro.style.color = "#0f172a";
        bMonolith.style.background = "var(--surface)";
        bMonolith.style.color = "var(--text-primary)";
        box.innerHTML = `
            <h4 style="color:var(--accent-purple); margin-bottom:12px; text-align:center;">Database Per Service (Decoupled)</h4>
            <div style="display: flex; justify-content: space-around; align-items: flex-start; gap: 10px;">
                <div style="text-align:center;">
                    <div style="background:var(--surface); padding:8px; border-radius:6px; font-weight:700; font-size:0.85rem;">Order Service</div>
                    <div style="margin: 6px 0; color:var(--text-muted);">↓</div>
                    <div style="background:rgba(16,185,129,0.1); border:1.5px solid var(--accent-green); padding:6px; border-radius:6px; font-size:0.8rem;">Order DB</div>
                </div>
                <div style="text-align:center;">
                    <div style="background:var(--surface); padding:8px; border-radius:6px; font-weight:700; font-size:0.85rem;">User Service</div>
                    <div style="margin: 6px 0; color:var(--text-muted);">↓</div>
                    <div style="background:rgba(6,182,212,0.1); border:1.5px solid var(--accent-cyan); padding:6px; border-radius:6px; font-size:0.8rem;">User DB</div>
                </div>
                <div style="text-align:center;">
                    <div style="background:var(--surface); padding:8px; border-radius:6px; font-weight:700; font-size:0.85rem;">Payment Service</div>
                    <div style="margin: 6px 0; color:var(--text-muted);">↓</div>
                    <div style="background:rgba(168,85,247,0.1); border:1.5px solid var(--accent-purple); padding:6px; border-radius:6px; font-size:0.8rem;">Payment DB</div>
                </div>
            </div>
            <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:20px; text-align:center;">
                ✅ <strong>Isolation:</strong> Each microservice owns its schema. Services communicate exclusively via API networks (e.g. REST, gRPC).
            </p>
        `;
    };

    bMonolith.onclick = showMonolith;
    bMicro.onclick = showMicro;
    showMonolith(); // default loading
}

// 2. UML Sequence Diagram Animation
function renderSequenceDiagramVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <button class="primary-btn" id="btnTriggerSeq">Execute API Call</button>
            <div style="position: relative; width: 100%; max-width: 480px; height: 260px; background: rgba(0,0,0,0.2); border:1px solid var(--border); border-radius: 8px; padding: 20px;">
                <!-- UML Lifelines -->
                <div style="display:flex; justify-content:space-between; height:100%;">
                    <div style="text-align:center; width: 80px; display:flex; flex-direction:column; align-items:center;">
                        <span style="font-weight:700; font-size:0.8rem; background:var(--surface); padding:4px 8px; border-radius:4px;">Client</span>
                        <div id="lineClient" style="width:2px; flex:1; background:var(--border); position:relative;"></div>
                    </div>
                    <div style="text-align:center; width: 80px; display:flex; flex-direction:column; align-items:center;">
                        <span style="font-weight:700; font-size:0.8rem; background:var(--surface); padding:4px 8px; border-radius:4px;">Gateway</span>
                        <div id="lineGateway" style="width:2px; flex:1; background:var(--border); position:relative;"></div>
                    </div>
                    <div style="text-align:center; width: 80px; display:flex; flex-direction:column; align-items:center;">
                        <span style="font-weight:700; font-size:0.8rem; background:var(--surface); padding:4px 8px; border-radius:4px;">AuthDB</span>
                        <div id="lineAuth" style="width:2px; flex:1; background:var(--border); position:relative;"></div>
                    </div>
                </div>

                <!-- Animated message packet -->
                <div id="packet" style="position:absolute; width:12px; height:12px; border-radius:50%; background:var(--accent-cyan); display:none; transition: all 0.6s linear; box-shadow: var(--glow-cyan); z-index:10;"></div>
                <div id="messageLog" style="position:absolute; bottom:10px; left:20px; right:20px; text-align:center; font-size:0.8rem; font-family:var(--font-mono); color:var(--accent-green);">IDLE: Click button to send request</div>
            </div>
        </div>
    `;

    const packet = document.getElementById("packet");
    const log = document.getElementById("messageLog");
    const btn = document.getElementById("btnTriggerSeq");

    btn.onclick = () => {
        btn.disabled = true;
        
        // Capture positions relative to parent container
        const cX = 64, gX = 236, dbX = 407;
        const yStep1 = 60, yStep2 = 110, yStep3 = 160, yStep4 = 210;

        packet.style.display = "block";
        packet.style.left = cX + "px";
        packet.style.top = yStep1 + "px";
        log.textContent = "--> [1] POST /login sent to API Gateway";

        setTimeout(() => {
            packet.style.left = gX + "px";
            packet.style.top = yStep1 + "px";
        }, 100);

        setTimeout(() => {
            packet.style.top = yStep2 + "px";
            log.textContent = "--> [2] Gateway calls verifySession() on AuthDB";
        }, 800);

        setTimeout(() => {
            packet.style.left = dbX + "px";
            packet.style.top = yStep2 + "px";
        }, 1400);

        setTimeout(() => {
            packet.style.top = yStep3 + "px";
            log.textContent = "<-- [3] AuthDB returns active session status (User valid)";
        }, 2200);

        setTimeout(() => {
            packet.style.left = gX + "px";
            packet.style.top = yStep3 + "px";
        }, 2800);

        setTimeout(() => {
            packet.style.top = yStep4 + "px";
            log.textContent = "<-- [4] Gateway returns HTTP 200 OK Token to Client";
        }, 3600);

        setTimeout(() => {
            packet.style.left = cX + "px";
            packet.style.top = yStep4 + "px";
        }, 4200);

        setTimeout(() => {
            packet.style.display = "none";
            log.textContent = "COMPLETED: Session initialized successfully!";
            btn.disabled = false;
        }, 5000);
    };
}

// 3. CAP Theorem Venn Diagram
function renderCapTheoremVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <div class="cap-circle-wrapper">
                <div class="cap-circle consistency" data-cap="C">Consistency</div>
                <div class="cap-circle availability" data-cap="A">Availability</div>
                <div class="cap-circle partition-tolerance" data-cap="P">Partition Tolerance</div>
            </div>
            <div class="cap-explanation" id="capExplanation">
                Hover or click any node to evaluate CAP guarantees and see common technology mappings.
            </div>
        </div>
    `;

    const exp = document.getElementById("capExplanation");
    const circles = document.querySelectorAll(".cap-circle");

    const explanations = {
        C: "<strong>Consistency (C):</strong> Read calls receive the latest committed write or fail. In CP systems (e.g. MongoDB, Redis, HBase), the partition forces nodes to drop stale read/write actions to keep data synchronized.",
        A: "<strong>Availability (A):</strong> Every alive server responds to request, but can contain old data. In AP systems (e.g. Cassandra, DynamoDB), servers accept regional writes during network isolation, resolving conflicts later.",
        P: "<strong>Partition Tolerance (P):</strong> Mandatory cloud property. Network failures will delay/drop messages eventually. Because we must design for partitions, system designers must make the trade-off: Consistency (CP) or Availability (AP)."
    };

    circles.forEach(c => {
        const type = c.getAttribute("data-cap");
        c.onmouseenter = () => {
            circles.forEach(o => o.classList.remove("active"));
            c.classList.add("active");
            exp.innerHTML = explanations[type];
        };
    });
}

// 4. Load Balancing Visualizer
function renderLoadBalancingVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <button class="primary-btn" id="btnRouteReq">Route Request</button>
            <div style="display:flex; justify-content:space-around; align-items:center; width:100%; max-width:550px; position:relative; min-height: 220px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius: 8px; padding: 20px;">
                
                <!-- Client Node -->
                <div style="text-align:center;">
                    <div style="background:var(--surface); border:1px solid var(--border); width:70px; height:70px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700;">Client</div>
                </div>

                <!-- Load Balancer Node -->
                <div style="text-align:center; position:relative;">
                    <div style="background:var(--surface); border:2px solid var(--accent-cyan); width:80px; height:80px; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; box-shadow:var(--glow-cyan);">
                        <span>Load</span>
                        <span>Balancer</span>
                    </div>
                </div>

                <!-- Backend Nodes -->
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div class="node-box" id="srv0" style="width:110px; padding:10px; font-size:0.85rem;">Server A</div>
                    <div class="node-box" id="srv1" style="width:110px; padding:10px; font-size:0.85rem;">Server B</div>
                    <div class="node-box" id="srv2" style="width:110px; padding:10px; font-size:0.85rem;">Server C</div>
                </div>

                <!-- Packet representation -->
                <div id="lbPacket" style="position:absolute; width:10px; height:10px; border-radius:50%; background:var(--accent-purple); display:none; transition: all 0.5s ease-in-out; box-shadow:var(--glow-purple);"></div>
            </div>
            <div id="lbLog" style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-secondary);">Algorithm: Round Robin (Sequenced routing)</div>
        </div>
    `;

    const btn = document.getElementById("btnRouteReq");
    const packet = document.getElementById("lbPacket");
    const log = document.getElementById("lbLog");
    let rrIndex = 0;

    btn.onclick = () => {
        btn.disabled = true;
        // Nodes selection
        const servers = [0, 1, 2];
        const srvId = servers[rrIndex];
        
        // Remove highlighting from previous server
        servers.forEach(idx => document.getElementById(`srv${idx}`).classList.remove("active-green"));

        // Route animation coordinates
        const cX = 35, lbX = 210, srvX = 400;
        const cY = 110, lbY = 110;
        const srvY = [45, 110, 175][srvId];

        packet.style.display = "block";
        packet.style.left = cX + "px";
        packet.style.top = cY + "px";
        log.textContent = `Receiving Request from Client...`;

        setTimeout(() => {
            packet.style.left = lbX + "px";
            packet.style.top = lbY + "px";
        }, 100);

        setTimeout(() => {
            packet.style.left = srvX + "px";
            packet.style.top = srvY + "px";
            log.textContent = `Routing to Server ${["A", "B", "C"][srvId]} (Index ${srvId})...`;
        }, 650);

        setTimeout(() => {
            document.getElementById(`srv${srvId}`).classList.add("active-green");
            packet.style.display = "none";
            log.textContent = `Server ${["A", "B", "C"][srvId]} processed request. HTTP 200 OK.`;
            btn.disabled = false;
            
            // Advance Round Robin
            rrIndex = (rrIndex + 1) % 3;
        }, 1200);
    };
}

// 5. Caching (Cache Aside Read Flow)
function renderCacheAsideVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <div style="display:flex; gap:10px;">
                <input type="number" id="cacheQueryId" value="1" min="1" max="5" style="width:70px; background:var(--surface); border:1px solid var(--border); color:#fff; padding:6px; border-radius:4px; text-align:center;">
                <button class="primary-btn" id="btnQueryCache" style="padding:6px 14px; font-size:0.85rem;">Fetch User Records</button>
            </div>
            
            <div style="display:flex; justify-content:space-around; width:100%; max-width:550px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px; padding:20px; position:relative; min-height: 180px;">
                <div class="node-box" id="nodeClient" style="width:110px; height:60px; display:flex; align-items:center; justify-content:center; margin-top: 40px;">App Client</div>
                
                <div class="node-box" id="nodeCache" style="width:110px; height:60px; display:flex; align-items:center; justify-content:center; margin-top: 40px;">Redis Cache</div>
                
                <div class="node-box" id="nodeDB" style="width:110px; height:60px; display:flex; align-items:center; justify-content:center; margin-top: 40px; border-color:var(--accent-orange);">Postgres DB</div>

                <div id="cacheDot" style="position:absolute; width:10px; height:10px; border-radius:50%; background:var(--accent-cyan); display:none; transition: all 0.5s ease-in-out; box-shadow:var(--glow-cyan); z-index:5;"></div>
            </div>
            
            <div id="cacheLog" style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-secondary); text-align:center; min-height: 40px;">
                Redis is empty. Querying any ID will result in a CACHE MISS on the first execution.
            </div>
        </div>
    `;

    const input = document.getElementById("cacheQueryId");
    const btn = document.getElementById("btnQueryCache");
    const dot = document.getElementById("cacheDot");
    const log = document.getElementById("cacheLog");

    const ndClient = document.getElementById("nodeClient");
    const ndCache = document.getElementById("nodeCache");
    const ndDB = document.getElementById("nodeDB");

    // Local cached records mapping
    let redisCache = {}; // id -> string

    btn.onclick = () => {
        const id = input.value.trim();
        if (!id) return;
        
        btn.disabled = true;
        ndClient.classList.remove("active", "active-green");
        ndCache.classList.remove("active", "active-green");
        ndDB.classList.remove("active", "active-green");

        const isHit = redisCache[id] !== undefined;

        // Path positions
        const cX = 35, cacheX = 210, dbX = 390;
        const y = 80;

        dot.style.display = "block";
        dot.style.left = cX + "px";
        dot.style.top = y + "px";
        log.textContent = `App requests records for User ID: ${id}. Checking Redis Cache first...`;

        setTimeout(() => {
            dot.style.left = cacheX + "px";
            ndCache.classList.add("active");
        }, 100);

        if (isHit) {
            // CACHE HIT Flow
            setTimeout(() => {
                ndCache.classList.remove("active");
                ndCache.classList.add("active-green");
                log.innerHTML = `<span style="color:var(--accent-green); font-weight:700;">CACHE HIT!</span> Found User #${id} in Redis memory. Returning response in 0.5ms.`;
            }, 600);

            setTimeout(() => {
                dot.style.left = cX + "px";
            }, 1200);

            setTimeout(() => {
                dot.style.display = "none";
                btn.disabled = false;
            }, 1750);
        } else {
            // CACHE MISS Flow
            setTimeout(() => {
                log.innerHTML = `<span style="color:var(--accent-orange); font-weight:700;">CACHE MISS!</span> User #${id} not in Redis. Forwarding query to Postgres Database...`;
                ndDB.classList.add("active");
            }, 800);

            setTimeout(() => {
                dot.style.left = dbX + "px";
            }, 1300);

            setTimeout(() => {
                log.textContent = `Postgres returned records. Committing to Redis cache and returning payload to app Client.`;
                ndDB.classList.remove("active");
                ndDB.classList.add("active-green");
                
                // Write into cache mock
                redisCache[id] = `User payload data for ${id}`;
            }, 2100);

            setTimeout(() => {
                dot.style.left = cacheX + "px";
            }, 2700);

            setTimeout(() => {
                dot.style.left = cX + "px";
            }, 3300);

            setTimeout(() => {
                dot.style.display = "none";
                ndDB.classList.remove("active-green");
                ndCache.classList.add("active-green");
                log.textContent = `Completed read. Cache seeded! Try requesting User ID: ${id} again to see cache hit speed.`;
                btn.disabled = false;
            }, 3900);
        }
    };
}

// 6. Message Queues (Kafka & RabbitMQ Decoupling)
function renderMessageQueueVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <button class="primary-btn" id="btnPublishEvent">Publish Event</button>
            
            <div style="display:flex; justify-content:space-between; width:100%; max-width:550px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px; padding:20px; position:relative; min-height: 200px;">
                <div class="node-box" style="width:90px; height:50px; font-size:0.8rem; display:flex; align-items:center; justify-content:center;">Order API</div>
                
                <!-- Queue Wrapper -->
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="font-weight:700; font-size:0.75rem; color:var(--accent-purple); margin-bottom: 4px;">Kafka Queue Buffer</div>
                    <div id="queueSlots" style="display:flex; flex-direction:row-reverse; gap:6px; border:2px solid var(--border); border-radius:6px; width:220px; height:50px; background:rgba(0,0,0,0.3); padding:8px; overflow:hidden;">
                        <!-- Events injected here -->
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div class="node-box" id="cnsInventory" style="width:95px; height:40px; font-size:0.75rem; display:flex; align-items:center; justify-content:center;">Inventory Srv</div>
                    <div class="node-box" id="cnsNotify" style="width:95px; height:40px; font-size:0.75rem; display:flex; align-items:center; justify-content:center;">Notify Srv</div>
                </div>
            </div>
            
            <div id="mqLog" style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-secondary);">Broker: Durable log stream initialized.</div>
        </div>
    `;

    const publishBtn = document.getElementById("btnPublishEvent");
    const queueSlots = document.getElementById("queueSlots");
    const log = document.getElementById("mqLog");

    const invNode = document.getElementById("cnsInventory");
    const notNode = document.getElementById("cnsNotify");

    let eventCounter = 1;
    let isProcessing = false;

    publishBtn.onclick = () => {
        if (queueSlots.children.length >= 6) {
            log.textContent = "Queue buffer is full! Slow down production rates.";
            return;
        }

        const ev = document.createElement("div");
        ev.className = "queue-event-packet";
        ev.style.cssText = "width:28px; height:28px; border-radius:4px; background:var(--accent-purple); display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:800; color:#0f172a; box-shadow:var(--glow-purple); animation: fadeIn 0.2s;";
        ev.textContent = `#${eventCounter}`;
        queueSlots.appendChild(ev);

        log.textContent = `Published: Event order-placed #${eventCounter} appended to broker log.`;
        eventCounter++;

        triggerConsumerEngine();
    };

    function triggerConsumerEngine() {
        if (isProcessing || queueSlots.children.length === 0) return;
        isProcessing = true;

        const target = queueSlots.firstElementChild; // oldest appended event
        const idStr = target.textContent;
        log.textContent = `Routing: Broker streaming Event ${idStr} to active consumers...`;

        setTimeout(() => {
            invNode.classList.add("active-green");
            notNode.classList.add("active-green");
            target.style.background = "var(--accent-green)";
            target.style.transform = "scale(0.85)";
            log.textContent = `Processing: Inventory & Notification services consuming Event ${idStr} in parallel.`;
        }, 800);

        setTimeout(() => {
            invNode.classList.remove("active-green");
            notNode.classList.remove("active-green");
            target.remove(); // completed popped from buffer
            isProcessing = false;
            log.textContent = `Completed: Event ${idStr} consumed & committed (Offset updated).`;
            
            // Loop for remaining queued items
            triggerConsumerEngine();
        }, 1800);
    }
}

// 7. API Payload Size Comparison Visualizer
function renderApiPayloadVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <button class="flow-button" id="btnRestPayload">REST API (JSON)</button>
                <button class="flow-button" id="btnGraphPayload" style="background:var(--surface); color:#fff;">GraphQL Query</button>
                <button class="flow-button" id="btnGrpcPayload" style="background:var(--surface); color:#fff;">gRPC (Protobuf)</button>
            </div>
            
            <div style="width:100%; max-width: 520px; display:flex; gap:15px; align-items: stretch;">
                <div style="flex:1; background:var(--code-bg); border:1px solid var(--border); border-radius:6px; padding:15px; font-family:var(--font-mono); font-size:0.8rem; overflow:auto; max-height:200px;">
                    <span style="color:var(--text-muted);">// Payload Representation</span>
                    <pre id="payloadCode" style="margin-top:10px; border:none; padding:0; background:none;"></pre>
                </div>
                <div style="width:140px; background:var(--surface); border:1px solid var(--border); border-radius:6px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:10px;">
                    <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted);">PAYLOAD SIZE</div>
                    <div id="payloadSize" style="font-size:1.8rem; font-weight:800; color:var(--accent-cyan); margin: 6px 0;">342 B</div>
                    <div id="payloadRatio" style="font-size:0.7rem; color:var(--accent-green); font-weight:700;">Base reference</div>
                </div>
            </div>
        </div>
    `;

    const code = document.getElementById("payloadCode");
    const size = document.getElementById("payloadSize");
    const ratio = document.getElementById("payloadRatio");

    const bRest = document.getElementById("btnRestPayload");
    const bGraph = document.getElementById("btnGraphPayload");
    const bGrpc = document.getElementById("btnGrpcPayload");

    const setSelection = (activeBtn, inactive1, inactive2, payload, bytes, pct) => {
        activeBtn.style.background = "var(--gradient-primary)";
        activeBtn.style.color = "#0f172a";
        inactive1.style.background = "var(--surface)";
        inactive1.style.color = "var(--text-primary)";
        inactive2.style.background = "var(--surface)";
        inactive2.style.color = "var(--text-primary)";

        code.textContent = payload;
        size.textContent = `${bytes} B`;
        ratio.textContent = pct;
    };

    bRest.onclick = () => {
        setSelection(
            bRest, bGraph, bGrpc,
            JSON.stringify({
                id: 101,
                name: "Jeric Alcantara",
                email: "jericalcantara018@gmail.com",
                role: "Administrator",
                active: true,
                address: { city: "Manila", country: "PH" }
            }, null, 2),
            186,
            "Base reference"
        );
    };

    bGraph.onclick = () => {
        setSelection(
            bGraph, bRest, bGrpc,
            JSON.stringify({
                name: "Jeric Alcantara",
                email: "jericalcantara018@gmail.com"
            }, null, 2),
            68,
            "↓ 63% Smaller (No Over-fetching)"
        );
    };

    bGrpc.onclick = () => {
        setSelection(
            bGrpc, bRest, bGraph,
            "\\x08\\x65\\x12\\x0fJeric Alcantara\\x1a\\x1cjericalcantara018@gmail.com",
            49,
            "↓ 73% Smaller (Compressed Binary)"
        );
    };

    bRest.onclick(); // default load
}

// 8. Database Sharding Router Visualizer
function renderShardingVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <div style="display:flex; gap:10px;">
                <input type="text" id="shardingUserId" value="user_492" style="width:130px; background:var(--surface); border:1px solid var(--border); color:#fff; padding:6px 12px; border-radius:4px;">
                <button class="primary-btn" id="btnRouteShard" style="padding:6px 14px; font-size:0.85rem;">Write Record</button>
            </div>

            <div style="display:flex; justify-content:space-around; align-items:center; width:100%; max-width:550px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px; padding:20px; min-height: 180px; position:relative;">
                <div class="node-box" id="shardRouter" style="width:100px; padding:12px; font-size:0.8rem; border-color:var(--accent-purple);">Shard Router</div>
                
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div class="node-box" id="dbShard0" style="width:130px; padding:8px; font-size:0.75rem;">DB Shard A (Key: 0)</div>
                    <div class="node-box" id="dbShard1" style="width:130px; padding:8px; font-size:0.75rem;">DB Shard B (Key: 1)</div>
                    <div class="node-box" id="dbShard2" style="width:130px; padding:8px; font-size:0.75rem;">DB Shard C (Key: 2)</div>
                </div>

                <div id="shardDot" style="position:absolute; width:10px; height:10px; border-radius:50%; background:var(--accent-purple); display:none; transition: all 0.5s ease-in-out; box-shadow:var(--glow-purple); z-index:10;"></div>
            </div>

            <div id="shardingLog" style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-secondary);">Enter a key to evaluate routes.</div>
        </div>
    `;

    const input = document.getElementById("shardingUserId");
    const btn = document.getElementById("btnRouteShard");
    const dot = document.getElementById("shardDot");
    const log = document.getElementById("shardingLog");

    btn.onclick = () => {
        const key = input.value.trim();
        if (!key) return;

        btn.disabled = true;
        // Reset node highlights
        [0, 1, 2].forEach(idx => document.getElementById(`dbShard${idx}`).classList.remove("active-green"));

        // Compute Simple Hash Route
        let charSum = 0;
        for (let i = 0; i < key.length; i++) {
            charSum += key.charCodeAt(i);
        }
        const shardId = charSum % 3;

        // Path positions
        const rX = 70, sX = 350;
        const rY = 80;
        const sY = [35, 80, 125][shardId];

        dot.style.display = "block";
        dot.style.left = rX + "px";
        dot.style.top = rY + "px";
        log.textContent = `Hashing key "${key}" (UTF8 code sum: ${charSum})...`;

        setTimeout(() => {
            dot.style.left = sX + "px";
            dot.style.top = sY + "px";
            log.textContent = `Computed route: Hash(${key}) % 3 = Shard index ${shardId}. Routing write packet...`;
        }, 600);

        setTimeout(() => {
            document.getElementById(`dbShard${shardId}`).classList.add("active-green");
            dot.style.display = "none";
            log.textContent = `Write completed! Record for "${key}" successfully saved to Shard ${["A", "B", "C"][shardId]}.`;
            btn.disabled = false;
        }, 1300);
    };
}

// 9. Active-Passive Failover Visualizer
function renderActivePassiveVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <button class="flow-button" id="btnCrashPrimary" style="background:var(--accent-orange); color:#0f172a;">Simulate Primary Server Crash</button>
            
            <div style="display:flex; justify-content:space-around; align-items:center; width:100%; max-width:550px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px; padding:20px; position:relative; min-height: 180px;">
                <div class="node-box active-green" id="dbPrimary" style="width:130px; padding:15px; font-size:0.8rem;">
                    <div>Primary DB</div>
                    <div style="font-size:0.65rem; opacity:0.8;">[ACTIVE]</div>
                </div>

                <!-- Heartbeat Link -->
                <div id="heartbeatLine" style="height: 2px; width: 60px; background: var(--accent-green); box-shadow:var(--glow-green);"></div>

                <div class="node-box" id="dbStandby" style="width:130px; padding:15px; font-size:0.8rem;">
                    <div>Standby DB</div>
                    <div style="font-size:0.65rem; opacity:0.8;">[PASSIVE REPLICA]</div>
                </div>
            </div>

            <div id="failoverLog" style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-secondary); text-align:center;">
                Heartbeat ping is healthy. Replicating logs from Active -> Passive database.
            </div>
        </div>
    `;

    const btn = document.getElementById("btnCrashPrimary");
    const pNode = document.getElementById("dbPrimary");
    const sNode = document.getElementById("dbStandby");
    const hbLine = document.getElementById("heartbeatLine");
    const log = document.getElementById("failoverLog");

    let crashed = false;

    btn.onclick = () => {
        if (crashed) {
            // Reset
            crashed = false;
            btn.textContent = "Simulate Primary Server Crash";
            btn.style.background = "var(--accent-orange)";
            pNode.className = "node-box active-green";
            pNode.innerHTML = `<div>Primary DB</div><div style="font-size:0.65rem; opacity:0.8;">[ACTIVE]</div>`;
            sNode.className = "node-box";
            sNode.innerHTML = `<div>Standby DB</div><div style="font-size:0.65rem; opacity:0.8;">[PASSIVE REPLICA]</div>`;
            hbLine.style.background = "var(--accent-green)";
            hbLine.style.boxShadow = "var(--glow-green)";
            log.textContent = "Heartbeat ping is healthy. Replicating logs from Active -> Passive database.";
            return;
        }

        crashed = true;
        btn.disabled = true;

        // Crash Active
        pNode.classList.remove("active-green");
        pNode.style.borderColor = "red";
        pNode.innerHTML = `<div>Primary DB</div><span style="color:red; font-size:0.7rem; font-weight:800;">CRASHED</span>`;
        hbLine.style.background = "var(--text-muted)";
        hbLine.style.boxShadow = "none";
        log.textContent = "WARNING: Primary heartbeat lost! Initiating health check verification...";

        setTimeout(() => {
            log.textContent = "Failover: Heartbeat timeout confirmed. Promoting Standby database to active...";
            sNode.style.borderColor = "var(--accent-purple)";
        }, 1200);

        setTimeout(() => {
            sNode.className = "node-box active-green";
            sNode.innerHTML = `<div>Standby DB</div><div style="font-size:0.65rem; opacity:0.8; font-weight:800;">[PROMOTED ACTIVE]</div>`;
            log.innerHTML = `<span style="color:var(--accent-green); font-weight:800;">SUCCESS:</span> Automated failover complete. Standby elevated. Network DNS re-routed.`;
            btn.disabled = false;
            btn.textContent = "Revive Primary Database";
            btn.style.background = "var(--gradient-primary)";
        }, 2600);
    };
}

// 10. Observer Design Pattern Visualizer
function renderObserverPatternVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <button class="primary-btn" id="btnEmitObserver">Emit Subject State Event</button>
            
            <div style="display:flex; justify-content:space-around; align-items:center; width:100%; max-width:550px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px; padding:20px; position:relative; min-height: 200px;">
                <div class="node-box" id="obsSubject" style="width:100px; height:80px; font-size:0.8rem; border-color:var(--accent-cyan); display:flex; flex-direction:column; justify-content:center; align-items:center;">
                    <strong>Subject</strong>
                    <div style="font-size:0.65rem; color:var(--text-muted);">State = 0</div>
                </div>

                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div class="node-box" id="obsNode0" style="width:130px; font-size:0.75rem; padding:6px;">Observer 1 (InvSrv)</div>
                    <div class="node-box" id="obsNode1" style="width:130px; font-size:0.75rem; padding:6px;">Observer 2 (PaySrv)</div>
                    <div class="node-box" id="obsNode2" style="width:130px; font-size:0.75rem; padding:6px;">Observer 3 (ShipSrv)</div>
                </div>
            </div>
            
            <div id="observerLog" style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-secondary);">Subject maintains a list of references to update.</div>
        </div>
    `;

    const btn = document.getElementById("btnEmitObserver");
    const sub = document.getElementById("obsSubject");
    const log = document.getElementById("observerLog");
    let stateVal = 0;

    btn.onclick = () => {
        btn.disabled = true;
        stateVal++;
        sub.querySelector("div").textContent = `State = ${stateVal}`;
        sub.classList.add("active");
        log.textContent = `Subject state updated to ${stateVal}. Executing notifyObservers()...`;

        // Pulse observers sequentially
        [0, 1, 2].forEach(idx => {
            setTimeout(() => {
                const node = document.getElementById(`obsNode${idx}`);
                node.classList.add("active-green");
                node.textContent = `Observer ${idx + 1} (Received: ${stateVal})`;
            }, 500 + idx * 300);
        });

        setTimeout(() => {
            sub.classList.remove("active");
            [0, 1, 2].forEach(idx => document.getElementById(`obsNode${idx}`).classList.remove("active-green"));
            log.textContent = "All observers updated dynamically with loose coupling.";
            btn.disabled = false;
        }, 2000);
    };
}

// 11. Security Architecture (JWT Structure Visualizer)
function renderJwtVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid" style="align-items: stretch;">
            <div style="flex:1; background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:8px; padding:20px;">
                <h4 style="font-size:0.9rem; font-weight:800; margin-bottom:10px; color:var(--text-muted);">JSON WEB TOKEN</h4>
                <div style="font-family:var(--font-mono); font-size:0.8rem; word-break:break-all; line-height:1.8;">
                    <span id="jwtHeader" style="color:#ef4444; font-weight:700; cursor:pointer; padding:2px;">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9</span>.<span id="jwtPayload" style="color:#3b82f6; font-weight:700; cursor:pointer; padding:2px;">eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkplcmljIiwiYWRtaW4iOnRydWV9</span>.<span id="jwtSignature" style="color:#eab308; font-weight:700; cursor:pointer; padding:2px;">SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c</span>
                </div>
                <div style="margin-top:15px; font-size:0.75rem; color:var(--text-secondary);">
                    💡 <em>Tip:</em> Hover over the colored token segments to decode the JSON components in real-time.
                </div>
            </div>
            
            <div style="flex:1; background:var(--code-bg); border:1px solid var(--border); border-radius:8px; padding:20px; font-family:var(--font-mono); font-size:0.8rem;">
                <h4 id="jwtDecodeTitle" style="color:var(--text-primary); font-size:0.85rem; margin-bottom:8px; border-bottom:1px solid var(--border); padding-bottom:6px;">Decoded Output</h4>
                <pre id="jwtDecodeBody" style="background:none; border:none; padding:0; font-size:0.75rem; color:var(--text-secondary);"></pre>
            </div>
        </div>
    `;

    const body = document.getElementById("jwtDecodeBody");
    const title = document.getElementById("jwtDecodeTitle");

    const headerHover = () => {
        title.style.color = "#ef4444";
        title.textContent = "Header (Algorithm & Type)";
        body.textContent = JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2);
    };

    const payloadHover = () => {
        title.style.color = "#3b82f6";
        title.textContent = "Payload (Claims / Data)";
        body.textContent = JSON.stringify({ sub: "1234567890", name: "Jeric", admin: true }, null, 2);
    };

    const sigHover = () => {
        title.style.color = "#eab308";
        title.textContent = "Signature (Verified integrity)";
        body.textContent = "HMACSHA256(\n  base64UrlEncode(header) + \".\" +\n  base64UrlEncode(payload),\n  your-256-bit-secret\n)";
    };

    document.getElementById("jwtHeader").onmouseenter = headerHover;
    document.getElementById("jwtPayload").onmouseenter = payloadHover;
    document.getElementById("jwtSignature").onmouseenter = sigHover;

    payloadHover(); // default load
}

// 12. Cloud Service Calculator / Mapper
function renderCloudCalculator() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; width:100%; max-width: 480px; margin-bottom:15px;">
                <button class="flow-button" id="btnCloudCompute" style="font-size:0.75rem; padding:8px;">Compute (VMs)</button>
                <button class="flow-button" id="btnCloudServerless" style="font-size:0.75rem; padding:8px; background:var(--surface); color:#fff;">Serverless</button>
                <button class="flow-button" id="btnCloudDB" style="font-size:0.75rem; padding:8px; background:var(--surface); color:#fff;">NoSQL Storage</button>
            </div>
            
            <div style="width:100%; max-width: 480px; background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:8px; padding:20px; display:flex; flex-direction:column; gap:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-light); padding-bottom:6px;">
                    <strong style="width:100px;">AWS:</strong>
                    <span id="mapAws" style="color:var(--accent-cyan); font-weight:800; font-family:var(--font-mono);">EC2</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-light); padding-bottom:6px;">
                    <strong style="width:100px;">GCP:</strong>
                    <span id="mapGcp" style="color:var(--accent-purple); font-weight:800; font-family:var(--font-mono);">Compute Engine</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="width:100px;">Azure:</strong>
                    <span id="mapAzure" style="color:var(--accent-green); font-weight:800; font-family:var(--font-mono);">Virtual Machines</span>
                </div>
            </div>
        </div>
    `;

    const aws = document.getElementById("mapAws");
    const gcp = document.getElementById("mapGcp");
    const az = document.getElementById("mapAzure");

    const bComp = document.getElementById("btnCloudCompute");
    const bServ = document.getElementById("btnCloudServerless");
    const bDb = document.getElementById("btnCloudDB");

    const setHighlight = (btn, aVal, gVal, azVal) => {
        [bComp, bServ, bDb].forEach(b => {
            b.style.background = "var(--surface)";
            b.style.color = "#fff";
        });
        btn.style.background = "var(--gradient-primary)";
        btn.style.color = "#0f172a";

        aws.textContent = aVal;
        gcp.textContent = gVal;
        az.textContent = azVal;
    };

    bComp.onclick = () => setHighlight(bComp, "EC2 Instances", "Compute Engine", "Virtual Machines");
    bServ.onclick = () => setHighlight(bServ, "Lambda Functions", "Cloud Functions", "Azure Functions");
    bDb.onclick = () => setHighlight(bDb, "DynamoDB (Key-Value)", "Firestore / Bigtable", "Cosmos DB");

    bComp.onclick(); // default load
}

// 13. Case Studies Selector Visualizer
function renderCaseStudiesSelector() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-bottom:10px;">
                <button class="flow-button" id="btnCsFacebook" style="font-size:0.75rem; padding:8px 12px;">Facebook News Feed</button>
                <button class="flow-button" id="btnCsUber" style="font-size:0.75rem; padding:8px 12px; background:var(--surface); color:#fff;">Uber Dispatch</button>
                <button class="flow-button" id="btnCsNetflix" style="font-size:0.75rem; padding:8px 12px; background:var(--surface); color:#fff;">Netflix Resilience</button>
            </div>
            
            <div id="caseStudyBlueprint" style="width:100%; max-width: 520px; background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:8px; padding:20px; min-height: 200px;">
                <!-- Dynamically loaded blueprint markup -->
            </div>
        </div>
    `;

    const bFacebook = document.getElementById("btnCsFacebook");
    const bUber = document.getElementById("btnCsUber");
    const bNetflix = document.getElementById("btnCsNetflix");
    const bp = document.getElementById("caseStudyBlueprint");

    const showFacebook = () => {
        bFacebook.style.background = "var(--gradient-primary)";
        bFacebook.style.color = "#0f172a";
        bUber.style.background = "var(--surface)";
        bUber.style.color = "#fff";
        bNetflix.style.background = "var(--surface)";
        bNetflix.style.color = "#fff";

        bp.innerHTML = `
            <h4 style="color:var(--accent-cyan); font-size:0.95rem; margin-bottom:8px;">Facebook feed delivery optimization</h4>
            <div class="uml-text-box" style="margin: 10px 0; font-size:0.75rem;">
[User Post Action]
    |
    v (Follower Check)
    +---> Follower Count < 20,000  ==>  [Push (Fan-out-on-Write)] ==> Appends to followers' active caches.
    +---> Follower Count >= 20,000 ==>  [Pull (Fan-out-on-Read)]  ==> Follower merges on-demand when loading feed.
            </div>
            <p style="font-size:0.8rem; color:var(--text-secondary);">
                Avoids write amplification: if a user with 50 million followers posts, pushing to all followers' feeds breaks databases. Hybrid push/pull solves this.
            </p>
        `;
    };

    const showUber = () => {
        bUber.style.background = "var(--gradient-primary)";
        bUber.style.color = "#0f172a";
        bFacebook.style.background = "var(--surface)";
        bFacebook.style.color = "#fff";
        bNetflix.style.background = "var(--surface)";
        bNetflix.style.color = "#fff";

        bp.innerHTML = `
            <h4 style="color:var(--accent-purple); font-size:0.95rem; margin-bottom:8px;">Uber Dispatch Hexagonal Spatial Indices</h4>
            <div class="uml-text-box" style="margin: 10px 0; font-size:0.75rem;">
[Rider Coordinates] ---> H3 Library maps coord to Hexagon index (e.g. 88308552b5fffff)
                               |
                               v
                     Query H3 Index database
                               |
                               v
[Drivers in same Hexagon] <----+----> [Match Algorithm routes Dispatch offer]
            </div>
            <p style="font-size:0.8rem; color:var(--text-secondary);">
                Uber uses the open-source H3 library to index locations into hexagons, reducing distance calculations to simple hash keys in-memory.
            </p>
        `;
    };

    const showNetflix = () => {
        bNetflix.style.background = "var(--gradient-primary)";
        bNetflix.style.color = "#0f172a";
        bFacebook.style.background = "var(--surface)";
        bFacebook.style.color = "#fff";
        bUber.style.background = "var(--surface)";
        bUber.style.color = "#fff";

        bp.innerHTML = `
            <h4 style="color:var(--accent-green); font-size:0.95rem; margin-bottom:8px;">Netflix global video edge architecture</h4>
            <div class="uml-text-box" style="margin: 10px 0; font-size:0.75rem;">
[AWS Control API] ---> Manages search, auth, user profiles, and recommendations.
                              |
                     (Streaming request)
                              v
[Netflix Open Connect Appliance (OCA)] ---> Box embedded inside ISP network. Serves video locally.
            </div>
            <p style="font-size:0.8rem; color:var(--text-secondary);">
                Instead of serving videos from AWS databases, Netflix installs localized CDN hardware directly inside ISPs, resolving backbone network congestion.
            </p>
        `;
    };

    bFacebook.onclick = showFacebook;
    bUber.onclick = showUber;
    bNetflix.onclick = showNetflix;

    showFacebook(); // default load
}

// 14. Go Concurrency Visualizer
function renderGoConcurrencyVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <button class="primary-btn" id="btnGoSpawn">Spawn Goroutine Worker</button>
            <div style="display:flex; justify-content:space-around; align-items:center; width:100%; max-width:500px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px; padding:20px; min-height: 180px; position:relative;">
                
                <div style="text-align:center;">
                    <div style="font-weight:700; font-size:0.8rem; margin-bottom:6px;">Main Thread</div>
                    <div style="background:var(--surface); padding:10px; border-radius:6px; font-family:var(--font-mono); font-size:0.75rem;">chan <- job</div>
                </div>

                <div style="display:flex; flex-direction:column; gap:8px;" id="goroutineWorkers">
                    <div class="node-box active-green" style="width:140px; font-size:0.75rem; padding:6px;">Runtime Thread 1</div>
                </div>
            </div>
            <div id="goLog" style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-secondary);">Go Scheduler multiplexes goroutines over OS threads.</div>
        </div>
    `;

    const btn = document.getElementById("btnGoSpawn");
    const container = document.getElementById("goroutineWorkers");
    const log = document.getElementById("goLog");
    let grCounter = 1;

    btn.onclick = () => {
        if (container.children.length >= 4) {
            log.textContent = "Threads fully utilized! Goroutines waiting in run queue.";
            return;
        }

        grCounter++;
        const item = document.createElement("div");
        item.className = "node-box active";
        item.style.cssText = "width:140px; font-size:0.75rem; padding:6px; margin-top:4px;";
        item.textContent = `go worker_${grCounter}()`;
        container.appendChild(item);
        log.textContent = `Spawned lightweight goroutine worker #${grCounter} on Go Scheduler loop.`;

        setTimeout(() => {
            item.classList.remove("active");
            item.classList.add("active-green");
            log.textContent = `goroutine #${grCounter} executing in user-space stack (~2KB).`;
        }, 800);

        setTimeout(() => {
            item.remove();
            log.textContent = `goroutine #${grCounter} execution completed. Stack space returned.`;
        }, 2200);
    };
}

// 15. Rust Borrow Checker Simulation
function renderRustBorrowChecker() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <button class="flow-button" id="btnRustSafe">Compile Safe Code</button>
                <button class="flow-button" id="btnRustUnsafe" style="background:var(--accent-orange); color:#0f172a;">Compile Data Race Code</button>
            </div>
            
            <div style="width:100%; max-width: 520px; display:flex; gap:15px; align-items: stretch;">
                <div style="flex:1; background:var(--code-bg); border:1px solid var(--border); border-radius:6px; padding:15px; font-family:var(--font-mono); font-size:0.75rem; min-height: 150px;">
                    <pre id="rustCode" style="margin:0; border:none; padding:0; background:none; white-space:pre-wrap;"></pre>
                </div>
                <div id="rustResultPanel" style="width:160px; border-radius:6px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:10px;">
                    <div id="rustStatus" style="font-size:1.2rem; font-weight:800; margin-bottom:8px;">COMPILING</div>
                    <div id="rustExplanation" style="font-size:0.7rem; color:var(--text-secondary); line-height:1.4;">Checking borrow boundaries...</div>
                </div>
            </div>
        </div>
    `;

    const rCode = document.getElementById("rustCode");
    const rPanel = document.getElementById("rustResultPanel");
    const rStatus = document.getElementById("rustStatus");
    const rExp = document.getElementById("rustExplanation");

    const bSafe = document.getElementById("btnRustSafe");
    const bUnsafe = document.getElementById("btnRustUnsafe");

    bSafe.onclick = () => {
        bSafe.style.background = "var(--gradient-primary)";
        bSafe.style.color = "#0f172a";
        bUnsafe.style.background = "var(--surface)";
        bUnsafe.style.color = "#fff";

        rCode.textContent = "fn main() {\n    let s1 = String::from(\"hello\");\n    let r1 = &s1; // read borrow 1\n    let r2 = &s1; // read borrow 2\n    println!(\"{}, {}\", r1, r2);\n}";
        rPanel.style.background = "rgba(16,185,129,0.15)";
        rPanel.style.border = "1px solid var(--accent-green)";
        rStatus.style.color = "var(--accent-green)";
        rStatus.textContent = "COMPILE OK";
        rExp.textContent = "Borrow Checker permits multiple concurrent read-only references (&T) to the same resource.";
    };

    bUnsafe.onclick = () => {
        bUnsafe.style.background = "var(--accent-orange)";
        bUnsafe.style.color = "#0f172a";
        bSafe.style.background = "var(--surface)";
        bSafe.style.color = "#fff";

        rCode.textContent = "fn main() {\n    let mut s1 = String::from(\"hello\");\n    let r1 = &s1; // read borrow\n    let r2 = &mut s1; // write borrow\n    println!(\"{}\", r1);\n}";
        rPanel.style.background = "rgba(239,68,68,0.15)";
        rPanel.style.border = "1px solid red";
        rStatus.style.color = "red";
        rStatus.textContent = "COMPILE FAIL";
        rExp.textContent = "Error: cannot borrow `s1` as mutable (`&mut T`) because it is also borrowed as immutable (`&T`) in the same scope.";
    };

    bSafe.onclick(); // default load
}

// 16. JS/TS Event Loop Scheduler Visualizer
function renderJsEventLoopVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <button class="primary-btn" id="btnRunLoop">Run Async Code</button>
            
            <div style="display:flex; gap:12px; width:100%; max-width:550px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px; padding:15px; min-height: 200px; font-size:0.75rem;">
                
                <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
                    <div style="font-weight:700; color:#fff; text-align:center; border-bottom:1px solid var(--border-light); padding-bottom:4px;">Call Stack</div>
                    <div id="loopStack" style="flex:1; background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:4px; display:flex; flex-direction:column-reverse; gap:4px; padding:6px;"></div>
                </div>

                <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
                    <div style="font-weight:700; color:var(--accent-cyan); text-align:center; border-bottom:1px solid var(--border-light); padding-bottom:4px;">Microtask (Promises)</div>
                    <div id="loopMicro" style="flex:1; background:rgba(6,182,212,0.05); border:1px solid var(--border); border-radius:4px; display:flex; flex-direction:column; gap:4px; padding:6px;"></div>
                </div>

                <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
                    <div style="font-weight:700; color:var(--accent-orange); text-align:center; border-bottom:1px solid var(--border-light); padding-bottom:4px;">Macrotask (Timers)</div>
                    <div id="loopMacro" style="flex:1; background:rgba(249,115,22,0.05); border:1px solid var(--border); border-radius:4px; display:flex; flex-direction:column; gap:4px; padding:6px;"></div>
                </div>
            </div>
            <div id="loopLog" style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-secondary);">Event loop schedules microtasks before macrotasks.</div>
        </div>
    `;

    const btn = document.getElementById("btnRunLoop");
    const stack = document.getElementById("loopStack");
    const micro = document.getElementById("loopMicro");
    const macro = document.getElementById("loopMacro");
    const log = document.getElementById("loopLog");

    const pushItem = (el, text, color) => {
        const item = document.createElement("div");
        item.style.cssText = `background:${color}; padding:6px; border-radius:4px; color:#0f172a; font-weight:700; font-family:var(--font-mono); font-size:0.7rem; text-align:center;`;
        item.textContent = text;
        el.appendChild(item);
    };

    btn.onclick = () => {
        btn.disabled = true;
        stack.innerHTML = "";
        micro.innerHTML = "";
        macro.innerHTML = "";
        
        log.textContent = "Executing synchronous script blocks...";
        pushItem(stack, "main()", "var(--text-secondary)");
        
        setTimeout(() => {
            pushItem(stack, "setTimeout()", "var(--accent-orange)");
            pushItem(macro, "Timer Callback()", "rgba(249,115,22,0.7)");
            log.textContent = "Registered setTimeout. Appending Callback to Macrotask queue...";
        }, 600);

        setTimeout(() => {
            stack.lastElementChild.remove(); // Pop setTimeout
            pushItem(stack, "Promise.resolve()", "var(--accent-cyan)");
            pushItem(micro, "Promise Then()", "rgba(6,182,212,0.7)");
            log.textContent = "Registered Promise resolve. Appending handler to Microtask queue...";
        }, 1200);

        setTimeout(() => {
            stack.lastElementChild.remove(); // Pop promise
            stack.lastElementChild.remove(); // Pop main()
            log.textContent = "Call stack is empty. Processing Microtask queue next...";
        }, 1800);

        setTimeout(() => {
            micro.innerHTML = ""; // Pop promise from queue
            pushItem(stack, "Promise Then()", "var(--accent-cyan)");
            log.textContent = "Running Promise handler in call stack.";
        }, 2500);

        setTimeout(() => {
            stack.innerHTML = ""; // Call stack empty again
            log.textContent = "Microtasks cleared. Processing Macrotask queue next...";
        }, 3100);

        setTimeout(() => {
            macro.innerHTML = ""; // Pop timeout from queue
            pushItem(stack, "Timer Callback()", "var(--accent-orange)");
            log.textContent = "Running setTimeout callback in call stack.";
        }, 3800);

        setTimeout(() => {
            stack.innerHTML = "";
            log.textContent = "Execution completed. Event Loop idle.";
            btn.disabled = false;
        }, 4400);
    };
}

// 17. Python GIL Visualizer
function renderPythonGilVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <button class="primary-btn" id="btnRunGil">Start Thread Execution</button>
            
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; max-width:500px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px; padding:20px; min-height: 180px; position:relative;">
                
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div class="node-box" id="gilTh1" style="width:110px; font-size:0.75rem; padding:8px;">Thread 1 (CPU-bound)</div>
                    <div class="node-box" id="gilTh2" style="width:110px; font-size:0.75rem; padding:8px;">Thread 2 (CPU-bound)</div>
                </div>

                <div style="text-align:center;">
                    <div id="gilLock" style="background:var(--surface); border:2px solid var(--accent-orange); color:var(--accent-orange); width:70px; height:70px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; box-shadow:var(--glow-orange); transition: var(--transition-smooth);">GIL FREE</div>
                </div>

                <div class="node-box" id="gilInterpreter" style="width:110px; padding:15px; font-size:0.8rem; border-color:var(--accent-cyan);">Python VM (Interpreter)</div>
            </div>
            
            <div id="gilLog" style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-secondary); text-align:center;">
                Click start to see how GIL schedules execution on multi-threaded python tasks.
            </div>
        </div>
    `;

    const btn = document.getElementById("btnRunGil");
    const th1 = document.getElementById("gilTh1");
    const th2 = document.getElementById("gilTh2");
    const lock = document.getElementById("gilLock");
    const log = document.getElementById("gilLog");

    btn.onclick = () => {
        btn.disabled = true;
        log.textContent = "Threads started. Acquiring Global Interpreter Lock...";

        setTimeout(() => {
            th1.classList.add("active");
            lock.textContent = "GIL HELD";
            lock.style.borderColor = "red";
            lock.style.color = "red";
            lock.style.boxShadow = "0 0 15px rgba(255,0,0,0.2)";
            log.textContent = "Thread 1 holds GIL. Running Python bytecode. Thread 2 is blocked, waiting...";
        }, 600);

        setTimeout(() => {
            th1.classList.remove("active");
            th1.classList.add("active-green");
            lock.textContent = "GIL FREE";
            lock.style.borderColor = "var(--accent-orange)";
            lock.style.color = "var(--accent-orange)";
            lock.style.boxShadow = "var(--glow-orange)";
            log.textContent = "Thread 1 releases lock for Context Switch scheduling...";
        }, 1800);

        setTimeout(() => {
            th2.classList.add("active");
            lock.textContent = "GIL HELD";
            lock.style.borderColor = "red";
            lock.style.color = "red";
            lock.style.boxShadow = "0 0 15px rgba(255,0,0,0.2)";
            log.textContent = "Thread 2 acquires GIL and starts executing. Thread 1 is now waiting.";
        }, 2400);

        setTimeout(() => {
            th2.classList.remove("active");
            th2.classList.add("active-green");
            lock.textContent = "GIL FREE";
            lock.style.borderColor = "var(--accent-orange)";
            lock.style.color = "var(--accent-orange)";
            lock.style.boxShadow = "var(--glow-orange)";
            log.textContent = "Thread 2 completes processing. GIL released.";
        }, 3600);

        setTimeout(() => {
            th1.classList.remove("active-green");
            th2.classList.remove("active-green");
            log.textContent = "Execution complete. Due to the GIL, Thread 1 and 2 ran sequentially, not concurrently.";
            btn.disabled = false;
        }, 4400);
    };
}

// 18. Monitoring & Observability Visualizer
function renderObservabilityVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="flow-button" id="btnSpikeTraffic" style="background: var(--accent-orange); color: #0f172a;">Simulate Traffic Spike</button>
                <button class="flow-button" id="btnScaleUp" style="background: var(--accent-cyan); color: #0f172a;" disabled>Scale Up Replicas (Mitigate)</button>
                <button class="flow-button" id="btnResetObs" style="background: var(--surface); color: var(--text-primary);">Reset Simulator</button>
            </div>

            <!-- Dashboard Layout -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; width: 100%; margin-bottom: 20px;">
                <div class="metric-card" style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">System Status</div>
                    <div id="obsStatus" style="font-size: 1.25rem; font-weight: 700; color: #10b981; margin-top: 4px;">HEALTHY</div>
                </div>
                <div class="metric-card" style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Throughput</div>
                    <div id="obsThroughput" style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">12 RPS</div>
                </div>
                <div class="metric-card" style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Latency (p99)</div>
                    <div id="obsLatency" style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">45 ms</div>
                </div>
                <div class="metric-card" style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Error Rate</div>
                    <div id="obsErrorRate" style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">0.1%</div>
                </div>
            </div>

            <!-- System Architecture Visualizer -->
            <div style="display: flex; justify-content: space-around; align-items: center; width: 100%; max-width: 550px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 8px; padding: 20px; position: relative; min-height: 180px; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                <div class="node-box active-green" id="obsClient" style="width: 100px; padding: 10px; font-size: 0.75rem;">
                    <div>User Clients</div>
                </div>
                
                <div id="obsLink1" style="height: 2px; width: 40px; background: var(--border); transition: all 0.3s;"></div>

                <div class="node-box active-green" id="obsGateway" style="width: 100px; padding: 10px; font-size: 0.75rem;">
                    <div>API Gateway</div>
                </div>

                <div id="obsLink2" style="height: 2px; width: 40px; background: var(--border); transition: all 0.3s;"></div>

                <div id="obsServiceContainer" style="display: flex; flex-direction: column; gap: 8px;">
                    <div class="node-box active-green" id="obsService1" style="width: 120px; padding: 10px; font-size: 0.75rem; transition: all 0.3s;">
                        <div>Order Srv (v1)</div>
                    </div>
                    <div class="node-box active-green" id="obsService2" style="width: 120px; padding: 10px; font-size: 0.75rem; display: none; transition: all 0.3s;">
                        <div>Order Srv (v2)</div>
                    </div>
                    <div class="node-box active-green" id="obsService3" style="width: 120px; padding: 10px; font-size: 0.75rem; display: none; transition: all 0.3s;">
                        <div>Order Srv (v3)</div>
                    </div>
                </div>
            </div>

            <!-- Active Alerts -->
            <div style="width: 100%; margin-bottom: 20px;">
                <h4 style="margin-bottom: 8px; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">Active Alerts</h4>
                <div id="obsAlertBox" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); color: #10b981; padding: 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">
                    🟢 All system metrics are within SLO thresholds.
                </div>
            </div>

            <!-- Logs and Tracing Console -->
            <div style="width: 100%;">
                <h4 style="margin-bottom: 8px; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">Telemetry Logs & Traces</h4>
                <div id="obsConsole" style="background: #0f172a; border: 1px solid var(--border); border-radius: 6px; padding: 15px; font-family: 'Fira Code', monospace; font-size: 0.75rem; color: #38bdf8; height: 120px; overflow-y: auto; text-align: left; line-height: 1.5;">
                    <div>[INFO] Observability simulator initialized. Waiting for telemetry data...</div>
                </div>
            </div>
        </div>
    `;

    const btnSpike = document.getElementById("btnSpikeTraffic");
    const btnScale = document.getElementById("btnScaleUp");
    const btnReset = document.getElementById("btnResetObs");

    const obsStatus = document.getElementById("obsStatus");
    const obsThroughput = document.getElementById("obsThroughput");
    const obsLatency = document.getElementById("obsLatency");
    const obsErrorRate = document.getElementById("obsErrorRate");

    const obsClient = document.getElementById("obsClient");
    const obsGateway = document.getElementById("obsGateway");
    const obsService1 = document.getElementById("obsService1");
    const obsService2 = document.getElementById("obsService2");
    const obsService3 = document.getElementById("obsService3");

    const obsLink1 = document.getElementById("obsLink1");
    const obsLink2 = document.getElementById("obsLink2");

    const obsAlertBox = document.getElementById("obsAlertBox");
    const obsConsole = document.getElementById("obsConsole");

    function logToConsole(message, type = "info") {
        const div = document.createElement("div");
        let color = "#38bdf8"; // cyan/info
        if (type === "warning") color = "#f97316"; // orange
        if (type === "error") color = "#ef4444"; // red
        if (type === "success") color = "#10b981"; // green
        div.style.color = color;
        div.textContent = message;
        obsConsole.appendChild(div);
        obsConsole.scrollTop = obsConsole.scrollHeight;
    }

    btnSpike.addEventListener("click", () => {
        // Change state to Spiked
        obsStatus.textContent = "CRITICAL";
        obsStatus.style.color = "#ef4444";
        obsThroughput.textContent = "150 RPS";
        obsLatency.textContent = "320 ms";
        obsErrorRate.textContent = "8.5%";

        // Architecture colors
        obsClient.className = "node-box active-green";
        obsGateway.className = "node-box active-orange";
        obsService1.className = "node-box active-red";

        obsLink1.style.background = "var(--accent-orange)";
        obsLink2.style.background = "var(--accent-red)";

        // Alert
        obsAlertBox.style.background = "rgba(239, 68, 68, 0.08)";
        obsAlertBox.style.borderColor = "rgba(239, 68, 68, 0.2)";
        obsAlertBox.style.color = "#ef4444";
        obsAlertBox.innerHTML = `🔴 CRITICAL: Latency SLO Breached (p99 320ms > 200ms target)<br>🔴 CRITICAL: Error Rate SLO Breached (8.5% > 1% target)`;

        // Logs
        obsConsole.innerHTML = "";
        logToConsole(`[\${new Date().toLocaleTimeString()}] [WARNING] GET /orders - HTTP 504 Gateway Timeout (320ms)`, "warning");
        logToConsole(`[\${new Date().toLocaleTimeString()}] [ERROR] Order Srv pool exhausted. Active thread count = 100/100`, "error");
        logToConsole(`[\${new Date().toLocaleTimeString()}] [TRACE] TraceID 0x9f2a: Gateway (320ms) -> OrderSrv (320ms) -> DB Query (Timeout)`, "error");

        btnSpike.disabled = true;
        btnScale.disabled = false;
    });

    btnScale.addEventListener("click", () => {
        // Change state to Scaled
        obsStatus.textContent = "HEALTHY";
        obsStatus.style.color = "#10b981";
        obsThroughput.textContent = "150 RPS";
        obsLatency.textContent = "75 ms";
        obsErrorRate.textContent = "0.2%";

        // Show replica instances
        obsService2.style.display = "block";
        obsService3.style.display = "block";

        // Architecture colors
        obsClient.className = "node-box active-green";
        obsGateway.className = "node-box active-green";
        obsService1.className = "node-box active-green";
        obsService2.className = "node-box active-green";
        obsService3.className = "node-box active-green";

        obsLink1.style.background = "var(--accent-green)";
        obsLink2.style.background = "var(--accent-green)";

        // Alert
        obsAlertBox.style.background = "rgba(16, 185, 129, 0.08)";
        obsAlertBox.style.borderColor = "rgba(16, 185, 129, 0.2)";
        obsAlertBox.style.color = "#10b981";
        obsAlertBox.innerHTML = `🟢 RESOLVED: Replicas scaled. All system metrics returned to normal thresholds.`;

        // Logs
        logToConsole(`[\${new Date().toLocaleTimeString()}] [INFO] Scaling event triggered. Spun up 2 additional instances of Order Service.`, "success");
        logToConsole(`[\${new Date().toLocaleTimeString()}] [INFO] GET /orders - HTTP 200 OK (72ms) - Server ID: order-srv-pod-2`, "success");
        logToConsole(`[\${new Date().toLocaleTimeString()}] [INFO] GET /orders - HTTP 200 OK (68ms) - Server ID: order-srv-pod-3`, "success");

        btnScale.disabled = true;
    });

    btnReset.addEventListener("click", () => {
        // Reset state
        obsStatus.textContent = "HEALTHY";
        obsStatus.style.color = "#10b981";
        obsThroughput.textContent = "12 RPS";
        obsLatency.textContent = "45 ms";
        obsErrorRate.textContent = "0.1%";

        obsService2.style.display = "none";
        obsService3.style.display = "none";

        obsClient.className = "node-box active-green";
        obsGateway.className = "node-box active-green";
        obsService1.className = "node-box active-green";

        obsLink1.style.background = "var(--border)";
        obsLink2.style.background = "var(--border)";

        obsAlertBox.style.background = "rgba(16, 185, 129, 0.08)";
        obsAlertBox.style.borderColor = "rgba(16, 185, 129, 0.2)";
        obsAlertBox.style.color = "#10b981";
        obsAlertBox.innerHTML = `🟢 All system metrics are within SLO thresholds.`;

        obsConsole.innerHTML = `<div>[INFO] Observability simulator reset. Waiting for telemetry data...</div>`;

        btnSpike.disabled = false;
        btnScale.disabled = true;
    });
}

// ==========================================================================
// BOOTSTRAP INITIALIZATION ON PAGE LOAD
// ==========================================================================
// 19. PHP OPcache & JIT Visualizer
function renderPhpOpcacheVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="flow-button" id="btnPhpTokenize" style="background: var(--accent-cyan); color: #0f172a;">1. Tokenize & AST</button>
                <button class="flow-button" id="btnPhpOpcache" style="background: var(--accent-purple); color: #fff;" disabled>2. OPcache Store</button>
                <button class="flow-button" id="btnPhpJit" style="background: var(--accent-orange); color: #0f172a;" disabled>3. JIT Compile</button>
                <button class="flow-button" id="btnPhpReset" style="background: var(--surface); color: var(--text-primary);">Reset</button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; width: 100%; margin-bottom: 20px;">
                <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 15px; border-radius: 8px;">
                    <h4 style="margin-bottom: 10px; font-size: 0.85rem; color: var(--accent-cyan); text-transform: uppercase;">PHP Code Engine</h4>
                    <pre style="margin: 0; font-family: var(--font-mono); font-size: 0.75rem; color: #f8fafc; line-height:1.4;"><code>&lt;?php
function calculate($n) {
    $sum = 0;
    for ($i = 0; $i &lt; $n; $i++) {
        $sum += $i;
    }
    return $sum;
}
echo calculate(10000);
?&gt;</code></pre>
                </div>
                
                <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 15px; border-radius: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 180px; position: relative;">
                    <div id="phpPipelineGraphic" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                        <div class="node-box" id="nodeSource" style="padding: 6px; font-size: 0.75rem; border-color: var(--text-muted); text-align: center;">Source Code</div>
                        <div class="node-box" id="nodeTokens" style="padding: 6px; font-size: 0.75rem; border-color: var(--text-muted); text-align: center;">Tokens & AST</div>
                        <div class="node-box" id="nodeBytecode" style="padding: 6px; font-size: 0.75rem; border-color: var(--text-muted); text-align: center;">Zend Bytecode (OPcache)</div>
                        <div class="node-box" id="nodeJit" style="padding: 6px; font-size: 0.75rem; border-color: var(--text-muted); text-align: center;">JIT Native Machine Code</div>
                    </div>
                </div>
            </div>

            <!-- Memory and Performance Stats -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; width: 100%; margin-bottom: 20px;">
                <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">OPcache Status</div>
                    <div id="opcacheHit" style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-top: 2px;">MISS / INACTIVE</div>
                </div>
                <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Execution Mode</div>
                    <div id="execMode" style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-top: 2px;">INTERPRETER</div>
                </div>
                <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Time taken</div>
                    <div id="execTime" style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">--</div>
                </div>
            </div>

            <div style="width: 100%;">
                <h4 style="margin-bottom: 8px; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">PHP Compilation Console</h4>
                <div id="phpConsole" style="background: #0b0f19; border: 1px solid var(--border); border-radius: 6px; padding: 12px; font-family: var(--font-mono); font-size: 0.75rem; color: #38bdf8; height: 100px; overflow-y: auto; text-align: left; line-height: 1.4;">
                    <div>[Zend Engine v4.x] Ready. Click 'Tokenize & AST' to begin compilation.</div>
                </div>
            </div>
        </div>
    `;

    const btnTokenize = document.getElementById("btnPhpTokenize");
    const btnOpcache = document.getElementById("btnPhpOpcache");
    const btnJit = document.getElementById("btnPhpJit");
    const btnReset = document.getElementById("btnPhpReset");

    const nodeSource = document.getElementById("nodeSource");
    const nodeTokens = document.getElementById("nodeTokens");
    const nodeBytecode = document.getElementById("nodeBytecode");
    const nodeJit = document.getElementById("nodeJit");

    const opcacheHit = document.getElementById("opcacheHit");
    const execMode = document.getElementById("execMode");
    const execTime = document.getElementById("execTime");
    const phpConsole = document.getElementById("phpConsole");

    function log(msg, color = "#38bdf8") {
        const div = document.createElement("div");
        div.style.color = color;
        div.textContent = msg;
        phpConsole.appendChild(div);
        phpConsole.scrollTop = phpConsole.scrollHeight;
    }

    btnTokenize.onclick = () => {
        nodeSource.className = "node-box active-green";
        nodeTokens.className = "node-box active-cyan";
        log("[INFO] Tokenizer complete: generated 42 tokens (T_FUNCTION, T_VARIABLE, T_FOR, etc.)", "#06b6d4");
        log("[INFO] Parser complete: abstract syntax tree built. Node root: AST_FUNC_DECL", "#06b6d4");
        btnTokenize.disabled = true;
        btnOpcache.disabled = false;
    };

    btnOpcache.onclick = () => {
        nodeBytecode.className = "node-box active-purple";
        opcacheHit.textContent = "OPCACHE HIT";
        opcacheHit.style.color = "var(--accent-purple)";
        log("[INFO] Compiler complete: Zend Bytecode generated (ZEND_NOP, ZEND_ASSIGN, ZEND_JMP, ZEND_RETURN)", "var(--accent-purple)");
        log("[SUCCESS] Bytecode cached in shared memory. Next requests will bypass parsing and compilation!", "#10b981");
        btnOpcache.disabled = true;
        btnJit.disabled = false;
    };

    btnJit.onclick = () => {
        nodeJit.className = "node-box active-orange";
        execMode.textContent = "JIT / NATIVE";
        execMode.style.color = "var(--accent-orange)";
        execTime.textContent = "0.14 ms (8.2x faster)";
        log("[INFO] JIT compiler analyzed bytecode. Detected hot loop in calculate()", "var(--accent-orange)");
        log("[INFO] JIT generated native x86 machine instructions for fast CPU execution", "var(--accent-orange)");
        log("[SUCCESS] Execution complete. Result = 49995000", "#10b981");
        btnJit.disabled = true;
    };

    btnReset.onclick = () => {
        nodeSource.className = "node-box";
        nodeTokens.className = "node-box";
        nodeBytecode.className = "node-box";
        nodeJit.className = "node-box";
        opcacheHit.textContent = "MISS / INACTIVE";
        opcacheHit.style.color = "var(--text-muted)";
        execMode.textContent = "INTERPRETER";
        execMode.style.color = "var(--text-muted)";
        execTime.textContent = "--";
        phpConsole.innerHTML = "<div>[Zend Engine v4.x] Ready. Click 'Tokenize & AST' to begin compilation.</div>";
        btnTokenize.disabled = false;
        btnOpcache.disabled = true;
        btnJit.disabled = true;
    };
}

// 20. Laravel Request Lifecycle Visualizer
function renderLaravelLifecycleVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="flow-button" id="btnLaravelNext" style="background: var(--accent-cyan); color: #0f172a;">Next Lifecycle Step</button>
                <button class="flow-button" id="btnLaravelAuto" style="background: var(--accent-green); color: #0f172a;">Auto Play</button>
                <button class="flow-button" id="btnLaravelReset" style="background: var(--surface); color: var(--text-primary);">Reset</button>
            </div>

            <!-- Diagram area -->
            <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; background: rgba(0,0,0,0.25); border: 1px solid var(--border); border-radius: 8px; padding: 15px; min-height: 200px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; position: relative;">
                    <div class="node-box" id="larNode1" style="flex: 1; min-width: 90px; padding: 8px 4px; font-size: 0.7rem; text-align: center;">1. Request Ingress (index.php)</div>
                    <div style="color: var(--text-muted);">&rarr;</div>
                    <div class="node-box" id="larNode2" style="flex: 1; min-width: 90px; padding: 8px 4px; font-size: 0.7rem; text-align: center;">2. HTTP Kernel & Container</div>
                    <div style="color: var(--text-muted);">&rarr;</div>
                    <div class="node-box" id="larNode3" style="flex: 1; min-width: 90px; padding: 8px 4px; font-size: 0.7rem; text-align: center;">3. Service Providers</div>
                    <div style="color: var(--text-muted);">&rarr;</div>
                    <div class="node-box" id="larNode4" style="flex: 1; min-width: 90px; padding: 8px 4px; font-size: 0.7rem; text-align: center;">4. Middleware Stack</div>
                    <div style="color: var(--text-muted);">&rarr;</div>
                    <div class="node-box" id="larNode5" style="flex: 1; min-width: 90px; padding: 8px 4px; font-size: 0.7rem; text-align: center;">5. Router & Controller</div>
                </div>

                <!-- Info Card -->
                <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 12px; margin-top: 15px;" id="laravelStepInfo">
                    <h4 style="color: var(--accent-cyan); font-size: 0.85rem; margin-bottom: 4px;">Step 0: Idle</h4>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">Click 'Next Lifecycle Step' or 'Auto Play' to trace the lifecycle of a Laravel request.</p>
                </div>
            </div>

            <!-- Active Bindings panel -->
            <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 15px; border-radius: 8px; width: 100%;">
                <h4 style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase;">Service Container Bindings</h4>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="laravelBindings">
                    <span style="font-size: 0.7rem; padding: 3px 8px; background: rgba(255,255,255,0.05); border-radius: 4px; color: var(--text-muted);">No active bindings</span>
                </div>
            </div>
        </div>
    `;

    const btnNext = document.getElementById("btnLaravelNext");
    const btnAuto = document.getElementById("btnLaravelAuto");
    const btnReset = document.getElementById("btnLaravelReset");
    const stepInfo = document.getElementById("laravelStepInfo");
    const bindings = document.getElementById("laravelBindings");

    let currentStep = 0;
    let timer = null;

    const steps = [
        {
            title: "Step 1: Request Ingress (public/index.php)",
            desc: "The HTTP request hits public/index.php. Composer's class autoloader is loaded, and then Laravel bootstraps itself, loading environment files and system configurations.",
            activeNodes: [1],
            bindings: ["Illuminate\\Foundation\\Application", "composerAutoloader"]
        },
        {
            title: "Step 2: HTTP Kernel Handshake",
            desc: "The request is passed to the HTTP Kernel (app/Http/Kernel.php). The Kernel bootstraps the core of Laravel, sets up error logging, determines configurations, and initializes the Service Container.",
            activeNodes: [1, 2],
            bindings: ["Illuminate\\Foundation\\Application", "composerAutoloader", "Illuminate\\Contracts\\Http\\Kernel", "request"]
        },
        {
            title: "Step 3: Booting Service Providers",
            desc: "Service Providers are loaded from config/app.php. Laravel boots them by running the register() and boot() methods. This registers route databases, authentication guards, log channels, and database configurations.",
            activeNodes: [2, 3],
            bindings: ["Illuminate\\Foundation\\Application", "composerAutoloader", "Illuminate\\Contracts\\Http\\Kernel", "request", "db", "auth", "router", "view"]
        },
        {
            title: "Step 4: Executing Middleware Pipeline",
            desc: "The request passes through the middleware pipeline. Group middleware (like CheckSession, EncryptCookies, VerifyCsrfToken) validates request properties and handles CSRF validation, session boots, or authentication redirects.",
            activeNodes: [3, 4],
            bindings: ["Illuminate\\Foundation\\Application", "composerAutoloader", "Illuminate\\Contracts\\Http\\Kernel", "request", "db", "auth", "router", "view", "session", "encrypter"]
        },
        {
            title: "Step 5: Router & Controller Response",
            desc: "The Router resolves the URI to a Controller action. The controller executes, fetches models via Eloquent ORM, compiles templates, and returns an HTTP Response object back through the middleware stream to the user.",
            activeNodes: [4, 5],
            bindings: ["Illuminate\\Foundation\\Application", "composerAutoloader", "Illuminate\\Contracts\\Http\\Kernel", "request", "db", "auth", "router", "view", "session", "encrypter", "response"]
        }
    ];

    function renderStep() {
        // Clear active classes
        for (let i = 1; i <= 5; i++) {
            document.getElementById(`larNode${i}`).className = "node-box";
        }

        if (currentStep === 0) {
            stepInfo.innerHTML = `
                <h4 style="color: var(--accent-cyan); font-size: 0.85rem; margin-bottom: 4px;">Step 0: Idle</h4>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">Click 'Next Lifecycle Step' or 'Auto Play' to trace the lifecycle of a Laravel request.</p>
            `;
            bindings.innerHTML = `<span style="font-size: 0.7rem; padding: 3px 8px; background: rgba(255,255,255,0.05); border-radius: 4px; color: var(--text-muted);">No active bindings</span>`;
            return;
        }

        const step = steps[currentStep - 1];
        step.activeNodes.forEach(num => {
            const el = document.getElementById(`larNode${num}`);
            if (num === currentStep) {
                el.className = "node-box active-cyan";
            } else {
                el.className = "node-box active-green";
            }
        });

        stepInfo.innerHTML = `
            <h4 style="color: var(--accent-cyan); font-size: 0.85rem; margin-bottom: 4px;">${step.title}</h4>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">${step.desc}</p>
        `;

        bindings.innerHTML = step.bindings.map(b => `
            <span style="font-size: 0.7rem; padding: 3px 8px; background: rgba(6,182,212,0.15); border:1px solid rgba(6,182,212,0.3); border-radius: 4px; color: #06b6d4; font-weight:700;">${b}</span>
        `).join("");
    }

    btnNext.onclick = () => {
        if (timer) clearInterval(timer);
        currentStep = (currentStep % 5) + 1;
        renderStep();
    };

    btnAuto.onclick = () => {
        if (timer) clearInterval(timer);
        btnAuto.disabled = true;
        currentStep = 1;
        renderStep();
        timer = setInterval(() => {
            if (currentStep < 5) {
                currentStep++;
                renderStep();
            } else {
                clearInterval(timer);
                btnAuto.disabled = false;
            }
        }, 1500);
    };

    btnReset.onclick = () => {
        if (timer) clearInterval(timer);
        currentStep = 0;
        btnAuto.disabled = false;
        renderStep();
    };
}

// 21. Flutter Widget Tree Visualizer
function renderFlutterWidgetTreeVisualizer() {
    visualizerCanvas.innerHTML = `
        <div class="interactive-grid">
            <!-- Mock Flutter App Card -->
            <div style="display: flex; gap: 20px; align-items: flex-start; width: 100%; margin-bottom: 20px; flex-wrap: wrap;">
                <div style="background: #121824; border: 2px solid #02569B; border-radius: 12px; padding: 15px; width: 140px; text-align: center; box-shadow: var(--shadow-md);">
                    <div style="background: #02569B; color:#fff; font-size: 0.65rem; padding: 4px; border-radius: 4px; font-weight:700; margin-bottom: 12px;">Flutter Counter Mock</div>
                    <div style="font-size: 1.5rem; font-weight: 800; color: #fff; margin: 10px 0;" id="flCountVal">0</div>
                    <button class="flow-button" id="btnFlIncrement" style="background: #02569B; color: #fff; border-radius: 50%; width: 36px; height: 36px; padding:0; display:inline-flex; align-items:center; justify-content:center; font-size: 1.25rem; font-weight:800; cursor:pointer;">+</button>
                </div>

                <div style="flex: 1; min-width: 200px;">
                    <h4 style="margin: 0 0 6px 0; font-size: 0.85rem; color: var(--accent-cyan);">Flutter Three-Tree Architecture</h4>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0;">Click the **+** button on the counter widget mock to see how state modification diffs the three trees.</p>
                </div>
            </div>

            <!-- Three Trees columns -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; width: 100%; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 8px; padding: 12px; min-height: 180px;">
                <!-- Column 1: Widget Tree -->
                <div style="display: flex; flex-direction: column; gap: 6px; align-items: center; border-right: 1px dashed var(--border);">
                    <div style="font-size: 0.7rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase;">Widget Tree</div>
                    <div class="node-box" id="wtNode1" style="width: 90%; padding: 4px; font-size: 0.65rem; text-align: center; border-color: #02569B; color:#fff;">MyApp</div>
                    <div class="node-box" id="wtNode2" style="width: 90%; padding: 4px; font-size: 0.65rem; text-align: center; border-color: #02569B; color:#fff;">CounterPage</div>
                    <div class="node-box" id="wtNode3" style="width: 90%; padding: 4px; font-size: 0.65rem; text-align: center; border-color: #02569B; color:#fff;">Text("0")</div>
                </div>

                <!-- Column 2: Element Tree -->
                <div style="display: flex; flex-direction: column; gap: 6px; align-items: center; border-right: 1px dashed var(--border);">
                    <div style="font-size: 0.7rem; font-weight: 700; color: var(--accent-green); text-transform: uppercase;">Element Tree</div>
                    <div class="node-box" id="etNode1" style="width: 90%; padding: 4px; font-size: 0.65rem; text-align: center; border-color: #059669; color:#fff;">StatelessElement</div>
                    <div class="node-box" id="etNode2" style="width: 90%; padding: 4px; font-size: 0.65rem; text-align: center; border-color: #059669; color:#fff;">StatefulElement</div>
                    <div class="node-box" id="etNode3" style="width: 90%; padding: 4px; font-size: 0.65rem; text-align: center; border-color: #059669; color:#fff;">LeafElement</div>
                </div>

                <!-- Column 3: RenderObject Tree -->
                <div style="display: flex; flex-direction: column; gap: 6px; align-items: center;">
                    <div style="font-size: 0.7rem; font-weight: 700; color: var(--accent-orange); text-transform: uppercase;">Render Tree</div>
                    <div class="node-box" id="rtNode1" style="width: 90%; padding: 4px; font-size: 0.65rem; text-align: center; border-color: #ea580c; color:#fff;">RenderView</div>
                    <div class="node-box" id="rtNode2" style="width: 90%; padding: 4px; font-size: 0.65rem; text-align: center; border-color: #ea580c; color:#fff;">RenderConstrainedBox</div>
                    <div class="node-box" id="rtNode3" style="width: 90%; padding: 4px; font-size: 0.65rem; text-align: center; border-color: #ea580c; color:#fff;">RenderParagraph</div>
                </div>
            </div>

            <!-- Console Log -->
            <div style="width: 100%; margin-top: 15px;">
                <div id="flConsole" style="background: #0f172a; border: 1px solid var(--border); border-radius: 6px; padding: 10px; font-family: var(--font-mono); font-size: 0.75rem; color: #38bdf8; height: 80px; overflow-y: auto; text-align: left; line-height: 1.4;">
                    <div>[Flutter Engine] Trees synced and idle. Ready to increment.</div>
                </div>
            </div>
        </div>
    `;

    const btnInc = document.getElementById("btnFlIncrement");
    const countVal = document.getElementById("flCountVal");
    const flConsole = document.getElementById("flConsole");

    const wt3 = document.getElementById("wtNode3");
    const et3 = document.getElementById("etNode3");
    const rt3 = document.getElementById("rtNode3");

    let count = 0;

    function log(msg, color = "#38bdf8") {
        const div = document.createElement("div");
        div.style.color = color;
        div.textContent = msg;
        flConsole.appendChild(div);
        flConsole.scrollTop = flConsole.scrollHeight;
    }

    btnInc.onclick = () => {
        count++;
        countVal.textContent = count;
        wt3.textContent = `Text("${count}")`;
        
        // Phase 1: Mark widget dirty
        wt3.className = "node-box active-cyan";
        log(`[1. WIDGET TREE] state change -> Text widget config updated to Text("${count}")`, "var(--accent-cyan)");

        // Phase 2: Diffing elements
        setTimeout(() => {
            et3.className = "node-box active-green";
            log(`[2. ELEMENT TREE] StatefulElement diffs tree. LeafElement detected dirty config. Updates widget binding reference.`, "var(--accent-green)");
        }, 300);

        // Phase 3: Paint/layout render objects
        setTimeout(() => {
            rt3.className = "node-box active-orange";
            log(`[3. RENDER TREE] RenderParagraph layout boundary marked dirty. Re-evaluating constraints and repainting frame.`, "var(--accent-orange)");
        }, 600);

        // Sync complete
        setTimeout(() => {
            wt3.className = "node-box";
            wt3.style.borderColor = "#02569B";
            et3.className = "node-box";
            et3.style.borderColor = "#059669";
            rt3.className = "node-box";
            rt3.style.borderColor = "#ea580c";
            log(`[FLUTTER SYSTEM] Re-draw complete. Trees are synchronized in-memory.`, "#10b981");
        }, 1200);
    };
}

// ==========================================================================
function bootstrap() {
    initTheme();
    setMode("system-design"); // Defaults to System Design syllabus
    updateGlobalProgress();
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", bootstrap);
} else {
    bootstrap();
}
