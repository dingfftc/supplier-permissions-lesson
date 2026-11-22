/* r4 business scenarios. Business content is composed freely; component internals
   reuse the read-only Eager copy assets and verified runtime. */
(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => Number(value).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2});
  const mark = '<img class="eager-required-mark" src="form-assets/required.svg" width="6" height="6" alt="" aria-hidden="true" data-source-id="1120:012962">';
  const status = (label, color) => `<span class="eb-status" data-source-id="${({orange:'2120:041259',gray:'2120:041266',green:'2120:041273',blue:'2120:041287'})[color]}"><img src="business-assets/table-status-${color}.svg" width="8" height="8" alt=""><span>${esc(label)}</span></span>`;
  const tasks = [
    {id:'DF-1030-01',order:'PO20261028006',name:'生产线传感器补货',supplier:'杭州启程工业设备有限公司',category:'设备备件',buyer:'林悦',amount:18600,date:'2026-10-28',dateText:'逾期2天',priority:'orange',contact:'陈博',phone:'138 5712 6831',notes:'已发货，等待供应商补充运单号。',items:'温度传感器 × 20；安装支架 × 20',followed:false},
    {id:'DF-1030-02',order:'PO20261029002',name:'华东仓包装材料',supplier:'苏州森源包装有限公司',category:'包装材料',buyer:'赵宁',amount:12800,date:'2026-10-29',dateText:'逾期1天',priority:'orange',contact:'王静',phone:'139 6251 4920',notes:'部分纸箱已到货，剩余批次交期尚未确认。',items:'五层纸箱 × 2,000；缓冲填充物 × 500',followed:false},
    {id:'DF-1030-03',order:'PO20261026009',name:'质检台检测工具',supplier:'上海明衡仪器有限公司',category:'检测工具',buyer:'林悦',amount:26400,date:'2026-10-30',dateText:'今日交付',priority:'blue',contact:'刘敏',phone:'138 1628 5017',notes:'供应商预计下午送达，需要确认收货联系人。',items:'数显卡尺 × 12；扭力检测仪 × 4',followed:false},
    {id:'DF-1030-04',order:'PO20261027003',name:'办公电脑扩容配件',supplier:'南京联成信息科技有限公司',category:'办公设备',buyer:'陈希',amount:15800,date:'2026-10-31',dateText:'明日交付',priority:'gray',contact:'周凯',phone:'137 7051 2819',notes:'配件已备齐，等待确认送货时段。',items:'内存条 × 20；固态硬盘 × 20',followed:false},
    {id:'DF-1030-05',order:'PO20261028012',name:'车间防护用品',supplier:'宁波安佑劳保用品有限公司',category:'劳保用品',buyer:'赵宁',amount:9600,date:'2026-11-02',dateText:'11月2日交付',priority:'gray',contact:'孙立',phone:'139 5741 3268',notes:'按月度需求备货，需核对手套尺码配比。',items:'防护手套 × 600；护目镜 × 100',followed:false},
    {id:'DF-1030-06',order:'PO20261029015',name:'仓储货架维护配件',supplier:'无锡恒固仓储设备有限公司',category:'仓储配件',buyer:'陈希',amount:7200,date:'2026-11-03',dateText:'11月3日交付',priority:'gray',contact:'许峰',phone:'138 6150 4273',notes:'维护配件到货后统一安排安装。',items:'横梁连接件 × 80；防撞护脚 × 24',followed:false}
  ];

  function workbenchHTML() {
    return `<div class="es-workbench"><section class="es-task-panel" aria-labelledby="es-task-heading"><header class="es-panel-heading"><div class="es-panel-title"><h2 id="es-task-heading">交付跟进</h2><span class="es-secondary" data-followup-summary></span></div><div class="es-filter-actions" aria-label="跟进状态"><button type="button" class="btn outline-blue" data-followup-filter="pending" aria-pressed="true">待跟进</button><button type="button" class="btn secondary" data-followup-filter="done" aria-pressed="false">已跟进</button></div></header><div data-followup-list aria-live="polite"></div></section><aside class="es-schedule-panel" aria-labelledby="es-schedule-heading"><header class="es-schedule-heading"><h2 id="es-schedule-heading">交期安排</h2><span class="es-secondary">2026年10月30日</span></header><div class="es-schedule" data-delivery-schedule></div></aside></div>`;
  }

  function mountWorkbench(container, ctx) {
    const signal = new AbortController();
    let filter = 'pending';
    const on = (target, event, handler) => target.addEventListener(event, handler, {signal:signal.signal});
    function toggle(task) {
      task.followed = !task.followed;
      draw();
      // List/schedule rows are replaced above. Keep keyboard focus on the
      // persistent active filter after a row action or drawer confirmation.
      container.querySelector('[data-followup-filter="'+filter+'"]').focus({preventScroll:true});
      ctx.toast(task.followed ? '已记录跟进' : '已恢复为待跟进');
    }
    function openTask(id) {
      const task = tasks.find(t => t.id === id); if (!task) return;
      const drawer = ctx.openDrawer({
        title:task.name,
        html:`<div class="es-task-detail"><div class="es-detail-top">${status(task.followed?'已跟进':'待跟进',task.followed?'green':'orange')}<span class="es-secondary">${esc(task.id)}</span></div><dl class="es-detail-grid"><dt>采购订单</dt><dd>${esc(task.order)}</dd><dt>供应商</dt><dd>${esc(task.supplier)}</dd><dt>采购品类</dt><dd>${esc(task.category)}</dd><dt>采购员</dt><dd>${esc(task.buyer)}</dd><dt>计划交付</dt><dd>${esc(task.date)}<span class="es-detail-date">${esc(task.dateText)}</span></dd><dt>订单金额</dt><dd>${money(task.amount)} 元</dd><dt>联系人</dt><dd>${esc(task.contact)}<span class="es-detail-phone">${esc(task.phone)}</span></dd></dl><section><h3>采购内容</h3><p>${esc(task.items)}</p></section><section><h3>待确认事项</h3><p>${esc(task.notes)}</p></section></div>`,
        footerHTML:`<button type="button" class="btn primary" data-followup-drawer-toggle>${task.followed?'恢复待跟进':'标记已跟进'}</button>`
      });
      drawer.querySelector('[data-followup-drawer-toggle]').addEventListener('click',()=>{ctx.closeDrawer();toggle(task);});
    }
    function draw() {
      const remaining=tasks.filter(task=>!task.followed).length;
      container.querySelector('[data-followup-summary]').textContent = `${remaining}项待跟进`;
      const visible=tasks.filter(task=>filter==='done'?task.followed:!task.followed);
      container.querySelector('[data-followup-list]').innerHTML=visible.length?visible.map(task=>`<article class="es-task" data-task="${task.id}"><div class="es-task-content"><div class="es-task-top"><button type="button" class="es-task-title" data-open-task="${task.id}">${esc(task.name)}</button>${status(task.followed?'已跟进':task.dateText,task.followed?'green':task.priority)}</div><div class="es-task-meta"><span>${esc(task.supplier)}</span><span>${esc(task.buyer)}</span></div><p class="es-task-note">${esc(task.notes)}</p><div class="es-task-bottom"><span class="es-task-order">${esc(task.order)}</span><div class="es-task-actions"><button type="button" class="btn text" data-toggle-task="${task.id}">${task.followed?'恢复待跟进':'标记已跟进'}</button></div></div></div></article>`).join(''):`<div class="es-empty"><img src="vendor/assets/empty-state.png" width="180" height="90" alt=""><h3>${filter==='done'?'暂无跟进记录':'当前事项已全部跟进'}</h3></div>`;
      container.querySelectorAll('[data-followup-filter]').forEach(button=>{const active=button.dataset.followupFilter===filter;button.classList.toggle('outline-blue',active);button.classList.toggle('secondary',!active);button.setAttribute('aria-pressed',String(active));});
      const dates=[...new Set(tasks.filter(task=>task.date>='2026-10-30').map(task=>task.date))];
      container.querySelector('[data-delivery-schedule]').innerHTML=dates.map(date=>{const items=tasks.filter(task=>task.date===date);return `<section class="es-day"><div class="es-day-date"><strong>${date.slice(5).replace('-','/')}</strong><span>${date==='2026-10-30'?'今天':date==='2026-10-31'?'明天':'计划交付'}</span></div><div class="es-day-items">${items.map(task=>`<button type="button" class="es-schedule-item" data-open-task="${task.id}"><span>${esc(task.name)}</span><small>${esc(task.buyer)} · ${money(task.amount)}元</small></button>`).join('')}</div></section>`;}).join('');
    }
    on(container,'click',event=>{
      const filtering=event.target.closest('[data-followup-filter]');if(filtering){filter=filtering.dataset.followupFilter;draw();return;}
      const opening=event.target.closest('[data-open-task]');if(opening){openTask(opening.dataset.openTask);return;}
      const changing=event.target.closest('[data-toggle-task]');if(changing){const task=tasks.find(t=>t.id===changing.dataset.toggleTask);if(task)toggle(task);}
    });
    draw();
    return {destroy:()=>signal.abort(),getState:()=>({filter,tasks:tasks.map(t=>({...t}))})};
  }

  const categories=[{value:'equipment',label:'设备备件'},{value:'office',label:'办公设备'},{value:'package',label:'包装材料'},{value:'safety',label:'劳保用品'},{value:'other',label:'其他物资'}];
  const freshDraft=()=>({subject:'',category:'',department:'',budget:'',notes:''});
  let requestDraft=freshDraft(),requestStage='edit',requestController=null,serial=1;
  const submissions=[];
  function field(name,label,placeholder,required,attrs='') {return `<div class="eb-form-row"><label class="eb-form-label" for="es-request-${name}">${label}${required?mark:''}</label><div class="eb-field-control"><input class="eager-input" id="es-request-${name}" name="${name}" type="text" placeholder="${placeholder}" ${required?'required aria-required="true"':''} aria-describedby="es-request-${name}-error" autocomplete="off" ${attrs}><p id="es-request-${name}-error" class="field-error" role="alert"></p></div></div>`;}
  function requestHTML() {
    return `<div class="es-request-page eb-page"><div data-request-editor><form class="es-request-form" data-request-form novalidate><section class="eb-form-section" aria-labelledby="es-request-basic"><h2 id="es-request-basic" class="eb-section-heading">采购内容</h2>${field('subject','申请主题','请输入申请主题',true)}<div class="eb-form-row"><label class="eb-form-label" for="es-request-category">采购品类${mark}</label><div class="eb-field-control">${window.EagerSelect.html({id:'es-request-category',label:'采购品类',placeholder:'请选择品类',options:categories,width:120,required:true})}<p id="es-request-category-error" class="field-error" role="alert"></p></div></div>${field('department','使用部门','请输入使用部门',true)}</section><section class="eb-form-section" aria-labelledby="es-request-cost"><h2 id="es-request-cost" class="eb-section-heading">费用与备注</h2>${field('budget','预算金额(元)','请输入预算金额',true,'inputmode="decimal"')}<div class="eb-form-row"><label class="eb-form-label" for="es-request-notes">备注</label><div class="eb-field-control"><div class="eager-textarea"><textarea id="es-request-notes" name="notes" rows="4" placeholder="补充采购用途或规格要求" aria-describedby="es-request-notes-error"></textarea><span class="textarea-scrollbar" aria-hidden="true" hidden></span><img class="textarea-resize" src="vendor/assets/textarea-resize.svg" width="4" height="4" alt=""><span class="textarea-count empty" data-request-count><span>0</span><span>/500</span></span></div><p id="es-request-notes-error" class="field-error" role="alert"></p></div></div></section><footer class="eb-form-footer"><button type="submit" class="btn primary">下一步</button></footer></form></div><section class="es-request-review" data-request-review hidden></section><section class="es-request-result" data-request-result hidden></section></div>`;
  }

  function mountRequest(container,ctx) {
    const signal=new AbortController(),composing=new WeakSet();
    const on=(target,event,handler)=>target.addEventListener(event,handler,{signal:signal.signal});
    const $=selector=>container.querySelector(selector),form=$('[data-request-form]');
    const fields=Object.fromEntries(['subject','department','budget','notes'].map(key=>[key,form.elements.namedItem(key)]));
    let attempted=false;
    const select=window.EagerSelect.mount($('[data-select-id="es-request-category"]'),{onChange:()=>{requestDraft=read();if(attempted||$('#es-request-category').getAttribute('aria-invalid')==='true')setError('category',validate('category'));}});
    $('#es-request-category').setAttribute('aria-describedby','es-request-category-error');
    function read(){return {...Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,field.value])),category:select.getValue()};}
    function control(key){return key==='category'?$('#es-request-category'):fields[key];}
    function setError(key,message){control(key).setAttribute('aria-invalid',String(!!message));$('#es-request-'+key+'-error').textContent=message;}
    function validate(key){const value=key==='category'?select.getValue():fields[key].value.trim();if(['subject','department','budget','category'].includes(key)&&!value)return {subject:'请输入申请主题',department:'请输入使用部门',budget:'请输入预算金额',category:'请选择采购品类'}[key];if(key==='budget'&&(!/^\d+(\.\d{1,2})?$/.test(value)||Number(value)<=0||!Number.isFinite(Number(value))))return '请输入大于0、最多两位小数的金额';if(key==='notes'&&Array.from(fields.notes.value).length>500)return `已超出 ${Array.from(fields.notes.value).length-500} 个字`;return '';}
    function syncScrollbar(){const input=fields.notes;if(!input.getClientRects().length)return;const wrap=input.closest('.eager-textarea'),thumb=wrap.querySelector('.textarea-scrollbar');wrap.classList.remove('is-scrollable');const overflowing=input.scrollHeight>input.clientHeight+1;wrap.classList.toggle('is-scrollable',overflowing);thumb.hidden=!overflowing;if(overflowing){const track=wrap.clientHeight-18,height=Math.max(8,track*input.clientHeight/input.scrollHeight),travel=track-height;thumb.style.height=height+'px';thumb.style.top=(12+travel*input.scrollTop/Math.max(1,input.scrollHeight-input.clientHeight))+'px';}}
    function syncNotes(){const count=Array.from(fields.notes.value).length,counter=$('[data-request-count]');counter.innerHTML=`<span>${count}</span><span>/500</span>`;counter.classList.toggle('empty',count===0);counter.classList.toggle('over-limit',count>500);setError('notes',validate('notes'));requestAnimationFrame(syncScrollbar);}
    function summary(data){return `<dl class="es-review-grid"><dt>申请主题</dt><dd>${esc(data.subject.trim())}</dd><dt>采购品类</dt><dd>${esc(categories.find(c=>c.value===data.category)?.label||'')}</dd><dt>使用部门</dt><dd>${esc(data.department.trim())}</dd><dt>预算金额</dt><dd>${money(data.budget)} 元</dd>${data.notes.trim()?`<dt>备注</dt><dd class="es-preserve-lines">${esc(data.notes.trim())}</dd>`:''}</dl>`;}
    function stage(next){requestStage=next;$('[data-request-editor]').hidden=next!=='edit';$('[data-request-review]').hidden=next!=='review';$('[data-request-result]').hidden=next!=='result';document.dispatchEvent(new CustomEvent('eager:content-changed'));}
    function review(){requestDraft=read();$('[data-request-review]').innerHTML=`<header class="es-review-heading"><h2>确认采购申请</h2><button type="button" class="btn text" data-request-back>返回修改</button></header>${summary(requestDraft)}<footer class="es-review-footer"><button type="button" class="btn primary" data-request-submit>提交申请</button></footer>`;stage('review');$('[data-request-submit]').focus();window.scrollTo(0,0);}
    function submit(){if(requestStage!=='review')return;const record={...requestDraft,subject:requestDraft.subject.trim(),department:requestDraft.department.trim(),notes:requestDraft.notes.trim(),id:'PR20261030'+String(serial++).padStart(3,'0'),budget:Number(requestDraft.budget)};submissions.push(record);$('[data-request-result]').innerHTML=`<div class="es-result-heading"><img src="vendor/assets/success.svg" width="20" height="20" alt=""><h2>采购申请已提交</h2></div><div class="es-result-identity"><span class="es-secondary">申请编号</span><span>${record.id}</span></div>${summary(record)}<footer class="es-review-footer"><button type="button" class="btn primary" data-request-new>继续申请</button><button type="button" class="btn secondary" data-request-show="${record.id}">查看申请</button></footer>`;stage('result');requestDraft=freshDraft();$('[data-request-new]').focus();window.scrollTo(0,0);}
    function reset(){requestDraft=freshDraft();attempted=false;Object.entries(fields).forEach(([key,field])=>{field.value='';setError(key,'');});select.setValue('');setError('category','');syncNotes();stage('edit');}
    Object.entries(fields).forEach(([key,field])=>{
      field.value=requestDraft[key];
      on(field,'compositionstart',()=>composing.add(field));
      on(field,'compositionend',()=>{composing.delete(field);requestDraft=read();if(key==='notes')syncNotes();});
      on(field,'input',()=>{requestDraft=read();if(key==='notes')syncNotes();else if(attempted||field.getAttribute('aria-invalid')==='true')setError(key,validate(key));});
      on(field,'blur',()=>{if(attempted||field.value.trim())setError(key,validate(key));});
      on(field,'keydown',event=>{if(event.key==='Enter'&&(event.isComposing||composing.has(field)||event.keyCode===229))event.preventDefault();});
    });
    on(form,'submit',event=>{event.preventDefault();if(requestStage!=='edit'||Object.values(fields).some(field=>composing.has(field)))return;attempted=true;let first=null;['subject','category','department','budget','notes'].forEach(key=>{const error=validate(key);setError(key,error);if(error&&!first)first=control(key);});if(first){first.focus();return;}review();});
    on(container,'click',event=>{
      if(event.target.closest('[data-request-back]')){stage('edit');requestAnimationFrame(syncScrollbar);fields.subject.focus();return;}
      if(event.target.closest('[data-request-submit]')){submit();return;}
      if(event.target.closest('[data-request-new]')){reset();fields.subject.focus();return;}
      const show=event.target.closest('[data-request-show]');if(show){const record=submissions.find(item=>item.id===show.dataset.requestShow);if(!record)return;ctx.openDrawer({title:record.id,html:`<div class="es-request-drawer">${status('已提交','blue')}${summary(record)}</div>`});}
    });
    on(fields.notes,'scroll',syncScrollbar);on(window,'resize',syncScrollbar);on(document,'eager:route',()=>requestAnimationFrame(syncScrollbar));
    const thumb=$('.textarea-scrollbar');on(thumb,'pointerdown',event=>{event.preventDefault();const input=fields.notes,wrap=input.closest('.eager-textarea'),startY=event.clientY,startScroll=input.scrollTop,travel=Math.max(1,wrap.clientHeight-18-thumb.clientHeight),extent=Math.max(0,input.scrollHeight-input.clientHeight);wrap.classList.add('scrollbar-dragging');thumb.setPointerCapture(event.pointerId);const move=e=>{input.scrollTop=startScroll+(e.clientY-startY)*extent/travel;syncScrollbar();};const stop=()=>{wrap.classList.remove('scrollbar-dragging');thumb.removeEventListener('pointermove',move);thumb.removeEventListener('pointerup',stop);thumb.removeEventListener('pointercancel',stop);};thumb.addEventListener('pointermove',move);thumb.addEventListener('pointerup',stop);thumb.addEventListener('pointercancel',stop);});
    select.setValue(requestDraft.category);syncNotes();stage(requestStage);
    requestController={read,reset};
    return {destroy:()=>{requestDraft=read();signal.abort();select.destroy();requestController=null;},getState:()=>({stage:requestStage,draft:read(),submissions:submissions.map(item=>({...item}))})};
  }
  function hasDirtyRequest(){if(requestStage==='result')return false;if(requestController)requestDraft=requestController.read();return Object.values(requestDraft).some(value=>String(value)!=='');}
  function discardRequest(){if(requestController)requestController.reset();else{requestDraft=freshDraft();requestStage='edit';}}
  window.EagerScenarios={workbenchHTML,mountWorkbench,requestHTML,mountRequest,hasDirtyRequest,discardRequest};
})();
