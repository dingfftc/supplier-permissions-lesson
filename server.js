const http = require('http');
const crypto = require('crypto');
const sessions = new Map();
const accounts = { editor: { password: 'edit123', role: 'editor', label: '编辑员' }, viewer: { password: 'view123', role: 'viewer', label: '只读人员' } };
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const initialSuppliers = require('./mock-data');

const databasePath = path.join(__dirname, 'suppliers.sqlite');
function sqlText(value) {
  return "CAST(X'" + Buffer.from(value, 'utf8').toString('hex') + "' AS TEXT)";
}
function query(sql) {
  return execFileSync('sqlite3', ['-json', databasePath, sql], { encoding: 'utf8' }).trim();
}
query('CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, contact TEXT NOT NULL, phone TEXT NOT NULL, status TEXT NOT NULL, date TEXT NOT NULL);');
for (const supplier of initialSuppliers) {
  const values = [supplier.id, ...['name', 'contact', 'phone', 'status', 'date'].map(key => sqlText(supplier[key]))];
  query('INSERT OR IGNORE INTO suppliers VALUES (' + values.join(',') + ');');
}
function readSuppliers(id) {
  const where = id === undefined ? '' : ' WHERE id = ' + id;
  return JSON.parse(query('SELECT * FROM suppliers' + where + ' ORDER BY id;') || '[]');
}
function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/api/login') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const input = JSON.parse(body);
        const account = accounts[input.username];
        if (!account || input.password !== account.password) return json(res, 401, { error: '账号或密码错误' });
        const token = crypto.randomBytes(32).toString('hex');
        sessions.set(token, { role: account.role, label: account.label });
        res.setHeader('Set-Cookie', 'session=' + token + '; HttpOnly; SameSite=Strict; Path=/');
        json(res, 200, sessions.get(token));
      } catch (error) { json(res, 400, { error: '请求格式不正确' }); }
    });
    return;
  }
  const token = (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith('session='));
  const user = token && sessions.get(token.slice(8));
  if (url.pathname.startsWith('/api/') && !user) return json(res, 401, { error: '请先登录' });
  if (req.method === 'GET' && url.pathname === '/api/me') return json(res, 200, user);
  if (req.method === 'POST' && url.pathname === '/api/logout') {
    sessions.delete(token.slice(8));
    res.setHeader('Set-Cookie', 'session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    return json(res, 200, { ok: true });
  }
  if (req.method === 'GET' && url.pathname === '/api/suppliers') {
    try { return json(res, 200, readSuppliers()); }
    catch (error) { return json(res, 500, { error: '读取数据库失败' }); }
  }
  const match = url.pathname.match(/^\/api\/suppliers\/(\d+)$/);
  if (req.method === 'PUT' && match) {
    if (user.role !== 'editor') return json(res, 403, { error: '只读账号不能修改供应商' });
    const id = Number(match[1]);
    if (!Number.isSafeInteger(id)) return json(res, 400, { error: '编号无效' });
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let changes;
      try { changes = JSON.parse(body); }
      catch (error) { return json(res, 400, { error: '请求格式不正确' }); }
      if (typeof changes.name !== 'string' || !changes.name.trim() ||
          typeof changes.contact !== 'string' || typeof changes.phone !== 'string') {
        return json(res, 400, { error: '请输入供应商名称' });
      }
      try {
        if (!readSuppliers(id).length) return json(res, 404, { error: '供应商不存在' });
        query('UPDATE suppliers SET name=' + sqlText(changes.name.trim()) +
          ', contact=' + sqlText(changes.contact.trim()) +
          ', phone=' + sqlText(changes.phone.trim()) + ' WHERE id=' + id + ';');
        return json(res, 200, readSuppliers(id)[0]);
      } catch (error) { return json(res, 500, { error: '保存数据库失败' }); }
    });
    return;
  }
  if (req.method !== 'GET') return json(res, 405, { error: '不支持此操作' });
  const file = path.resolve(__dirname, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(__dirname + path.sep) || file === databasePath || path.extname(file) === '.js' && file !== path.join(__dirname, 'app.js')) return json(res, 403, { error: '禁止访问' });
  fs.readFile(file, (error, content) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(content);
  });
}).listen(4176, '127.0.0.1', () => console.log('打开 http://127.0.0.1:4176'));
