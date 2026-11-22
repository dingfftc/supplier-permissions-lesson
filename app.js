let currentUser = null;
let data = [];let page=1,status='',editing=null,original='',composing=false;const $=id=>document.getElementById(id);const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){const q=$('search').value.trim().toLowerCase(),filtered=data.filter(r=>(!q||(r.name+r.contact).toLowerCase().includes(q))&&(!status||r.status===status)), pages=Math.max(1,Math.ceil(filtered.length/20));page=Math.min(page,pages);$('rows').innerHTML=filtered.slice((page-1)*20,page*20).map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.contact)}</td><td>${esc(r.phone)}</td><td><span class="dot" style="background:${r.status==='合作中'?'#00b42a':r.status==='待合作'?'#ff7d00':'#86909c'}"></span>${r.status}</td><td>${r.date}</td><td>${currentUser?.role === "editor" ? `<button class="btn text" data-edit="${r.id}">编辑</button>` : "—"}</td></tr>`).join('');$('empty').hidden=filtered.length>0;$('pagination').innerHTML=`<span>共 ${filtered.length} 条</span>`+(pages>1?`<div class="page-controls"><button class="btn page-prev" data-page="${page-1}" ${page===1?'disabled':''} aria-label="上一页">‹</button>${Array.from({length:pages},(_,i)=>`<button class="btn page-number" data-page="${i+1}" ${page===i+1?'aria-current="page"':''}>${i+1}</button>`).join('')}<button class="btn page-next" data-page="${page+1}" ${page===pages?'disabled':''} aria-label="下一页">›</button></div>`:'');$('search').parentElement.classList.toggle('has-value',!!$('search').value)}
let timer;function apply(){page=1;render()}$('search').addEventListener('compositionstart',()=>{composing=true;clearTimeout(timer)});$('search').addEventListener('compositionend',()=>{composing=false;apply()});$('search').addEventListener('input',()=>{if(!composing){clearTimeout(timer);timer=setTimeout(apply,200)}});$('search-form').onsubmit=e=>{e.preventDefault();if(!composing){clearTimeout(timer);apply()}};$('clear').onclick=()=>{$('search').value='';apply();$('search').focus()};const sel=$('status-select'),st=sel.querySelector('.eager-select-trigger'),popup=sel.querySelector('.eager-select-popup'),clear=sel.querySelector('.eager-select-clear');function closeSelect(){popup.hidden=true;st.setAttribute('aria-expanded','false');sel.classList.remove('is-open')}st.onclick=()=>{popup.hidden=!popup.hidden;st.setAttribute('aria-expanded',String(!popup.hidden));sel.classList.toggle('is-open',!popup.hidden)};popup.onclick=e=>{const option=e.target.closest('[data-value]');if(!option)return;status=option.dataset.value;sel.querySelector('.eager-select-text').textContent='合作状态：'+status;sel.classList.add('has-value');clear.hidden=false;closeSelect();apply()};clear.onclick=()=>{status='';sel.querySelector('.eager-select-text').textContent='合作状态';sel.classList.remove('has-value');clear.hidden=true;apply()};document.addEventListener('click',e=>{if(!sel.contains(e.target))closeSelect()});$('pagination').onclick=e=>{let b=e.target.closest('[data-page]');if(b&&!b.disabled){page=+b.dataset.page;render()}};
const fields = ['name', 'contact', 'phone'];
const editor = $('editor');
const confirmDiscard = $('confirm');
let saving = false;
let closing = false;
let slide;
let noticeTimer;

function snapshot() {
  return JSON.stringify(fields.map(id => $(id).value));
}

function showSaveError(message = '') {
  $('save-message').textContent = message;
  $('save-message').hidden = !message;
}

function setSaving(active) {
  saving = active;
  $('save').textContent = active ? '保存中…' : '保存';
  $('save').setAttribute('aria-disabled', String(active));
  for (const id of ['close', 'cancel', 'save-mode']) $(id).disabled = active;
  for (const id of fields) $(id).readOnly = active;
}

async function closeEditor() {
  if (closing) return;
  closing = true;
  if (slide) {
    slide.reverse();
    await slide.finished.catch(() => {});
  }
  editor.close();
  slide?.cancel();
  slide = undefined;
  ($('rows').querySelector('[data-edit="' + editing.id + '"]') ?? $('search')).focus();
  closing = false;
}

function requestClose() {
  if (saving || closing) return;
  if (snapshot() !== original) confirmDiscard.showModal();
  else closeEditor();
}

$('rows').onclick = event => {
  const button = event.target.closest('[data-edit]');
  if (!button || editor.open) return;
  editing = data.find(row => row.id === Number(button.dataset.edit));
  for (const id of fields) $(id).value = editing[id];
  $('name-error').textContent = '';
  showSaveError();
  $('save-mode').value = 'success';
  original = snapshot();
  editor.showModal();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    slide = editor.animate(
      [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }],
      { duration: 240, easing: 'ease-in-out', fill: 'both' }
    );
  }
  $('name').focus();
};

$('close').onclick = requestClose;
$('cancel').onclick = requestClose;
$('continue').onclick = () => confirmDiscard.close();
$('discard').onclick = () => {
  confirmDiscard.close();
  closeEditor();
};
editor.addEventListener('cancel', event => {
  event.preventDefault();
  requestClose();
});
$('name').addEventListener('input', () => { $('name-error').textContent = ''; });

$('edit-form').onsubmit = async event => {
  event.preventDefault();
  if (saving || closing) return;
  if (!$('name').value.trim()) {
    $('name-error').textContent = '请输入供应商名称';
    $('name').focus();
    return;
  }

  const simulateFailure = $('save-mode').value === 'failure';
  const changes = Object.fromEntries(fields.map(id => [id, $(id).value.trim()]));
  showSaveError();
  setSaving(true);
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (simulateFailure) {
    setSaving(false);
    $('save-mode').value = 'success';
    showSaveError('模拟保存失败，填写的内容已保留。再次点击保存即可重试。');
    $('save').focus();
    return;
  }

  try {
    const response = await fetch('/api/suppliers/' + editing.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes)
    });
    if (!response.ok) throw new Error('保存失败');
    Object.assign(editing, await response.json());
  } catch (error) {
    setSaving(false);
    showSaveError('无法连接服务，修改内容已保留，请重试。');
    return;
  }
  render();
  await closeEditor();
  setSaving(false);
  clearTimeout(noticeTimer);
  $('save-notice').textContent = '保存成功';
  noticeTimer = setTimeout(() => { $('save-notice').textContent = ''; }, 3000);
};

async function loadSession() {
  const response = await fetch('/api/me');
  if (!response.ok) {
    $('login').showModal();
    return;
  }
  currentUser = await response.json();
  $('current-user').textContent = currentUser.label;
  const listResponse = await fetch('/api/suppliers');
  if (!listResponse.ok) {
    $('empty').hidden = false;
    $('empty').textContent = '加载失败，请确认本地服务正在运行。';
    return;
  }
  data = await listResponse.json();
  render();
}
$('login-form').onsubmit = async event => {
  event.preventDefault();
  $('login-error').textContent = '';
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: $('username').value, password: $('password').value })
    });
    if (!response.ok) {
      $('login-error').textContent = '账号或密码错误';
      return;
    }
    $('login').close();
    $('password').value = '';
    await loadSession();
  } catch (error) {
    $('login-error').textContent = '无法连接服务，请重试';
  }
};
$('logout').onclick = async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.reload();
};
loadSession().catch(() => {
  $('empty').hidden = false;
  $('empty').textContent = '加载失败，请确认本地服务正在运行。';
});
