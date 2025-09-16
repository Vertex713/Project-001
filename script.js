console.log("script.js loaded");
document.addEventListener("DOMContentLoaded", () => {
  const board = document.getElementById("board");
  const addColumnBtn = document.getElementById("addColumnBtn");
  const themeToggle = document.getElementById("themeToggle");
  const searchInput = document.getElementById("searchInput");

  // --- ТЕМА (light/dark) с запоминанием ---
  const THEME_KEY = "kanban_theme";
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
  refreshThemeIcon();

  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    refreshThemeIcon();
  });
  function refreshThemeIcon() {
    const t = document.documentElement.getAttribute("data-theme") || "light";
    themeToggle.querySelector(".icon").textContent = t === "light" ? "🌞" : "🌙";
  }

  // --- ПОИСК по карточкам ---
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    document.querySelectorAll(".card").forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? "" : "none";
    });
  });

  // --- Добавление колонки ---
  addColumnBtn.addEventListener("click", () => {
    const title = prompt("Название колонки:");
    if (!title) return;
    const col = createColumn(title);
    board.appendChild(col);
  });

  // --- Инициализация стартовых колонок ---
  document.querySelectorAll(".column").forEach(enhanceColumn);

  // ---------- Helpers ----------
  function createColumn(title) {
    const section = document.createElement("section");
    section.className = "column";
    section.innerHTML = `
      <header class="column-header">
        <h2 class="column-title">${escapeHtml(title)}</h2>
        <button class="icon-btn" title="Добавить карточку">＋</button>
      </header>
      <div class="cards"></div>
      <button class="add-card">+ Добавить карточку</button>
    `;
    enhanceColumn(section);
    return section;
  }

  function enhanceColumn(col) {
    const addIconBtn = col.querySelector(".icon-btn");
    const addCardBtn = col.querySelector(".add-card");
    const cardsContainer = col.querySelector(".cards");

    addIconBtn.addEventListener("click", () => promptAndAddCard(cardsContainer));
    addCardBtn.addEventListener("click", () => promptAndAddCard(cardsContainer));

    // dragover на контейнер
    cardsContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      const dragging = document.querySelector(".card.dragging");
      if (!dragging) return;
      cardsContainer.classList.add("drag-over");
      const after = getDragAfterElement(cardsContainer, e.clientY);
      if (after == null) {
        cardsContainer.appendChild(dragging);
      } else {
        cardsContainer.insertBefore(dragging, after);
      }
    });

    cardsContainer.addEventListener("dragleave", () => {
      cardsContainer.classList.remove("drag-over");
    });

    cardsContainer.addEventListener("drop", () => {
      cardsContainer.classList.remove("drag-over");
    });
  }

  function promptAndAddCard(container) {
    const title = prompt("Текст карточки:");
    if (!title) return;
    const card = createCard(title);
    container.appendChild(card);
  }

  function createCard(title) {
    const card = document.createElement("article");
    card.className = "card";
    card.draggable = true;
    card.innerHTML = `
      <h3 class="card-title">${escapeHtml(title)}</h3>
      <div class="card-actions">
        <button class="btn btn-ghost btn-sm" title="Переименовать">Переименовать</button>
        <button class="btn btn-ghost btn-sm" title="Удалить">Удалить</button>
      </div>
    `;

    card.addEventListener("dragstart", () => {
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });

    const [renameBtn, deleteBtn] = card.querySelectorAll(".btn");
    renameBtn.addEventListener("click", () => {
      const next = prompt("Новый текст карточки:", card.querySelector(".card-title").textContent);
      if (!next) return;
      card.querySelector(".card-title").textContent = next;
    });
    deleteBtn.addEventListener("click", () => {
      card.remove();
    });

    return card;
  }

  // Вычисление позиции вставки при перетаскивании (чтобы была сортировка внутри колонки)
  function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll(".card:not(.dragging)")];

    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
  }
});
