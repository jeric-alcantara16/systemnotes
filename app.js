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

// // Task Tracker Filter state
state.trackerSelectedCategory = null;

// DOM ELEMENT REFERENCES
const appSidebar = document.getElementById("appSidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuToggleBtn = document.getElementById("menuToggleBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const breadcrumbs = document.getElementById("breadcrumbs");
const contentContainer = document.getElementById("contentContainer");
const checklistView = document.getElementById("checklistView");

// THEME & CORE INITIALIZATION
function initTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
}

themeToggleBtn.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("sysnotes_theme", state.theme);
    document.documentElement.setAttribute("data-theme", state.theme);
});

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

// Dynamic Sidebar Categories & Filters
function renderSidebarCategories() {
    const container = document.getElementById("dynamicCategoriesContainer");
    if (!container) return;
    container.innerHTML = "";

    // Extract unique categories
    const categories = [];
    state.trackerTasks.forEach(task => {
        if (task.category) {
            const trimmed = task.category.trim();
            if (trimmed && !categories.includes(trimmed)) {
                categories.push(trimmed);
            }
        }
    });

    if (categories.length === 0) {
        container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); padding:4px 12px; font-style:italic;">No categories yet</div>`;
        return;
    }

    categories.forEach(cat => {
        const catItem = document.createElement("a");
        catItem.className = "nav-item";
        catItem.style.cssText = "cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 6px; color: var(--text-secondary); text-decoration: none; font-size: 0.85rem; font-weight: 600; margin-bottom: 2px;";

        const count = state.trackerTasks.filter(t => t.category && t.category.trim() === cat).length;
        const isActive = state.trackerSelectedCategory === cat;
        if (isActive) catItem.classList.add("active");

        catItem.innerHTML = `
            <span># ${cat}</span>
            <span style="font-size: 0.75rem; background: var(--surface); padding: 2px 6px; border-radius: 4px; color: var(--text-muted);">${count}</span>
        `;

        catItem.onclick = () => {
            if (state.trackerSelectedCategory === cat) {
                state.trackerSelectedCategory = null;
                resetSidebarFilterClasses(document.getElementById("filterAll"));
                state.trackerFilterStatus = "All";
                state.trackerFilterPriority = "All";
            } else {
                state.trackerSelectedCategory = cat;
                state.trackerFilterStatus = "All";
                state.trackerFilterPriority = "All";
                resetSidebarFilterClasses(null);
            }
            renderSidebarCategories();
            renderChecklist();
            closeSidebarMobile();
        };

        container.appendChild(catItem);
    });
}

function resetSidebarFilterClasses(activeEl) {
    const filterAll = document.getElementById("filterAll");
    const filterHigh = document.getElementById("filterHigh");
    const filterProgress = document.getElementById("filterProgress");
    const filterDone = document.getElementById("filterDone");

    [filterAll, filterHigh, filterProgress, filterDone].forEach(el => {
        if (el && el === activeEl) {
            el.classList.add("active");
        } else if (el) {
            el.classList.remove("active");
        }
    });

    // Clear active state of category nodes
    if (activeEl) {
        document.querySelectorAll("#dynamicCategoriesContainer .nav-item").forEach(el => el.classList.remove("active"));
    }
}

function setupSidebarFilters() {
    const filterAll = document.getElementById("filterAll");
    const filterHigh = document.getElementById("filterHigh");
    const filterProgress = document.getElementById("filterProgress");
    const filterDone = document.getElementById("filterDone");

    if (filterAll) {
        filterAll.onclick = () => {
            state.trackerFilterStatus = "All";
            state.trackerFilterPriority = "All";
            state.trackerSelectedCategory = null;
            resetSidebarFilterClasses(filterAll);
            renderSidebarCategories();
            renderChecklist();
            closeSidebarMobile();
        };
    }

    if (filterHigh) {
        filterHigh.onclick = () => {
            state.trackerFilterStatus = "All";
            state.trackerFilterPriority = "High";
            state.trackerSelectedCategory = null;
            resetSidebarFilterClasses(filterHigh);
            renderSidebarCategories();
            renderChecklist();
            closeSidebarMobile();
        };
    }

    if (filterProgress) {
        filterProgress.onclick = () => {
            state.trackerFilterStatus = "In Progress";
            state.trackerFilterPriority = "All";
            state.trackerSelectedCategory = null;
            resetSidebarFilterClasses(filterProgress);
            renderSidebarCategories();
            renderChecklist();
            closeSidebarMobile();
        };
    }

    if (filterDone) {
        filterDone.onclick = () => {
            state.trackerFilterStatus = "Completed";
            state.trackerFilterPriority = "All";
            state.trackerSelectedCategory = null;
            resetSidebarFilterClasses(filterDone);
            renderSidebarCategories();
            renderChecklist();
            closeSidebarMobile();
        };
    }
}

// PLANNER CHECKLIST VIEW IMPLEMENTATION
const checklistWrapper = document.getElementById("checklistWrapper");

function renderChecklist() {
    checklistWrapper.innerHTML = "";

    // Safely verify state.trackerTasks
    if (!state.trackerTasks || !Array.isArray(state.trackerTasks)) {
        state.trackerTasks = [];
    }

    renderSidebarCategories();

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

    // Calculate timeframe analytics metrics
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Current week start (Monday) and end (Sunday)
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay; // adjust for Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = sunday.toISOString().split('T')[0];

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
    const weekStats = getTimeframeStats(t => t.dueDate && t.dueDate >= mondayStr && t.dueDate <= sundayStr);
    const monthStats = getTimeframeStats(t => t.dueDate && t.dueDate.startsWith(currentMonthStr));
    const yearStats = getTimeframeStats(t => t.dueDate && t.dueDate.startsWith(currentYearStr));

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

    // 1.5 RENDER TIMEFRAME ANALYTICS GRAPHS ROW
    const analyticsRow = document.createElement("div");
    analyticsRow.style.cssText = "background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:30px; box-shadow:var(--shadow-sm);";
    analyticsRow.innerHTML = `
        <h3 style="font-size:0.9rem; font-weight:800; color:var(--text-primary); margin-bottom:18px; display:flex; align-items:center; gap:8px; text-transform:uppercase; letter-spacing:0.5px;">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            Task Progress Graphs By Timeframe
        </h3>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px;">
            <!-- Day -->
            <div style="background:var(--surface); border:1px solid var(--border-light); border-radius:8px; padding:16px; text-align:center;">
                <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); margin-bottom:10px;">TODAY</div>
                <div style="font-size:1.4rem; font-weight:800; color:var(--accent-cyan); margin-bottom:12px;">${dayStats.completed}/${dayStats.total} <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Done</span></div>
                <div style="height:12px; background:var(--bg-secondary); border-radius:6px; overflow:hidden; border:1px solid var(--border);">
                    <div style="height:100%; width:${dayStats.percent}%; background:linear-gradient(90deg, var(--accent-cyan), var(--accent-green)); transition:width 0.4s ease;"></div>
                </div>
                <div style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-top:8px;">${dayStats.percent}% Completed</div>
            </div>

            <!-- Week -->
            <div style="background:var(--surface); border:1px solid var(--border-light); border-radius:8px; padding:16px; text-align:center;">
                <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); margin-bottom:10px;">THIS WEEK</div>
                <div style="font-size:1.4rem; font-weight:800; color:var(--accent-cyan); margin-bottom:12px;">${weekStats.completed}/${weekStats.total} <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Done</span></div>
                <div style="height:12px; background:var(--bg-secondary); border-radius:6px; overflow:hidden; border:1px solid var(--border);">
                    <div style="height:100%; width:${weekStats.percent}%; background:linear-gradient(90deg, var(--accent-cyan), var(--accent-green)); transition:width 0.4s ease;"></div>
                </div>
                <div style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-top:8px;">${weekStats.percent}% Completed</div>
            </div>

            <!-- Month -->
            <div style="background:var(--surface); border:1px solid var(--border-light); border-radius:8px; padding:16px; text-align:center;">
                <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); margin-bottom:10px;">THIS MONTH</div>
                <div style="font-size:1.4rem; font-weight:800; color:var(--accent-cyan); margin-bottom:12px;">${monthStats.completed}/${monthStats.total} <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Done</span></div>
                <div style="height:12px; background:var(--bg-secondary); border-radius:6px; overflow:hidden; border:1px solid var(--border);">
                    <div style="height:100%; width:${monthStats.percent}%; background:linear-gradient(90deg, var(--accent-cyan), var(--accent-green)); transition:width 0.4s ease;"></div>
                </div>
                <div style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-top:8px;">${monthStats.percent}% Completed</div>
            </div>

            <!-- Year -->
            <div style="background:var(--surface); border:1px solid var(--border-light); border-radius:8px; padding:16px; text-align:center;">
                <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); margin-bottom:10px;">THIS YEAR</div>
                <div style="font-size:1.4rem; font-weight:800; color:var(--accent-cyan); margin-bottom:12px;">${yearStats.completed}/${yearStats.total} <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Done</span></div>
                <div style="height:12px; background:var(--bg-secondary); border-radius:6px; overflow:hidden; border:1px solid var(--border);">
                    <div style="height:100%; width:${yearStats.percent}%; background:linear-gradient(90deg, var(--accent-cyan), var(--accent-green)); transition:width 0.4s ease;"></div>
                </div>
                <div style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-top:8px;">${yearStats.percent}% Completed</div>
            </div>
        </div>
    `;
    checklistWrapper.appendChild(analyticsRow);

    // 2. RENDER ADD TASK INLINE FORM CARD
    const addCard = document.createElement("div");
    addCard.style.cssText = "background:var(--bg-secondary); border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:30px; box-shadow:var(--shadow-sm);";

    addCard.innerHTML = `
        <h3 style="font-size:0.95rem; font-weight:800; color:var(--text-primary); margin-bottom:14px; display:flex; align-items:center; gap:8px;">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Task Tracker
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
        const matchesCategory = !state.trackerSelectedCategory || (task.category && task.category.trim() === state.trackerSelectedCategory);
        return matchesStatus && matchesPriority && matchesCategory;
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
            } else {
                task.status = "Completed";
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
    setupSidebarFilters();
    renderSidebarCategories();
    renderChecklist();
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", bootstrap);
} else {
    bootstrap();
}
