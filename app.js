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
    completedItems: safeJSONParse("sysnotes_completed"),
    checklistState: safeJSONParse("sysnotes_checklist"),
    systems: safeJSONParse("sysnotes_systems", []),
    activeSystemId: localStorage.getItem("sysnotes_active_system_id") || null,
    theme: localStorage.getItem("sysnotes_theme") || "dark"
};

// Cached lookup arrays from lessons.js
let currentLessonsList = [];

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
                showChapter(lesson.id);
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
        breadcrumbs.innerHTML = `<span>Home</span> &nbsp;&raquo;&nbsp; <span>Planner Checklist</span>`;
        state.activeChapterId = null;
        renderChecklist();
    } else if (viewName === "lesson") {
        lessonView.classList.add("active");
    }
}

function showChapter(chapterId) {
    state.activeChapterId = chapterId;
    updateActiveModeData();
    const lesson = currentLessonsList.find(l => l.id === chapterId);
    if (!lesson) return;

    showView("lesson");

    // Highlight active link in sidebar
    document.querySelectorAll(".nav-item").forEach(item => {
        const spanText = item.querySelector("span").textContent;
        if (spanText === lesson.title) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Set Breadcrumbs
    breadcrumbs.innerHTML = `<span>${state.currentMode === "system-design" ? "System Design" : "Languages"}</span> &nbsp;&raquo;&nbsp; <span>${lesson.title}</span>`;

    // Render contents
    lessonBody.innerHTML = lesson.content;
    
    // Configure Visualizer Tab visibility
    const tabVisualizerBtn = document.getElementById("tabVisualizerBtn");
    if (lesson.visualizer) {
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
    renderQuiz(lesson);

    // Setup navigation buttons (Prev / Next)
    const currentIndex = currentLessonsList.findIndex(l => l.id === chapterId);
    if (currentIndex > 0) {
        prevChapterBtn.classList.remove("disabled");
        prevChapterBtn.onclick = () => showChapter(currentLessonsList[currentIndex - 1].id);
    } else {
        prevChapterBtn.classList.add("disabled");
        prevChapterBtn.onclick = null;
    }

    if (currentIndex < currentLessonsList.length - 1) {
        nextChapterBtn.classList.remove("disabled");
        nextChapterBtn.onclick = () => showChapter(currentLessonsList[currentIndex + 1].id);
    } else {
        nextChapterBtn.classList.add("disabled");
        nextChapterBtn.onclick = null;
    }

    // Scroll to top of article
    document.querySelector(".app-main").scrollTop = 0;
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
}

tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        switchTab(btn.getAttribute("data-tab"));
    });
});

// Mode Switching (System Design vs Programming Languages)
function setMode(mode) {
    state.currentMode = mode;
    state.activeChapterId = null;
    
    if (mode === "system-design") {
        btnSystemDesign.classList.add("active");
        btnLanguages.classList.remove("active");
    } else {
        btnSystemDesign.classList.remove("active");
        btnLanguages.classList.add("active");
    }

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
    if (currentLessonsList.length > 0) {
        showChapter(currentLessonsList[0].id);
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

    // If systems is empty or not an array, auto-create a default one
    if (!state.systems || !Array.isArray(state.systems) || state.systems.length === 0) {
        state.systems = [
            { id: "sys_default", name: "Standard Web Service", completedTasks: [], customTasks: [] }
        ];
        state.activeSystemId = "sys_default";
        localStorage.setItem("sysnotes_systems", JSON.stringify(state.systems));
        localStorage.setItem("sysnotes_active_system_id", state.activeSystemId);
    }

    // Sanitize state.systems to guarantee completedTasks and customTasks are arrays
    state.systems.forEach(sys => {
        if (!sys || typeof sys !== 'object') return;
        if (!sys.completedTasks || !Array.isArray(sys.completedTasks)) {
            sys.completedTasks = [];
        }
        if (!sys.customTasks || !Array.isArray(sys.customTasks)) {
            sys.customTasks = [];
        }
    });

    // Ensure activeSystemId is valid
    let activeSystem = state.systems.find(sys => sys && sys.id === state.activeSystemId);
    if (!activeSystem) {
        activeSystem = state.systems[0];
        state.activeSystemId = activeSystem.id;
        localStorage.setItem("sysnotes_active_system_id", state.activeSystemId);
    }

    // Calculate progress for each system
    const systemProgressList = state.systems.map(sys => {
        const baselineTotal = PLANNER_CHECKLIST.reduce((acc, cat) => acc + cat.items.length, 0); // 18
        const customTotal = sys.customTasks ? sys.customTasks.length : 0;
        const total = baselineTotal + customTotal;

        const baselineCompleted = sys.completedTasks ? sys.completedTasks.length : 0;
        const customCompleted = sys.customTasks ? sys.customTasks.filter(t => t.completed).length : 0;
        const completed = baselineCompleted + customCompleted;

        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { sys, percent, completed, total };
    });

    // Overall average percentage
    const overallPercent = systemProgressList.length > 0 
        ? Math.round(systemProgressList.reduce((acc, item) => acc + item.percent, 0) / systemProgressList.length)
        : 0;

    // Render Overall Dashboard
    const dashboard = document.createElement("div");
    dashboard.className = "planner-dashboard";
    dashboard.style.cssText = "background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:24px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px; box-shadow:var(--shadow-md);";
    
    dashboard.innerHTML = `
        <div>
            <h3 style="font-size:1.25rem; font-weight:800; color:var(--text-primary); margin-bottom:6px;">Overall Systems Progress</h3>
            <p style="font-size:0.875rem; color:var(--text-secondary);">Average readiness of all active system designs under planning.</p>
            <div style="margin-top:12px; font-size:0.85rem; color:var(--text-muted);">
                Active Projects: <strong>${state.systems.length}</strong>
            </div>
        </div>
        <div style="display:flex; align-items:center; gap:20px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--surface); border: 4px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; color: var(--accent-cyan); box-shadow: var(--glow-cyan);">
                ${overallPercent}%
            </div>
        </div>
    `;
    checklistWrapper.appendChild(dashboard);

    // Render System Selector & Creator Controls
    const controls = document.createElement("div");
    controls.className = "planner-controls";
    controls.style.cssText = "display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:30px; background:rgba(0,0,0,0.15); border:1px solid var(--border-light); padding:16px; border-radius:10px;";
    
    // Build project selector options
    let selectOptions = "";
    systemProgressList.forEach(item => {
        selectOptions += `<option value="${item.sys.id}" ${item.sys.id === state.activeSystemId ? 'selected' : ''}>${item.sys.name} (${item.percent}%)</option>`;
    });

    controls.innerHTML = `
        <!-- Selector Dropdown -->
        <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:260px;">
            <label style="font-size:0.85rem; font-weight:700; color:var(--text-secondary); white-space:nowrap;">Active System:</label>
            <select id="systemSelector" style="flex:1; background:var(--surface); border:1px solid var(--border); color:var(--text-primary); padding:10px 12px; border-radius:8px; font-family:var(--font-sans); outline:none; font-size:0.9rem; font-weight:600; cursor:pointer;">
                ${selectOptions}
            </select>
        </div>

        <!-- Creator Input -->
        <div style="display:flex; align-items:center; gap:10px; flex:1.2; min-width:280px;">
            <input type="text" id="newSystemName" placeholder="Design a new system (e.g., Chat App)..." style="flex:1; background:var(--surface); border:1px solid var(--border); color:#fff; padding:10px 12px; border-radius:8px; font-size:0.9rem; outline:none; font-family:var(--font-sans);">
            <button class="primary-btn" id="btnCreateSystem" style="padding:10px 16px; font-size:0.85rem; white-space:nowrap;">Create System</button>
        </div>
    `;
    checklistWrapper.appendChild(controls);

    // Selector and Creator Action Listeners
    const selector = controls.querySelector("#systemSelector");
    selector.onchange = (e) => {
        state.activeSystemId = e.target.value;
        localStorage.setItem("sysnotes_active_system_id", state.activeSystemId);
        renderChecklist();
    };

    const createInput = controls.querySelector("#newSystemName");
    const createBtn = controls.querySelector("#btnCreateSystem");
    
    const handleCreate = () => {
        const nameVal = createInput.value.trim();
        if (!nameVal) return;
        const newSys = {
            id: "sys_" + Date.now(),
            name: nameVal,
            completedTasks: [],
            customTasks: []
        };
        state.systems.push(newSys);
        state.activeSystemId = newSys.id;
        localStorage.setItem("sysnotes_systems", JSON.stringify(state.systems));
        localStorage.setItem("sysnotes_active_system_id", state.activeSystemId);
        renderChecklist();
    };

    createBtn.onclick = handleCreate;
    createInput.onkeydown = (e) => { if (e.key === "Enter") handleCreate(); };

    // RENDER ACTIVE SYSTEM CHECKLIST
    const activeProg = systemProgressList.find(item => item.sys.id === state.activeSystemId);
    if (!activeProg) return;
    const sys = activeProg.sys;

    // Active System Header Card
    const headerCard = document.createElement("div");
    headerCard.style.cssText = "display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:20px;";
    headerCard.innerHTML = `
        <div>
            <h2 style="font-size:1.5rem; font-weight:800; color:var(--text-primary); margin:0;">${sys.name} Readiness</h2>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:4px;">
                Task Completion: <strong>${activeProg.completed}/${activeProg.total}</strong> items (${activeProg.percent}%)
            </div>
        </div>
        <button class="secondary-btn" id="btnDeleteSystem" style="padding:8px 14px; font-size:0.8rem; border-color:rgba(239, 68, 68, 0.4); color:#ef4444; background:rgba(239, 68, 68, 0.05);">
            Delete System
        </button>
    `;
    checklistWrapper.appendChild(headerCard);

    // Delete System Listener
    headerCard.querySelector("#btnDeleteSystem").onclick = () => {
        if (state.systems.length <= 1) {
            alert("You must keep at least one active system project.");
            return;
        }
        if (confirm(`Are you sure you want to delete the system "${sys.name}"?`)) {
            state.systems = state.systems.filter(s => s.id !== sys.id);
            state.activeSystemId = state.systems[0].id;
            localStorage.setItem("sysnotes_systems", JSON.stringify(state.systems));
            localStorage.setItem("sysnotes_active_system_id", state.activeSystemId);
            renderChecklist();
        }
    };

    // Add Custom Requirements Form
    const customForm = document.createElement("div");
    customForm.style.cssText = "background:var(--bg-secondary); border:1px solid var(--border-light); border-radius:10px; padding:18px; margin-bottom:28px; box-shadow:var(--shadow-sm);";
    customForm.innerHTML = `
        <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-primary); margin-bottom:10px;">Add Custom Architecture Requirement</h4>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <input type="text" id="customTaskTitle" placeholder="Requirement title (e.g., Setup WebSockets)..." style="flex:1.2; min-width:240px; background:var(--surface); border:1px solid var(--border); color:#fff; padding:8px 12px; border-radius:6px; font-size:0.85rem; outline:none; font-family:var(--font-sans);">
            <input type="text" id="customTaskDesc" placeholder="Brief description (optional)..." style="flex:1.8; min-width:300px; background:var(--surface); border:1px solid var(--border); color:#fff; padding:8px 12px; border-radius:6px; font-size:0.85rem; outline:none; font-family:var(--font-sans);">
            <button class="primary-btn" id="btnAddCustomTask" style="padding:8px 16px; font-size:0.85rem; background:var(--gradient-success); color:#fff; box-shadow:none;">Add Task</button>
        </div>
    `;
    checklistWrapper.appendChild(customForm);

    // Custom Task Add Listener
    const tTitle = customForm.querySelector("#customTaskTitle");
    const tDesc = customForm.querySelector("#customTaskDesc");
    const tBtn = customForm.querySelector("#btnAddCustomTask");

    const handleAddTask = () => {
        const titleVal = tTitle.value.trim();
        if (!titleVal) return;
        const descVal = tDesc.value.trim() || "User defined custom design checklist requirement.";
        
        if (!sys.customTasks) sys.customTasks = [];
        sys.customTasks.push({
            id: "cust_" + Date.now(),
            title: titleVal,
            desc: descVal,
            completed: false
        });

        localStorage.setItem("sysnotes_systems", JSON.stringify(state.systems));
        renderChecklist();
    };
    tBtn.onclick = handleAddTask;
    tDesc.onkeydown = (e) => { if (e.key === "Enter") handleAddTask(); };

    // Render baseline checklist categories
    PLANNER_CHECKLIST.forEach(group => {
        const groupEl = document.createElement("div");
        groupEl.className = "checklist-group";
        groupEl.style.cssText = "background-color:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:24px; margin-bottom:24px; box-shadow:var(--shadow-sm);";
        
        // Calculate items completed for this specific group
        const total = group.items.length;
        const checked = group.items.filter(item => sys.completedTasks.includes(item.id)).length;
        const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

        groupEl.innerHTML = `
            <div class="checklist-group-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-light); padding-bottom:14px; margin-bottom:18px;">
                <span class="checklist-group-title" style="font-weight:700; color:var(--text-primary); font-size:1.1rem;">${group.category}</span>
                <span class="checklist-group-progress" style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">${checked}/${total} Done (${percent}%)</span>
            </div>
            <div class="checklist-items" style="display:flex; flex-direction:column; gap:12px;"></div>
        `;

        const itemsContainer = groupEl.querySelector(".checklist-items");

        group.items.forEach(item => {
            const isChecked = sys.completedTasks.includes(item.id);
            
            const itemEl = document.createElement("div");
            itemEl.className = "checklist-item";
            itemEl.style.cssText = "display:flex; align-items:flex-start; gap:12px; padding:8px 12px; border-radius:6px; cursor:pointer; transition:var(--transition-smooth);";
            
            itemEl.innerHTML = `
                <div class="checklist-checkbox-container ${isChecked ? 'checked' : ''}" style="display:flex; align-items:center; justify-content:center; width:20px; height:20px; border:2px solid var(--border); border-radius:4px; margin-top:2px; cursor:pointer; transition:var(--transition-smooth);">
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="${isChecked ? '#0f172a' : 'currentColor'}" stroke-width="4" fill="none" style="display:${isChecked ? 'block' : 'none'}"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div class="checklist-text-wrapper" style="flex:1;">
                    <div class="checklist-item-title" style="${isChecked ? 'color:var(--text-muted); text-decoration:line-through;' : 'color:var(--text-primary); font-weight:600; font-size:0.95rem;'}">${item.title}</div>
                    <div class="checklist-item-desc" style="font-size:0.85rem; color:var(--text-secondary); margin-top:4px;">${item.desc}</div>
                </div>
            `;

            itemEl.addEventListener("click", (e) => {
                if (isChecked) {
                    sys.completedTasks = sys.completedTasks.filter(tid => tid !== item.id);
                } else {
                    sys.completedTasks.push(item.id);
                }
                localStorage.setItem("sysnotes_systems", JSON.stringify(state.systems));
                renderChecklist();
            });

            itemsContainer.appendChild(itemEl);
        });

        checklistWrapper.appendChild(groupEl);
    });

    // Render Custom Requirements category
    if (sys.customTasks && sys.customTasks.length > 0) {
        const groupEl = document.createElement("div");
        groupEl.className = "checklist-group";
        groupEl.style.cssText = "background-color:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:24px; margin-bottom:24px; box-shadow:var(--shadow-sm);";
        
        const total = sys.customTasks.length;
        const checked = sys.customTasks.filter(t => t.completed).length;
        const percent = Math.round((checked / total) * 100);

        groupEl.innerHTML = `
            <div class="checklist-group-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-light); padding-bottom:14px; margin-bottom:18px;">
                <span class="checklist-group-title" style="font-weight:700; color:var(--accent-purple); font-size:1.1rem;">Custom Architecture Tasks</span>
                <span class="checklist-group-progress" style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">${checked}/${total} Done (${percent}%)</span>
            </div>
            <div class="checklist-items" style="display:flex; flex-direction:column; gap:12px;"></div>
        `;

        const itemsContainer = groupEl.querySelector(".checklist-items");

        sys.customTasks.forEach(item => {
            const isChecked = item.completed;
            
            const itemEl = document.createElement("div");
            itemEl.className = "checklist-item";
            itemEl.style.cssText = "display:flex; align-items:flex-start; gap:12px; padding:8px 12px; border-radius:6px; cursor:pointer; transition:var(--transition-smooth); position:relative;";
            
            itemEl.innerHTML = `
                <div class="checklist-checkbox-container ${isChecked ? 'checked' : ''}" style="display:flex; align-items:center; justify-content:center; width:20px; height:20px; border:2px solid var(--border); border-radius:4px; margin-top:2px; cursor:pointer; transition:var(--transition-smooth);">
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="${isChecked ? '#0f172a' : 'currentColor'}" stroke-width="4" fill="none" style="display:${isChecked ? 'block' : 'none'}"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div class="checklist-text-wrapper" style="flex:1; padding-right:40px;">
                    <div class="checklist-item-title" style="${isChecked ? 'color:var(--text-muted); text-decoration:line-through;' : 'color:var(--text-primary); font-weight:600; font-size:0.95rem;'}">${item.title}</div>
                    <div class="checklist-item-desc" style="font-size:0.85rem; color:var(--text-secondary); margin-top:4px;">${item.desc}</div>
                </div>
                <button class="task-delete-btn" style="position:absolute; right:12px; top:12px; background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.1rem; transition:var(--transition-smooth); line-height:1;">
                    &times;
                </button>
            `;

            // Checkbox Toggling Action
            itemEl.addEventListener("click", (e) => {
                // If they clicked the delete button, don't toggle checkbox
                if (e.target.classList.contains("task-delete-btn")) return;
                
                item.completed = !item.completed;
                localStorage.setItem("sysnotes_systems", JSON.stringify(state.systems));
                renderChecklist();
            });

            // Delete Task Action
            itemEl.querySelector(".task-delete-btn").onclick = (e) => {
                e.stopPropagation();
                sys.customTasks = sys.customTasks.filter(t => t.id !== item.id);
                localStorage.setItem("sysnotes_systems", JSON.stringify(state.systems));
                renderChecklist();
            };

            itemsContainer.appendChild(itemEl);
        });

        checklistWrapper.appendChild(groupEl);
    }
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

// ==========================================================================
// BOOTSTRAP INITIALIZATION ON PAGE LOAD
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
