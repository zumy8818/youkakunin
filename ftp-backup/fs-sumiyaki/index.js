const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'expenses.json');
const RECIPE_FILE = path.join(DATA_DIR, 'recipes.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
if (!fs.existsSync(RECIPE_FILE)) fs.writeFileSync(RECIPE_FILE, '[]', 'utf8');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ===== 支出 API =====
app.get('/api/expenses', (req, res) => {
  res.json(readJSON(DATA_FILE));
});

app.post('/api/expenses', (req, res) => {
  const { amount, category, item, supplier, memo, date, quantity, unit, unitPrice } = req.body;
  if (!amount || !category || !item) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }
  const expenses = readJSON(DATA_FILE);
  const newExpense = {
    id: Date.now().toString(),
    amount: Number(amount),
    category,
    item,
    supplier: supplier || '',
    memo: memo || '',
    date: date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  if (category === '原材料費' && quantity) {
    newExpense.quantity = Number(quantity);
    newExpense.unit = unit || '個';
    newExpense.unitPrice = Number(unitPrice) || 0;
  }
  expenses.push(newExpense);
  writeJSON(DATA_FILE, expenses);
  res.status(201).json(newExpense);
});

app.delete('/api/expenses/:id', (req, res) => {
  const expenses = readJSON(DATA_FILE);
  const filtered = expenses.filter((e) => e.id !== req.params.id);
  if (filtered.length === expenses.length) {
    return res.status(404).json({ error: '見つかりません' });
  }
  writeJSON(DATA_FILE, filtered);
  res.json({ success: true });
});

// ===== レシピ API =====
app.get('/api/recipes', (req, res) => {
  res.json(readJSON(RECIPE_FILE));
});

app.post('/api/recipes', (req, res) => {
  const { name, status, ingredients, memo } = req.body;
  if (!name) {
    return res.status(400).json({ error: '商品名は必須です' });
  }
  const recipes = readJSON(RECIPE_FILE);
  const totalCost = (ingredients || []).reduce((s, i) => s + (Number(i.cost) || 0), 0);
  const newRecipe = {
    id: Date.now().toString(),
    name,
    status: status || '試作中',
    ingredients: (ingredients || []).map((i) => ({
      materialName: i.materialName || '',
      expenseId: i.expenseId || '',
      unit: i.unit || '',
      unitPrice: Number(i.unitPrice) || 0,
      usage: Number(i.usage) || 0,
      cost: Number(i.cost) || 0,
    })),
    totalCost,
    memo: memo || '',
    createdAt: new Date().toISOString(),
  };
  recipes.push(newRecipe);
  writeJSON(RECIPE_FILE, recipes);
  res.status(201).json(newRecipe);
});

app.delete('/api/recipes/:id', (req, res) => {
  const recipes = readJSON(RECIPE_FILE);
  const filtered = recipes.filter((r) => r.id !== req.params.id);
  if (filtered.length === recipes.length) {
    return res.status(404).json({ error: '見つかりません' });
  }
  writeJSON(RECIPE_FILE, filtered);
  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`fs-sumiyaki-manager started on port ${PORT}`);
});
