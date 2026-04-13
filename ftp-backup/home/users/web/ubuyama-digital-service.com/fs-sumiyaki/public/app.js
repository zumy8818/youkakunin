'use strict';

// ===== 状態 =====
let expenses = [];
let recipes = [];
let currentFilter = '全て';
let currentRecipeFilter = '全て';
let selectedCategory = '';
let selectedRecipeStatus = '試作中';
let recipeIngredients = [];
let recipeFormOpen = true;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', async () => {
  initDate();
  initCategoryButtons();
  initNavigation();
  initFilterButtons();
  initRegisterForm();
  initMaterialFields();
  initRecipeForm();
  initRecipeFilterButtons();
  await Promise.all([fetchExpenses(), fetchRecipes()]);
  initComboboxes();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});

function initDate() {
  document.getElementById('input-date').value = todayStr();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ===== ナビゲーション =====
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const screen = btn.dataset.screen;
      switchScreen(screen, btn.dataset.title);
      document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function switchScreen(screenId, title) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(`screen-${screenId}`).classList.add('active');
  document.getElementById('page-title').textContent = title;
  if (screenId === 'list') renderExpenseList();
  if (screenId === 'inventory') renderInventory();
  if (screenId === 'recipe') renderRecipeList();
}

// ===== 区分ボタン =====
function initCategoryButtons() {
  document.querySelectorAll('.cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCategory = btn.dataset.cat;
      document.getElementById('input-category').value = selectedCategory;
      toggleMaterialFields(selectedCategory === '原材料費');
    });
  });
}

// ===== 原材料費 追加フィールド =====
function initMaterialFields() {
  const amountInput = document.getElementById('input-amount');
  const quantityInput = document.getElementById('input-quantity');
  const unitSelect = document.getElementById('input-unit');

  function updateUnitPrice() {
    const amount = parseFloat(amountInput.value) || 0;
    const qty = parseFloat(quantityInput.value) || 0;
    const unit = unitSelect.value;
    const display = document.getElementById('unit-price-display');
    if (amount > 0 && qty > 0) {
      const up = amount / qty;
      display.textContent = `単価: ${formatYen(Math.round(up * 100) / 100)} / ${unit}`;
      display.classList.add('has-value');
    } else {
      display.textContent = '';
      display.classList.remove('has-value');
    }
  }

  amountInput.addEventListener('input', updateUnitPrice);
  quantityInput.addEventListener('input', updateUnitPrice);
  unitSelect.addEventListener('change', updateUnitPrice);
}

function toggleMaterialFields(show) {
  const el = document.getElementById('material-fields');
  if (show) {
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
    document.getElementById('input-quantity').value = '';
    document.getElementById('unit-price-display').textContent = '';
  }
}

// ===== フィルターボタン =====
function initFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderExpenseList();
    });
  });
}

// ===== 登録フォーム =====
function initRegisterForm() {
  const form = document.getElementById('register-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('input-amount').value;
    const category = document.getElementById('input-category').value;
    const item = document.getElementById('input-item').value;
    const memo = document.getElementById('input-memo').value;
    const date = document.getElementById('input-date').value;

    if (!amount || !category || !item) {
      alert('金額・区分・品目名を入力してください');
      return;
    }

    const supplier = document.getElementById('input-supplier').value.trim();
    const body = { amount, category, item, supplier, memo, date };

    if (category === '原材料費') {
      const qty = document.getElementById('input-quantity').value;
      const unit = document.getElementById('input-unit').value;
      if (qty) {
        body.quantity = qty;
        body.unit = unit;
        body.unitPrice = parseFloat(amount) / parseFloat(qty);
      }
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('登録失敗');
      const newExp = await res.json();
      expenses.push(newExp);
      updateSupplierDatalist();
      resetForm();
      showToast('登録しました');
    } catch {
      alert('登録に失敗しました');
    }
  });
}

function resetForm() {
  document.getElementById('input-amount').value = '';
  document.getElementById('input-item').value = '';
  document.getElementById('input-memo').value = '';
  document.getElementById('input-date').value = todayStr();
  document.getElementById('input-supplier').value = '';
  document.getElementById('input-quantity').value = '';
  document.getElementById('unit-price-display').textContent = '';
  document.querySelectorAll('.cat-btn').forEach((b) => b.classList.remove('selected'));
  document.getElementById('input-category').value = '';
  selectedCategory = '';
  toggleMaterialFields(false);
}

function showToast(msg) {
  const toast = document.getElementById('register-toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2200);
}

// ===== データ取得 =====
async function fetchExpenses() {
  try {
    const res = await fetch('/api/expenses');
    expenses = await res.json();
  } catch { expenses = []; }
}

// ===== コンボボックス =====
function getFreqSorted(arr) {
  const freq = {};
  arr.forEach((v) => { if (v) freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

function getItemOptions() {
  return getFreqSorted(expenses.map((e) => e.item));
}

function getSupplierOptions() {
  return getFreqSorted(expenses.filter((e) => e.supplier).map((e) => e.supplier));
}

function initCombobox(inputId, dropdownId, getOptions) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);

  function renderOptions(filter) {
    const opts = getOptions();
    const q = (filter || '').toLowerCase();
    const filtered = q ? opts.filter((o) => o.toLowerCase().includes(q)) : opts;

    if (filtered.length === 0) {
      dropdown.classList.add('hidden');
      return;
    }

    dropdown.innerHTML = filtered
      .map((o) => `<div class="combobox-option">${escapeHTML(o)}</div>`)
      .join('');
    dropdown.classList.remove('hidden');

    dropdown.querySelectorAll('.combobox-option').forEach((opt) => {
      opt.addEventListener('mousedown', (e) => {
        e.preventDefault();
        input.value = opt.textContent;
        dropdown.classList.add('hidden');
        input.dispatchEvent(new Event('change'));
      });
      opt.addEventListener('touchstart', (e) => {
        e.preventDefault();
        input.value = opt.textContent;
        dropdown.classList.add('hidden');
        input.dispatchEvent(new Event('change'));
        input.blur();
      });
    });
  }

  input.addEventListener('focus', () => renderOptions(input.value));
  input.addEventListener('input', () => renderOptions(input.value));
  input.addEventListener('blur', () => setTimeout(() => dropdown.classList.add('hidden'), 200));
}

function initComboboxes() {
  initCombobox('input-item', 'item-dropdown', getItemOptions);
  initCombobox('input-supplier', 'supplier-dropdown', getSupplierOptions);
}

async function fetchRecipes() {
  try {
    const res = await fetch('/api/recipes');
    recipes = await res.json();
  } catch { recipes = []; }
}

// ===== 支出一覧 =====
function renderExpenseList() {
  const container = document.getElementById('expense-list');
  const filtered = currentFilter === '全て'
    ? [...expenses]
    : expenses.filter((e) => e.category === currentFilter);
  filtered.sort((a, b) => b.date.localeCompare(a.date));
  updateSummary(expenses);

  if (filtered.length === 0) {
    container.innerHTML = emptyState('📋', '支出がありません');
    return;
  }

  let html = '';
  let lastMonth = '';
  filtered.forEach((exp) => {
    const month = exp.date.slice(0, 7);
    if (month !== lastMonth) {
      const [y, m] = month.split('-');
      html += `<div class="month-separator">${y}年${Number(m)}月</div>`;
      lastMonth = month;
    }
    html += expenseItemHTML(exp);
  });
  container.innerHTML = html;
  container.querySelectorAll('.expense-delete').forEach((btn) => {
    btn.addEventListener('click', () => deleteExpense(btn.dataset.id));
  });
}

function updateSummary(all) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthly = all.filter((e) => e.date.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0);
  const total = all.reduce((s, e) => s + e.amount, 0);
  document.getElementById('monthly-total').textContent = formatYen(monthly);
  document.getElementById('total-all').textContent = formatYen(total);
}

// ===== 在庫表 =====
function renderInventory() {
  const container = document.getElementById('inventory-list');
  const items = expenses.filter((e) => e.category === '設備投資' || e.category === '原材料費');
  items.sort((a, b) => b.date.localeCompare(a.date));

  if (items.length === 0) {
    container.innerHTML = emptyState('📦', '在庫データがありません');
    return;
  }

  let html = '';
  let lastMonth = '';
  items.forEach((exp) => {
    const month = exp.date.slice(0, 7);
    if (month !== lastMonth) {
      const [y, m] = month.split('-');
      html += `<div class="month-separator">${y}年${Number(m)}月</div>`;
      lastMonth = month;
    }
    html += expenseItemHTML(exp, false);
  });
  container.innerHTML = html;
}

// ===== 削除 =====
async function deleteExpense(id) {
  if (!confirm('この支出を削除しますか？')) return;
  try {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    expenses = expenses.filter((e) => e.id !== id);
    renderExpenseList();
  } catch { alert('削除に失敗しました'); }
}

// ===== レシピフォーム =====
function initRecipeForm() {
  // ステータスボタン
  document.querySelectorAll('.status-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.status-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedRecipeStatus = btn.dataset.status;
      document.getElementById('input-recipe-status').value = selectedRecipeStatus;
    });
  });

  // 原材料追加ボタン
  document.getElementById('add-ingredient-btn').addEventListener('click', () => {
    addIngredientRow();
  });

  // フォームトグル
  document.getElementById('recipe-form-toggle').addEventListener('click', () => {
    const form = document.getElementById('recipe-form');
    const btn = document.getElementById('recipe-form-toggle');
    recipeFormOpen = !recipeFormOpen;
    form.style.display = recipeFormOpen ? '' : 'none';
    btn.textContent = recipeFormOpen ? '▲ 閉じる' : '▼ 開く';
  });

  // フォーム送信
  document.getElementById('recipe-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('input-recipe-name').value.trim();
    if (!name) { alert('商品名を入力してください'); return; }

    const status = document.getElementById('input-recipe-status').value;
    const memo = document.getElementById('input-recipe-memo').value;
    const ingredients = collectIngredients();

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status, ingredients, memo }),
      });
      if (!res.ok) throw new Error();
      const newRecipe = await res.json();
      recipes.push(newRecipe);
      resetRecipeForm();
      renderRecipeList();
      showToast('レシピを保存しました');
    } catch { alert('保存に失敗しました'); }
  });

  // 初期原材料行
  addIngredientRow();
}

function addIngredientRow() {
  const idx = recipeIngredients.length;
  recipeIngredients.push({ materialName: '', unit: '', unitPrice: 0, usage: 0, cost: 0 });

  const materialOptions = getMaterialOptions();
  const container = document.getElementById('ingredient-rows');
  const row = document.createElement('div');
  row.className = 'ingredient-row';
  row.dataset.idx = idx;
  row.innerHTML = `
    <div class="ingredient-row-top">
      <div class="ingredient-name-wrap">
        <input type="text" class="form-input ing-name" placeholder="原材料名" list="material-datalist-${idx}" />
        <datalist id="material-datalist-${idx}">${materialOptions}</datalist>
      </div>
      <button type="button" class="ing-remove-btn" title="削除">×</button>
    </div>
    <div class="ingredient-row-bottom">
      <div class="ing-field">
        <span class="ing-label">単位</span>
        <input type="text" class="form-input ing-unit" placeholder="-" readonly />
      </div>
      <div class="ing-field">
        <span class="ing-label">単価</span>
        <input type="text" class="ing-unitprice-display form-input" placeholder="-" readonly />
      </div>
      <div class="ing-field">
        <span class="ing-label">使用量</span>
        <input type="number" class="form-input ing-usage" placeholder="0" min="0" step="any" inputmode="decimal" />
      </div>
      <div class="ing-field">
        <span class="ing-label">原価</span>
        <span class="ing-cost">¥0</span>
      </div>
    </div>
  `;
  container.appendChild(row);

  const nameInput = row.querySelector('.ing-name');
  const unitInput = row.querySelector('.ing-unit');
  const unitPriceDisplay = row.querySelector('.ing-unitprice-display');
  const usageInput = row.querySelector('.ing-usage');
  const costSpan = row.querySelector('.ing-cost');

  nameInput.addEventListener('change', () => {
    const mat = findMaterial(nameInput.value);
    if (mat) {
      unitInput.value = mat.unit || '';
      unitPriceDisplay.value = mat.unitPrice ? `${formatYen(mat.unitPrice)}/${mat.unit}` : '-';
      recipeIngredients[idx].unit = mat.unit || '';
      recipeIngredients[idx].unitPrice = mat.unitPrice || 0;
      recipeIngredients[idx].expenseId = mat.id || '';
    } else {
      unitInput.value = '';
      unitPriceDisplay.value = '-';
      recipeIngredients[idx].unit = '';
      recipeIngredients[idx].unitPrice = 0;
      recipeIngredients[idx].expenseId = '';
    }
    recipeIngredients[idx].materialName = nameInput.value;
    updateIngCost(idx, usageInput, costSpan);
  });

  nameInput.addEventListener('input', () => {
    recipeIngredients[idx].materialName = nameInput.value;
  });

  usageInput.addEventListener('input', () => {
    updateIngCost(idx, usageInput, costSpan);
  });

  row.querySelector('.ing-remove-btn').addEventListener('click', () => {
    row.remove();
    recipeIngredients[idx] = null;
    recalcTotalCost();
  });
}

function updateIngCost(idx, usageInput, costSpan) {
  const usage = parseFloat(usageInput.value) || 0;
  const unitPrice = recipeIngredients[idx] ? recipeIngredients[idx].unitPrice : 0;
  const cost = Math.round(unitPrice * usage * 100) / 100;
  if (recipeIngredients[idx]) {
    recipeIngredients[idx].usage = usage;
    recipeIngredients[idx].cost = cost;
  }
  costSpan.textContent = formatYen(cost);
  recalcTotalCost();
}

function recalcTotalCost() {
  const total = recipeIngredients
    .filter(Boolean)
    .reduce((s, i) => s + (i.cost || 0), 0);
  document.getElementById('recipe-total-cost').textContent = formatYen(Math.round(total * 100) / 100);
}

function collectIngredients() {
  const rows = document.querySelectorAll('#ingredient-rows .ingredient-row');
  return Array.from(rows).map((row) => {
    const idx = Number(row.dataset.idx);
    const ing = recipeIngredients[idx] || {};
    ing.materialName = row.querySelector('.ing-name').value;
    return ing;
  }).filter((i) => i.materialName);
}

function getMaterialOptions() {
  const mats = expenses.filter((e) => e.category === '原材料費');
  return mats.map((m) => `<option value="${escapeHTML(m.item)}">`).join('');
}

function findMaterial(name) {
  return expenses.find((e) => e.category === '原材料費' && e.item === name) || null;
}

function resetRecipeForm() {
  document.getElementById('input-recipe-name').value = '';
  document.getElementById('input-recipe-memo').value = '';
  document.getElementById('input-recipe-status').value = '試作中';
  document.querySelectorAll('.status-btn').forEach((b) => {
    b.classList.toggle('selected', b.dataset.status === '試作中');
  });
  selectedRecipeStatus = '試作中';
  document.getElementById('ingredient-rows').innerHTML = '';
  recipeIngredients = [];
  document.getElementById('recipe-total-cost').textContent = '¥0';
  addIngredientRow();
}

// ===== レシピフィルター =====
function initRecipeFilterButtons() {
  document.querySelectorAll('.recipe-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.recipe-filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentRecipeFilter = btn.dataset.rfilter;
      renderRecipeList();
    });
  });
}

// ===== レシピ一覧 =====
function renderRecipeList() {
  const container = document.getElementById('recipe-list');
  const filtered = currentRecipeFilter === '全て'
    ? [...recipes]
    : recipes.filter((r) => r.status === currentRecipeFilter);
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (filtered.length === 0) {
    container.innerHTML = emptyState('🍖', 'レシピがありません');
    return;
  }

  container.innerHTML = filtered.map((r) => recipeCardHTML(r)).join('');
  container.querySelectorAll('.recipe-delete').forEach((btn) => {
    btn.addEventListener('click', () => deleteRecipe(btn.dataset.id));
  });
}

function recipeCardHTML(r) {
  const statusClass = { '試作中': 'status-trial', '採用': 'status-adopted', '却下': 'status-rejected' }[r.status] || '';
  const ingRows = (r.ingredients || []).map((i) => `
    <tr>
      <td>${escapeHTML(i.materialName)}</td>
      <td>${i.usage}${escapeHTML(i.unit || '')}</td>
      <td class="ing-cost-cell">${formatYen(i.cost)}</td>
    </tr>
  `).join('');

  return `
    <div class="recipe-card">
      <div class="recipe-card-header">
        <span class="recipe-status-badge ${statusClass}">${r.status}</span>
        <span class="recipe-name">${escapeHTML(r.name)}</span>
        <button class="expense-delete recipe-delete" data-id="${r.id}" title="削除">×</button>
      </div>
      ${r.ingredients && r.ingredients.length > 0 ? `
        <table class="ingredient-table">
          <thead><tr><th>原材料</th><th>使用量</th><th>原価</th></tr></thead>
          <tbody>${ingRows}</tbody>
        </table>
      ` : '<p class="no-ingredients">原材料なし</p>'}
      <div class="recipe-card-footer">
        <span class="recipe-total-label">合計原価</span>
        <span class="recipe-total-value">${formatYen(r.totalCost)}</span>
      </div>
      ${r.memo ? `<div class="recipe-memo">${escapeHTML(r.memo)}</div>` : ''}
    </div>
  `;
}

async function deleteRecipe(id) {
  if (!confirm('このレシピを削除しますか？')) return;
  try {
    const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    recipes = recipes.filter((r) => r.id !== id);
    renderRecipeList();
  } catch { alert('削除に失敗しました'); }
}

// ===== ヘルパー =====
function expenseItemHTML(exp, showDelete = true) {
  const unitPriceStr = (exp.category === '原材料費' && exp.quantity)
    ? `<span class="unit-price-tag">${formatYen(Math.round(exp.unitPrice * 100) / 100)}/${exp.unit}</span>`
    : '';
  return `
    <div class="expense-item">
      <span class="expense-cat-badge cat-${exp.category}">${exp.category}</span>
      <div class="expense-body">
        <div class="expense-item-name">${escapeHTML(exp.item)}</div>
        ${exp.quantity ? `<div class="expense-meta">${exp.quantity}${exp.unit} ${unitPriceStr}</div>` : ''}
        ${exp.supplier ? `<div class="expense-meta supplier-tag">🏪 ${escapeHTML(exp.supplier)}</div>` : ''}
        ${exp.memo ? `<div class="expense-meta">${escapeHTML(exp.memo)}</div>` : ''}
      </div>
      <div class="expense-right">
        <div class="expense-amount">${formatYen(exp.amount)}</div>
        <div class="expense-date">${formatDate(exp.date)}</div>
      </div>
      ${showDelete ? `<button class="expense-delete" data-id="${exp.id}" title="削除">×</button>` : ''}
    </div>
  `;
}

function emptyState(icon, text) {
  return `<div class="empty-state">
    <span class="empty-state-icon">${icon}</span>
    <span class="empty-state-text">${text}</span>
  </div>`;
}

function formatYen(n) {
  return '¥' + Number(n).toLocaleString('ja-JP');
}

function formatDate(d) {
  const [y, m, day] = d.split('-');
  return `${Number(m)}月${Number(day)}日`;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
