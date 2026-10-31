/* ==========================================================================
   Rolling Week Running List App - Controller
   ========================================================================== */

// --- App State ---
let state = {
  currentDate: new Date(), // Active date to determine current week
  categories: [],
  dailyHighlights: {}, // Keyed by YYYY-MM-DD
  settings: {
    theme: 'cream',
    gridType: 'dots',
    gridSize: 24,
    gridWidth: 210, // Default open width (7 days * 30px)
    gridShown: true
  }
};

// --- Constant Dimensions & Limits ---
const CELL_WIDTH = 30; // 30px per day column
const GRID_MAX_WIDTH = 210; // 7 columns * 30px
const DRAG_THRESHOLD = 50; // Swipe trigger distance in pixels

// --- DOM References ---
const body = document.body;
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const menuBtn = document.getElementById('menuBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const themeOpts = document.querySelectorAll('.theme-opt');
const gridOpts = document.querySelectorAll('.grid-opt');
const gridDensityInput = document.getElementById('gridDensity');
const gridDensityVal = document.getElementById('gridDensityVal');
const clearAllBtn = document.getElementById('clearAllBtn');
const loadDemoBtn = document.getElementById('loadDemoBtn');

const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const gridToggleBtn = document.getElementById('gridToggleBtn');

const currentWeekRange = document.getElementById('currentWeekRange');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const weeklyCardsContainer = document.getElementById('weeklyCardsContainer');

const boardSlidingWrapper = document.getElementById('boardSlidingWrapper');
const weekMatrixColumn = document.getElementById('weekMatrixColumn');
const weekMatrixBody = document.getElementById('weekMatrixBody');
const boardDividerHandle = document.getElementById('boardDividerHandle');
const taskListColumn = document.getElementById('taskListColumn');
const taskListBody = document.getElementById('taskListBody');

const cellActionMenu = document.getElementById('cellActionMenu');
const inputModal = document.getElementById('inputModal');
const modalTitle = document.getElementById('modalTitle');
const modalInput = document.getElementById('modalInput');
const modalInputLabel = document.getElementById('modalInputLabel');
const colorSelectGroup = document.getElementById('colorSelectGroup');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalSaveBtn = document.getElementById('modalSaveBtn');
const colorDotOpts = document.querySelectorAll('.color-dot-opt');

const gestureHintOverlay = document.getElementById('gestureHintOverlay');
const closeHintBtn = document.getElementById('closeHintBtn');

// Active cell for status selection
let activeMenuCell = null;
// Active modal action context
let modalCallback = null;
let activeCategoryColor = '#ff7b72';

// Drag & Drop State
let draggedItemId = null;
let dragOverItemId = null;

// Gestures State
let isDraggingHandle = false;
let startDragX = 0;
let startGridWidth = 0;
let touchStartX = 0;
let touchStartY = 0;

// --- Helper Functions ---

// Generate Unique IDs
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

// Get Monday of the week for a given date
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(date.setDate(diff));
}

// Format date to YYYY-MM-DD local time string
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date range string
function getWeekRangeString(monday) {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const startMonth = monday.getMonth() + 1;
  const startDay = monday.getDate();
  const endMonth = sunday.getMonth() + 1;
  const endDay = sunday.getDate();
  
  // Get week of the month
  const firstDayOfMonth = new Date(monday.getFullYear(), monday.getMonth(), 1);
  const weekNo = Math.ceil((monday.getDate() + firstDayOfMonth.getDay() - 1) / 7);
  
  return `${monday.getFullYear()}年${startMonth}月 第${weekNo}周 (${startMonth}.${startDay} - ${endMonth}.${endDay})`;
}

// SVG Markings Generator
function getMarkingSVG(status) {
  if (status === 'done') {
    return `<svg viewBox="0 0 24 24">
      <!-- Cross hatch lines -->
      <path d="M 4,6 L 18,20" stroke-width="2" />
      <path d="M 6,4 L 20,18" stroke-width="2" />
      <path d="M 18,4 L 4,18" stroke-width="2" />
      <path d="M 20,6 L 6,20" stroke-width="2" />
    </svg>`;
  } else if (status === 'partial') {
    return `<svg viewBox="0 0 24 24">
      <!-- Single diagonal hatch lines -->
      <path d="M 4,6 L 18,20" stroke-width="2" />
      <path d="M 6,4 L 20,18" stroke-width="2" />
    </svg>`;
  } else if (status === 'migrated') {
    return `<svg viewBox="0 0 24 24">
      <!-- Journal style arrow right -->
      <path d="M 3,12 L 21,12" stroke-width="2.5" />
      <path d="M 14,5 L 21,12 L 14,19" stroke-width="2.5" />
    </svg>`;
  } else if (status === 'cancelled') {
    return `<svg viewBox="0 0 24 24">
      <!-- Big marker X -->
      <path d="M 5,5 L 19,19" stroke-width="2.5" />
      <path d="M 19,5 L 5,19" stroke-width="2.5" />
    </svg>`;
  }
  return '';
}

// --- Data Operations ---

// Save data to localStorage
function saveState() {
  localStorage.setItem('rolling_week_state', JSON.stringify(state));
  calculateProgress();
}

// Load data from localStorage
function loadState() {
  const saved = localStorage.getItem('rolling_week_state');
  if (saved) {
    try {
      state = JSON.parse(saved);
      // Backwards compatibility for new state structure
      if (!state.currentDate) state.currentDate = new Date();
      else state.currentDate = new Date(state.currentDate);
      if (!state.settings) state.settings = {};
      if (state.settings.gridWidth === undefined) state.settings.gridWidth = GRID_MAX_WIDTH;
      if (state.settings.gridShown === undefined) state.settings.gridShown = true;
    } catch (e) {
      console.error('Error loading saved state, loading demo data.', e);
      loadDemoData();
    }
  } else {
    loadDemoData();
  }
  applySettings();
}

// Load Demo Data
function loadDemoData() {
  state.categories = [
    {
      id: 'cat_work',
      title: '🚀 核心工作 (Work)',
      color: '#2f80ed',
      tasks: [
        {
          id: 'task_report',
          text: '撰写Q3业务复盘及战略规划汇报',
          completed: false,
          collapsed: false,
          days: { 0: 'done', 1: 'partial', 4: 'migrated' },
          subtasks: [
            { id: 'sub_metrics', text: '收集上季度销售及转化指标', completed: true, days: { 0: 'done' }, subtasks: [] },
            { id: 'sub_slides', text: '设计Keynote汇报模版及大纲', completed: false, days: { 1: 'partial' }, subtasks: [] },
            { id: 'sub_finance', text: '对齐财务部下季度预算配额', completed: false, days: { 4: 'migrated' }, subtasks: [] }
          ]
        },
        {
          id: 'task_review',
          text: '处理团队内部代码合并请求 (Code Review)',
          completed: true,
          collapsed: false,
          days: { 2: 'done' },
          subtasks: []
        }
      ]
    },
    {
      id: 'cat_personal',
      title: '🧘 个人成长 (Growth)',
      color: '#9b51e0',
      tasks: [
        {
          id: 'task_reading',
          text: '研读《原子习惯》第二章节并做摘录',
          completed: false,
          collapsed: false,
          days: { 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'none' },
          subtasks: []
        },
        {
          id: 'task_meditation',
          text: '清晨冥想自我觉察 15 分钟',
          completed: false,
          collapsed: false,
          days: { 0: 'done', 1: 'done', 2: 'cancelled', 3: 'done' },
          subtasks: []
        }
      ]
    },
    {
      id: 'cat_health',
      title: '💪 健康与运动 (Health)',
      color: '#27ae60',
      tasks: [
        {
          id: 'task_workout',
          text: '健身房力量训练 (胸/肩推举日)',
          completed: false,
          collapsed: false,
          days: { 1: 'done', 3: 'done', 5: 'none' },
          subtasks: []
        },
        {
          id: 'task_water',
          text: '每日足量饮水达到 2L',
          completed: false,
          collapsed: false,
          days: { 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'none', 6: 'none' },
          subtasks: []
        }
      ]
    }
  ];
  
  // Add some demo highlights
  const monday = getMonday(state.currentDate);
  const mKey = formatDateKey(monday);
  const tKey = formatDateKey(new Date(new Date(monday).setDate(monday.getDate() + 1)));
  const wKey = formatDateKey(new Date(new Date(monday).setDate(monday.getDate() + 2)));
  
  state.dailyHighlights[mKey] = "今天重点是Q3规划。上午收集了数据，下午去医院拿了体检报告，无大碍。";
  state.dailyHighlights[tKey] = "健身房练胸推，状态极佳，1RM重量有所突破！";
  state.dailyHighlights[wKey] = "冥想被打断了。今天Code Review耽误了一些时间。";
  
  state.settings = {
    theme: 'cream',
    gridType: 'dots',
    gridSize: 24,
    gridWidth: 210,
    gridShown: true
  };
  
  saveState();
  applySettings();
}

// Apply settings to the DOM
function applySettings() {
  // Theme
  body.className = '';
  body.classList.add(`theme-${state.settings.theme}`);
  
  // Grid type
  body.classList.add(`grid-${state.settings.gridType}`);
  
  // Grid size
  document.documentElement.style.setProperty('--grid-size', `${state.settings.gridSize}px`);
  gridDensityInput.value = state.settings.gridSize;
  gridDensityVal.innerText = `${state.settings.gridSize}px`;
  
  // Update sidebar selectors
  document.querySelectorAll('.theme-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === state.settings.theme);
  });
  document.querySelectorAll('.grid-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.grid === state.settings.gridType);
  });
  
  // Week grid size/shown state
  updateGridWidthDOM();
}

// Update the sliding board width DOM variables
function updateGridWidthDOM() {
  const widthVal = state.settings.gridShown ? state.settings.gridWidth : 0;
  boardSlidingWrapper.style.setProperty('--week-width', `${widthVal}px`);
  
  if (state.settings.gridShown) {
    boardSlidingWrapper.classList.remove('grid-hidden');
    gridToggleBtn.classList.add('active');
    gridToggleBtn.querySelector('.label').innerText = '隐藏周标记';
  } else {
    boardSlidingWrapper.classList.add('grid-hidden');
    gridToggleBtn.classList.remove('active');
    gridToggleBtn.querySelector('.label').innerText = '显示周标记';
  }
}

// Calculate weekly stats
function calculateProgress() {
  let totalTasks = 0;
  let completedTasks = 0;
  
  function countTasks(tasksList) {
    tasksList.forEach(t => {
      totalTasks++;
      if (t.completed) {
        completedTasks++;
      } else {
        // If not completed generally, check if there is a 'done' mark on any day of this week
        const hasDoneDay = Object.values(t.days).some(status => status === 'done');
        if (hasDoneDay) completedTasks++;
      }
      if (t.subtasks && t.subtasks.length > 0) {
        countTasks(t.subtasks);
      }
    });
  }
  
  state.categories.forEach(c => countTasks(c.tasks));
  
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  progressText.innerText = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;
}

// --- Layout & Rendering ---

// Flatten nested tasks to a sequential array for aligned rendering
function getFlatRows() {
  const rows = [];
  
  function recurseTasks(tasksList, parentArray, categoryId, level = 1) {
    tasksList.forEach((task, idx) => {
      rows.push({
        type: 'task',
        id: task.id,
        text: task.text,
        completed: task.completed,
        days: task.days || {},
        level: level,
        collapsed: task.collapsed || false,
        taskRef: task,
        parentArray: parentArray,
        categoryId: categoryId,
        hasSubtasks: task.subtasks && task.subtasks.length > 0
      });
      
      if (task.subtasks && task.subtasks.length > 0 && !task.collapsed) {
        recurseTasks(task.subtasks, task.subtasks, categoryId, level + 1);
      }
    });
  }
  
  state.categories.forEach(category => {
    // Add category row
    rows.push({
      type: 'category',
      id: category.id,
      title: category.title,
      color: category.color,
      categoryRef: category
    });
    
    // Add tasks recursively
    recurseTasks(category.tasks, category.tasks, category.id, 1);
  });
  
  return rows;
}

// Render the weekly cards (highlights)
function renderWeeklyHighlights() {
  const monday = getMonday(state.currentDate);
  currentWeekRange.innerText = getWeekRangeString(monday);
  
  weeklyCardsContainer.innerHTML = '';
  const weekdays = ['一 Mon', '二 Tue', '三 Wed', '四 Thu', '五 Fri', '六 Sat', '日 Sun'];
  const todayKey = formatDateKey(new Date());
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);
    const dateKey = formatDateKey(currentDate);
    const isToday = dateKey === todayKey;
    
    const noteContent = state.dailyHighlights[dateKey] || '';
    
    const card = document.createElement('div');
    card.className = `day-card ${isToday ? 'today' : ''}`;
    
    card.innerHTML = `
      <div class="day-card-header">
        <span>${weekdays[i]}</span>
        <span class="day-num">${currentDate.getDate()}</span>
      </div>
      <div class="day-card-content" contenteditable="true" data-date="${dateKey}" placeholder="记录今日要点...">
        ${noteContent}
      </div>
    `;
    
    // Listen to changes to save note content
    const contentDiv = card.querySelector('.day-card-content');
    contentDiv.addEventListener('blur', (e) => {
      const text = e.target.innerText.trim();
      const date = e.target.dataset.date;
      if (text) {
        state.dailyHighlights[date] = text;
      } else {
        delete state.dailyHighlights[date];
      }
      saveState();
    });
    
    weeklyCardsContainer.appendChild(card);
  }
}

// Render both columns (Week Matrix and Task List) in sync
function renderBoard() {
  const flatRows = getFlatRows();
  
  // 1. Render matrix dates in the header
  const monday = getMonday(state.currentDate);
  const dayHeaderCells = weekMatrixColumn.querySelectorAll('.matrix-cell-header');
  dayHeaderCells.forEach((cell, idx) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + idx);
    // Find sub-span or create
    let subSpan = cell.querySelector('.sub-day');
    const dayStr = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx];
    cell.innerHTML = `${dayDate.getDate()}<span class="sub-day">${dayStr}</span>`;
  });
  
  // 2. Clear bodies
  weekMatrixBody.innerHTML = '';
  taskListBody.innerHTML = '';
  
  if (flatRows.length === 0) {
    taskListBody.innerHTML = `<div class="empty-state">点击“新建项目”开始写手帐吧！✏️</div>`;
    return;
  }
  
  // 3. Populate rows
  flatRows.forEach((row, rowIndex) => {
    if (row.type === 'category') {
      // Create Category Header for Task List
      const taskRow = document.createElement('div');
      taskRow.className = 'row-wrapper category-row';
      taskRow.dataset.index = rowIndex;
      taskRow.dataset.id = row.id;
      taskRow.innerHTML = `
        <div class="row-task-content">
          <div class="category-header" style="--category-color: ${row.color}; --category-border: ${row.color}33;">
            <span class="category-color-bar"></span>
            <span class="category-title-text" data-id="${row.id}">${row.title}</span>
            <div class="row-actions">
              <button class="icon-btn row-action-btn add-task-btn" title="在该项目添加任务">+</button>
              <button class="icon-btn row-action-btn edit-cat-btn" title="编辑分类">✏️</button>
              <button class="icon-btn row-action-btn delete-cat-btn" title="删除分类">×</button>
            </div>
          </div>
        </div>
      `;
      taskListBody.appendChild(taskRow);
      
      // Create Matching Row for Week Matrix
      const matrixRow = document.createElement('div');
      matrixRow.className = 'row-wrapper category-row';
      matrixRow.innerHTML = `
        <div class="row-cells-container">
          <div class="day-cell cell-category"></div>
          <div class="day-cell cell-category"></div>
          <div class="day-cell cell-category"></div>
          <div class="day-cell cell-category"></div>
          <div class="day-cell cell-category"></div>
          <div class="day-cell cell-category"></div>
          <div class="day-cell cell-category"></div>
        </div>
      `;
      weekMatrixBody.appendChild(matrixRow);
      
    } else if (row.type === 'task') {
      // Create Task Row for Task List
      const taskRow = document.createElement('div');
      taskRow.className = `row-wrapper indent-${Math.min(row.level - 1, 4)}`;
      taskRow.dataset.index = rowIndex;
      taskRow.dataset.id = row.id;
      taskRow.draggable = true;
      
      const isCompleted = row.completed ? 'task-completed' : '';
      
      taskRow.innerHTML = `
        <div class="row-task-content">
          <div class="task-item-inner ${isCompleted}">
            <div class="drag-handle">⋮⋮</div>
            ${row.hasSubtasks ? 
              `<span class="collapse-toggle ${row.collapsed ? 'collapsed' : ''}">▼</span>` : 
              `<span class="collapse-toggle" style="visibility: hidden;">▼</span>`
            }
            <span class="task-bullet"></span>
            <span class="task-text-span" contenteditable="true" data-id="${row.id}" placeholder="输入任务...">
              ${row.text}
            </span>
            <div class="row-actions">
              <button class="icon-btn row-action-btn toggle-complete-btn" title="标记完成/未完成">✓</button>
              <button class="icon-btn row-action-btn add-subtask-btn" title="添加子任务">＋</button>
              <button class="icon-btn row-action-btn highlight-task-btn" title="荧光笔标记">🖊️</button>
              <button class="icon-btn row-action-btn delete-task-btn" title="删除">×</button>
            </div>
          </div>
        </div>
      `;
      taskListBody.appendChild(taskRow);
      
      // Bind Edit listeners on task contenteditable
      const textSpan = taskRow.querySelector('.task-text-span');
      textSpan.addEventListener('blur', (e) => {
        const newText = e.target.innerText.trim();
        if (newText !== row.text) {
          row.taskRef.text = newText;
          saveState();
        }
      });
      // Prevent enter key from creating linebreaks, instead commit change
      textSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          textSpan.blur();
        }
      });
      
      // Create Matching Row for Week Matrix
      const matrixRow = document.createElement('div');
      matrixRow.className = 'row-wrapper';
      matrixRow.dataset.index = rowIndex;
      matrixRow.dataset.id = row.id;
      
      let cellsHTML = '<div class="row-cells-container">';
      for (let day = 0; day < 7; day++) {
        const status = row.days[day] || 'none';
        const svgContent = getMarkingSVG(status);
        cellsHTML += `
          <div class="day-cell" data-task-id="${row.id}" data-day="${day}">
            ${svgContent}
          </div>
        `;
      }
      cellsHTML += '</div>';
      matrixRow.innerHTML = cellsHTML;
      weekMatrixBody.appendChild(matrixRow);
    }
  });
  
  // Sync scrolling container heights if needed, but fixed heights keep them aligned.
  // Add listeners to bind hover effects in both columns
  setupHoverSync();
  setupDragAndDrop();
}

// Sync hovers between the matrix body and task list body
function setupHoverSync() {
  const syncHover = (selector, activeClass) => {
    const containers = [weekMatrixBody, taskListBody];
    containers.forEach(container => {
      container.addEventListener('mouseover', (e) => {
        const row = e.target.closest('.row-wrapper');
        if (!row) return;
        const index = row.dataset.index;
        
        // Highlight matching row in the other list
        const matchRow1 = weekMatrixBody.querySelector(`.row-wrapper[data-index="${index}"]`);
        const matchRow2 = taskListBody.querySelector(`.row-wrapper[data-index="${index}"]`);
        if (matchRow1) matchRow1.classList.add('row-hover');
        if (matchRow2) matchRow2.classList.add('row-hover');
      });
      
      container.addEventListener('mouseout', (e) => {
        const row = e.target.closest('.row-wrapper');
        if (!row) return;
        const index = row.dataset.index;
        
        const matchRow1 = weekMatrixBody.querySelector(`.row-wrapper[data-index="${index}"]`);
        const matchRow2 = taskListBody.querySelector(`.row-wrapper[data-index="${index}"]`);
        if (matchRow1) matchRow1.classList.remove('row-hover');
        if (matchRow2) matchRow2.classList.remove('row-hover');
      });
    });
  };
  
  syncHover();
}

// --- Drag and Drop Task Reordering ---
function setupDragAndDrop() {
  const rows = taskListBody.querySelectorAll('.row-wrapper[draggable="true"]');
  
  rows.forEach(row => {
    row.addEventListener('dragstart', (e) => {
      draggedItemId = row.dataset.id;
      row.classList.add('dragging');
      // Create ghost image or set text data
      e.dataTransfer.setData('text/plain', draggedItemId);
      e.dataTransfer.effectAllowed = 'move';
      
      // Add visual dragging class to matching week cells row
      const matchCellRow = weekMatrixBody.querySelector(`.row-wrapper[data-id="${draggedItemId}"]`);
      if (matchCellRow) matchCellRow.classList.add('dragging');
    });
    
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      const matchCellRow = weekMatrixBody.querySelector(`.row-wrapper[data-id="${draggedItemId}"]`);
      if (matchCellRow) matchCellRow.classList.remove('dragging');
      
      // Remove all drop-over classes
      taskListBody.querySelectorAll('.row-wrapper').forEach(r => r.classList.remove('drag-over'));
      weekMatrixBody.querySelectorAll('.row-wrapper').forEach(r => r.classList.remove('drag-over'));
      
      draggedItemId = null;
      dragOverItemId = null;
    });
    
    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      const targetRow = e.target.closest('.row-wrapper');
      if (targetRow && targetRow.dataset.id !== draggedItemId) {
        dragOverItemId = targetRow.dataset.id;
        targetRow.classList.add('drag-over');
        
        const matchCellRow = weekMatrixBody.querySelector(`.row-wrapper[data-id="${targetRow.dataset.id}"]`);
        if (matchCellRow) matchCellRow.classList.add('drag-over');
      }
    });
    
    row.addEventListener('dragleave', (e) => {
      const targetRow = e.target.closest('.row-wrapper');
      if (targetRow) {
        targetRow.classList.remove('drag-over');
        const matchCellRow = weekMatrixBody.querySelector(`.row-wrapper[data-id="${targetRow.dataset.id}"]`);
        if (matchCellRow) matchCellRow.classList.remove('drag-over');
      }
    });
    
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetRow = e.target.closest('.row-wrapper');
      if (!targetRow || draggedItemId === targetRow.dataset.id) return;
      
      reorderTasks(draggedItemId, targetRow.dataset.id);
    });
  });
}

// Move item in hierarchical model
function reorderTasks(draggedId, targetId) {
  let draggedTask = null;
  let draggedParentArray = null;
  
  // 1. Find and remove the dragged task
  function findAndRemove(array) {
    for (let i = 0; i < array.length; i++) {
      if (array[i].id === draggedId) {
        draggedTask = array[i];
        draggedParentArray = array;
        array.splice(i, 1);
        return true;
      }
      if (array[i].subtasks && array[i].subtasks.length > 0) {
        if (findAndRemove(array[i].subtasks)) return true;
      }
    }
    return false;
  }
  
  // Run on categories tasks
  for (let i = 0; i < state.categories.length; i++) {
    if (findAndRemove(state.categories[i].tasks)) break;
  }
  
  if (!draggedTask) return;
  
  // 2. Insert dragged task near target task
  let inserted = false;
  function findAndInsert(array) {
    for (let i = 0; i < array.length; i++) {
      if (array[i].id === targetId) {
        // Insert right after the target task at the same level
        array.splice(i + 1, 0, draggedTask);
        inserted = true;
        return true;
      }
      if (array[i].subtasks && array[i].subtasks.length > 0) {
        if (findAndInsert(array[i].subtasks)) return true;
      }
    }
    return false;
  }
  
  for (let i = 0; i < state.categories.length; i++) {
    if (findAndInsert(state.categories[i].tasks)) break;
  }
  
  // If not inserted, put it back where it was
  if (!inserted && draggedParentArray) {
    draggedParentArray.push(draggedTask);
  }
  
  saveState();
  renderBoard();
}

// --- Gesture / Swipe and Divider Dragging Handling ---

// Toggle grid visibility state
function toggleGridShown() {
  state.settings.gridShown = !state.settings.gridShown;
  saveState();
  
  // Add CSS sliding transition
  boardSlidingWrapper.classList.add('sliding');
  updateGridWidthDOM();
  setTimeout(() => {
    boardSlidingWrapper.classList.remove('sliding');
  }, 350);
}

// Handle double click on divider handle
boardDividerHandle.addEventListener('dblclick', () => {
  toggleGridShown();
});

// Setup Mouse Drag on Divider Handle
boardDividerHandle.addEventListener('mousedown', (e) => {
  isDraggingHandle = true;
  startDragX = e.clientX;
  startGridWidth = state.settings.gridShown ? state.settings.gridWidth : 0;
  boardDividerHandle.classList.add('dragging');
  
  // Disable transitions during live drag
  boardSlidingWrapper.classList.remove('sliding');
});

document.addEventListener('mousemove', (e) => {
  if (!isDraggingHandle) return;
  
  const deltaX = e.clientX - startDragX;
  let newWidth = startGridWidth + deltaX;
  
  // Clamp width
  if (newWidth < 30) {
    newWidth = 0;
    state.settings.gridShown = false;
  } else {
    state.settings.gridShown = true;
    newWidth = Math.min(newWidth, GRID_MAX_WIDTH);
  }
  
  state.settings.gridWidth = newWidth;
  boardSlidingWrapper.style.setProperty('--week-width', `${newWidth}px`);
  
  if (newWidth === 0) {
    boardSlidingWrapper.classList.add('grid-hidden');
    gridToggleBtn.classList.remove('active');
    gridToggleBtn.querySelector('.label').innerText = '显示周标记';
  } else {
    boardSlidingWrapper.classList.remove('grid-hidden');
    gridToggleBtn.classList.add('active');
    gridToggleBtn.querySelector('.label').innerText = '隐藏周标记';
  }
});

document.addEventListener('mouseup', () => {
  if (!isDraggingHandle) return;
  isDraggingHandle = false;
  boardDividerHandle.classList.remove('dragging');
  
  // Snap to closed or open
  boardSlidingWrapper.classList.add('sliding');
  if (state.settings.gridWidth < GRID_MAX_WIDTH / 2) {
    state.settings.gridWidth = GRID_MAX_WIDTH;
    state.settings.gridShown = false;
  } else {
    state.settings.gridWidth = GRID_MAX_WIDTH;
    state.settings.gridShown = true;
  }
  
  updateGridWidthDOM();
  saveState();
  
  setTimeout(() => {
    boardSlidingWrapper.classList.remove('sliding');
  }, 350);
});

// Setup Touch Gestures (Swipe Left to Show / Swipe Right to Hide Grid)
boardSlidingWrapper.addEventListener('touchstart', (e) => {
  // Store start position
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

boardSlidingWrapper.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  // Verify it was a horizontal swipe
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > DRAG_THRESHOLD) {
    // If swipe left (finger moves right-to-left)
    if (deltaX < 0) {
      if (!state.settings.gridShown) {
        toggleGridShown(); // Show grid
      }
    } 
    // If swipe right (finger moves left-to-right)
    else if (deltaX > 0) {
      if (state.settings.gridShown) {
        toggleGridShown(); // Hide grid
      }
    }
  }
}, { passive: true });


// --- Day Cells Action Events ---

// Cycle cell status on single-click
weekMatrixBody.addEventListener('click', (e) => {
  const cell = e.target.closest('.day-cell');
  if (!cell || cell.classList.contains('cell-category')) return;
  
  const taskId = cell.dataset.taskId;
  const dayIdx = parseInt(cell.dataset.day);
  
  // Find task reference
  let targetTask = null;
  function searchTask(list) {
    for (let t of list) {
      if (t.id === taskId) { targetTask = t; return true; }
      if (t.subtasks && searchTask(t.subtasks)) return true;
    }
    return false;
  }
  for (let c of state.categories) {
    if (searchTask(c.tasks)) break;
  }
  
  if (!targetTask) return;
  
  // Cycle statuses
  if (!targetTask.days) targetTask.days = {};
  const currentStatus = targetTask.days[dayIdx] || 'none';
  const cycle = ['none', 'done', 'partial', 'migrated', 'cancelled'];
  const nextIdx = (cycle.indexOf(currentStatus) + 1) % cycle.length;
  const nextStatus = cycle[nextIdx];
  
  if (nextStatus === 'none') {
    delete targetTask.days[dayIdx];
  } else {
    targetTask.days[dayIdx] = nextStatus;
  }
  
  // Save and render cell SVG with draw animation
  saveState();
  cell.innerHTML = getMarkingSVG(nextStatus);
});

// Show Quick Action Context Menu on Right Click (or Long Press)
weekMatrixBody.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const cell = e.target.closest('.day-cell');
  if (!cell || cell.classList.contains('cell-category')) return;
  
  activeMenuCell = cell;
  cellActionMenu.style.left = `${e.clientX}px`;
  cellActionMenu.style.top = `${e.clientY}px`;
  cellActionMenu.classList.add('active');
});

// Close context menu on click outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#cellActionMenu') && !e.target.closest('.day-cell')) {
    cellActionMenu.classList.remove('active');
    activeMenuCell = null;
  }
});

// Context Menu Action Click
cellActionMenu.addEventListener('click', (e) => {
  const button = e.target.closest('.menu-item');
  if (!button || !activeMenuCell) return;
  
  const status = button.dataset.status;
  const taskId = activeMenuCell.dataset.taskId;
  const dayIdx = parseInt(activeMenuCell.dataset.day);
  
  // Find task
  let targetTask = null;
  function searchTask(list) {
    for (let t of list) {
      if (t.id === taskId) { targetTask = t; return true; }
      if (t.subtasks && searchTask(t.subtasks)) return true;
    }
    return false;
  }
  for (let c of state.categories) {
    if (searchTask(c.tasks)) break;
  }
  
  if (targetTask) {
    if (status === 'none') {
      delete targetTask.days[dayIdx];
    } else {
      if (!targetTask.days) targetTask.days = {};
      targetTask.days[dayIdx] = status;
    }
    saveState();
    activeMenuCell.innerHTML = getMarkingSVG(status);
  }
  
  cellActionMenu.classList.remove('active');
  activeMenuCell = null;
});


// --- Task & Category Modals & CRUD ---

// Modal Open Helper
function openModal(titleText, labelText, showColor, initialVal, callback) {
  modalTitle.innerText = titleText;
  modalInputLabel.innerText = labelText;
  modalInput.value = initialVal || '';
  colorSelectGroup.style.display = showColor ? 'block' : 'none';
  inputModal.classList.add('open');
  modalInput.focus();
  
  modalCallback = callback;
}

// Modal Close Helper
function closeModal() {
  inputModal.classList.remove('open');
  modalCallback = null;
}

modalCancelBtn.addEventListener('click', closeModal);
modalSaveBtn.addEventListener('click', () => {
  const val = modalInput.value.trim();
  if (val && modalCallback) {
    modalCallback(val);
  }
  closeModal();
});
modalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    modalSaveBtn.click();
  }
});

// Color dots toggle
colorDotOpts.forEach(dot => {
  dot.addEventListener('click', () => {
    colorDotOpts.forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    activeCategoryColor = dot.dataset.color;
  });
});

// Create Category Click
addCategoryBtn.addEventListener('click', () => {
  openModal('新建项目', '项目名称 (比如: 🚀 工作项目)', true, '', (name) => {
    state.categories.push({
      id: generateId(),
      title: name,
      color: activeCategoryColor,
      tasks: []
    });
    saveState();
    renderBoard();
  });
});

// Task actions handling (delegated)
taskListBody.addEventListener('click', (e) => {
  const btn = e.target.closest('.row-action-btn') || e.target.closest('.collapse-toggle') || e.target.closest('.category-title-text');
  if (!btn) return;
  
  const row = btn.closest('.row-wrapper');
  const id = row.dataset.id;
  
  // Find category or task
  let category = state.categories.find(c => c.id === id);
  let task = null;
  let parentList = null;
  
  function searchTask(list) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) { 
        task = list[i]; 
        parentList = list;
        return true; 
      }
      if (list[i].subtasks && searchTask(list[i].subtasks)) return true;
    }
    return false;
  }
  
  if (!category) {
    for (let c of state.categories) {
      if (searchTask(c.tasks)) break;
    }
  }
  
  // Trigger Action
  if (btn.classList.contains('add-task-btn')) {
    // Add task under category
    openModal('添加任务', '任务名称', false, '', (text) => {
      category.tasks.push({
        id: generateId(),
        text: text,
        completed: false,
        collapsed: false,
        days: {},
        subtasks: []
      });
      saveState();
      renderBoard();
    });
  } 
  else if (btn.classList.contains('edit-cat-btn')) {
    // Edit category name/color
    // Find active color in options
    colorDotOpts.forEach(dot => {
      dot.classList.toggle('active', dot.dataset.color === category.color);
    });
    activeCategoryColor = category.color;
    
    openModal('编辑项目分类', '项目名称', true, category.title, (name) => {
      category.title = name;
      category.color = activeCategoryColor;
      saveState();
      renderBoard();
    });
  } 
  else if (btn.classList.contains('delete-cat-btn')) {
    // Delete category
    if (confirm(`确定要删除分类“${category.title}”及其所有任务吗？`)) {
      state.categories = state.categories.filter(c => c.id !== id);
      saveState();
      renderBoard();
    }
  } 
  else if (btn.classList.contains('toggle-complete-btn')) {
    // Toggle task complete status
    task.completed = !task.completed;
    saveState();
    renderBoard();
  } 
  else if (btn.classList.contains('add-subtask-btn')) {
    // Add subtask
    openModal('添加支持子任务', '子任务名称', false, '', (text) => {
      if (!task.subtasks) task.subtasks = [];
      task.subtasks.push({
        id: generateId(),
        text: text,
        completed: false,
        collapsed: false,
        days: {},
        subtasks: []
      });
      task.collapsed = false; // Expand parent to show new subtask
      saveState();
      renderBoard();
    });
  } 
  else if (btn.classList.contains('highlight-task-btn')) {
    // Highlight task text (Yellow highlighter)
    const textSpan = row.querySelector('.task-text-span');
    textSpan.classList.toggle('highlighted-text');
    // Save highlighter setting in classList or task attributes
    // In our model we can store a custom style
    if (!task.style) task.style = {};
    task.style.highlighted = textSpan.classList.contains('highlighted-text');
    saveState();
  }
  else if (btn.classList.contains('delete-task-btn')) {
    // Delete task
    if (confirm(`确定要删除该任务吗？`)) {
      const idx = parentList.findIndex(t => t.id === id);
      if (idx !== -1) {
        parentList.splice(idx, 1);
        saveState();
        renderBoard();
      }
    }
  } 
  else if (btn.classList.contains('collapse-toggle')) {
    // Collapse / Expand subtasks
    task.collapsed = !task.collapsed;
    saveState();
    renderBoard();
  }
});


// --- Top Calendar Navigation ---

// Nav weeks
prevWeekBtn.addEventListener('click', () => {
  state.currentDate.setDate(state.currentDate.getDate() - 7);
  saveState();
  renderWeeklyHighlights();
  renderBoard();
});

nextWeekBtn.addEventListener('click', () => {
  state.currentDate.setDate(state.currentDate.getDate() + 7);
  saveState();
  renderWeeklyHighlights();
  renderBoard();
});


// --- Settings Panels Buttons ---

// Menu Open
menuBtn.addEventListener('click', () => {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
});

// Menu Close
closeSidebarBtn.addEventListener('click', () => {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
});
sidebarOverlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
});

// Theme Select
themeOpts.forEach(opt => {
  opt.addEventListener('click', () => {
    state.settings.theme = opt.dataset.theme;
    saveState();
    applySettings();
  });
});

// Grid select
gridOpts.forEach(opt => {
  opt.addEventListener('click', () => {
    state.settings.gridType = opt.dataset.grid;
    saveState();
    applySettings();
  });
});

// Grid density slider
gridDensityInput.addEventListener('input', (e) => {
  const val = e.target.value;
  gridDensityVal.innerText = `${val}px`;
  state.settings.gridSize = parseInt(val);
  saveState();
  applySettings();
});

// Clear Data
clearAllBtn.addEventListener('click', () => {
  if (confirm('警告：此操作将清空所有项目、分类及手帐记录！确定继续吗？')) {
    state.categories = [];
    state.dailyHighlights = {};
    saveState();
    renderBoard();
    renderWeeklyHighlights();
    sidebarOverlay.click();
  }
});

// Load Demo
loadDemoBtn.addEventListener('click', () => {
  if (confirm('此操作将覆盖您当前的数据并加载示例模版，确定吗？')) {
    loadDemoData();
    renderBoard();
    renderWeeklyHighlights();
    sidebarOverlay.click();
  }
});

// Global Grid Toggle Button
gridToggleBtn.addEventListener('click', () => {
  toggleGridShown();
});

// Keyboard Shortcut: press 'g' or 'G' to toggle week grid
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'g' && document.activeElement.tagName !== 'INPUT' && document.activeElement.getAttribute('contenteditable') !== 'true') {
    toggleGridShown();
  }
});


// --- Gesture Hint Handling ---

// Show gesture hint if first time
function checkFirstUseHint() {
  const hinted = localStorage.getItem('rolling_week_hint_shown');
  if (!hinted) {
    gestureHintOverlay.classList.add('open');
  }
}

closeHintBtn.addEventListener('click', () => {
  gestureHintOverlay.classList.remove('open');
  localStorage.setItem('rolling_week_hint_shown', 'true');
});


// --- Initialization ---

window.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderWeeklyHighlights();
  renderBoard();
  checkFirstUseHint();
});
