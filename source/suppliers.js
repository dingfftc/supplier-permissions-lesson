(function(){
  'use strict';
  const {SupplierModel,PAGE_SIZE,charCount,capSearch,validate}=window.SupplierDemo;
  const model=new SupplierModel();
  const $=id=>document.getElementById(id);
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fields={name:$('supplier-name'),contact:$('supplier-contact'),phone:$('supplier-phone'),notes:$('supplier-notes')};
  const compositions=new WeakSet();
  let editor=null;
  let toastTimer;
  let focusBeforeConfirm=null;
  function snapshot(){return Object.fromEntries(Object.entries(fields).map(([key,input])=>[key,input.value]));}
  function isDirty(){return editor&&editor.mode!=='view'&&JSON.stringify(snapshot())!==editor.original;}
  function protectComposition(input){
    input.addEventListener('compositionstart',()=>compositions.add(input));
    input.addEventListener('compositionend',()=>compositions.delete(input));
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.isComposing||compositions.has(input)||event.keyCode===229))event.preventDefault();});
  }
  function showToast(message){
    clearTimeout(toastTimer);
    $('toast').innerHTML='<img class="toast-symbol" src="vendor/assets/success.svg" width="20" height="20" alt=""><span>'+escapeHtml(message)+'</span>';
    $('toast').hidden=false;
    toastTimer=setTimeout(()=>$('toast').hidden=true,3000);
  }
  function renderList(){
    const rows=model.visible,total=model.filtered.length;
    $('result-count').textContent='共 '+total+' 家';
    $('supplier-rows').innerHTML=rows.map(row=>'<tr data-supplier-id="'+row.id+'"><td><button type="button" class="table-name-link cell-text" data-route="supplier-detail/'+row.id+'">'+escapeHtml(row.name)+'</button></td><td><span class="cell-text">'+escapeHtml(row.contact)+'</span></td><td><span class="cell-text">'+escapeHtml(row.phone)+'</span></td><td><span class="cell-text">'+escapeHtml(row.notes||'–')+'</span></td><td><div class="row-actions"><button type="button" class="btn text" data-view="'+row.id+'" aria-label="查看'+escapeHtml(row.name)+'详情">详情</button><button type="button" class="btn text" data-edit="'+row.id+'" aria-label="编辑'+escapeHtml(row.name)+'">编辑</button></div></td></tr>').join('');
    $('empty-search').hidden=rows.length>0;
    $('jump-error').textContent='';
    $('pagination').innerHTML='<span class="pagination-summary">共 '+total+' 条</span>'+(total>PAGE_SIZE?'<div class="page-controls" aria-label="供应商列表分页"><button type="button" class="btn page-prev" data-page="'+(model.page-1)+'" aria-label="上一页" '+(model.page===1?'disabled':'')+'><img src="vendor/assets/page-left.svg" width="14" height="14" alt=""></button>'+Array.from({length:model.pageCount},(_,i)=>'<button type="button" class="btn page-number" data-page="'+(i+1)+'" aria-label="第'+(i+1)+'页" '+(model.page===i+1?'aria-current="page"':'')+'>'+(i+1)+'</button>').join('')+'<button type="button" class="btn page-next" data-page="'+(model.page+1)+'" aria-label="下一页" '+(model.page===model.pageCount?'disabled':'')+'><span class="page-arrow" aria-hidden="true"></span></button><form id="jump-form" class="page-jump" novalidate><label for="jump-page">前往</label><input id="jump-page" type="text" inputmode="numeric" value="'+model.page+'" aria-label="跳转页码，输入后按Enter" aria-describedby="jump-error"><span>页</span></form></div>':'');
    document.dispatchEvent(new CustomEvent('eager:suppliers-updated'));
    if(total>PAGE_SIZE){
      protectComposition($('jump-page'));
      $('jump-page').addEventListener('input',()=>{$('jump-page').removeAttribute('aria-invalid');$('jump-error').textContent='';});
      $('jump-form').addEventListener('submit',event=>{
        event.preventDefault();const input=$('jump-page');if(compositions.has(input))return;
        if(!model.setPage(input.value)){$('jump-error').textContent='请输入1至'+model.pageCount+'之间的整数页码';input.setAttribute('aria-invalid','true');return;}
        renderList();resetTableScroll();$('jump-page').focus();
      });
    }
  }
  function resetTableScroll(){document.querySelector('#supplier-view .table-scroll').scrollTop=0;}
  let searchTimer;
  const search=$('supplier-search');
  function applySearch(){clearTimeout(searchTimer);if(compositions.has(search))return;search.value=capSearch(search.value);model.search(search.value);renderList();resetTableScroll();}
  function clearSearch(){search.value='';applySearch();search.focus();}
  function scheduleSearch(){clearTimeout(searchTimer);if(!compositions.has(search)){if(!search.value)applySearch();else searchTimer=setTimeout(applySearch,200);}}
  protectComposition(search);
  search.addEventListener('compositionstart',()=>clearTimeout(searchTimer));
  search.addEventListener('input',()=>{if(!compositions.has(search)){search.value=capSearch(search.value);scheduleSearch();}});
  search.addEventListener('compositionend',()=>{search.value=capSearch(search.value);scheduleSearch();});
  $('search-form').addEventListener('submit',event=>{event.preventDefault();applySearch();});
  $('clear-search').addEventListener('click',clearSearch);
  $('pagination').addEventListener('click',event=>{const button=event.target.closest('[data-page]');if(button&&!button.disabled&&model.setPage(button.dataset.page)){renderList();resetTableScroll();document.querySelector('.page-number[aria-current="page"]')?.focus();}});
  $('supplier-rows').addEventListener('click',event=>{const button=event.target.closest('[data-view],[data-edit]');if(!button)return;const mode=button.hasAttribute('data-view')?'view':'edit';if(mode==='view')openSupplierDrawer(Number(button.dataset.view),button);else openEditor(mode,Number(button.dataset.edit),button);});
  $('add-supplier').addEventListener('click',event=>openEditor('add',null,event.currentTarget));
  function setError(key,message){fields[key].setAttribute('aria-invalid',String(Boolean(message)));$(key+'-error').textContent=message||'';}
  function updateNotes(){
    const count=charCount(fields.notes.value),over=count>500;
    $('notes-count').innerHTML='<span>'+count+'</span><span>/500</span>';
    $('notes-count').classList.toggle('over-limit',over);
    $('notes-count').classList.toggle('empty',count===0);
    setError('notes',over?'已超出 '+(count-500)+' 个字':'');
    requestAnimationFrame(syncTextareaScroll);
  }
  function openEditor(mode,id,trigger){
    const row=id===null?{name:'',contact:'',phone:'',notes:''}:model.get(id);if(!row)return;
    editor={id,mode,trigger,original:'',saving:false,touched:new Set()};
    for(const [key,input] of Object.entries(fields)){input.value=row[key];input.readOnly=mode==='view';setError(key,'');}
    editor.original=JSON.stringify(snapshot());
    $('supplier-dialog-title').textContent=mode==='add'?'新增供应商':mode==='view'?'供应商详情':'编辑供应商';
    $('supplier-save').hidden=mode==='view';$('details-edit').hidden=mode!=='view';$('supplier-cancel').textContent='取消';$('supplier-cancel').hidden=mode==='view';
    $('supplier-dialog').showModal();updateNotes();fields.notes.scrollTop=0;fields.name.focus();
  }
  function closeEditor(){
    const trigger=editor?.trigger;const id=editor?.id;
    $('supplier-dialog').close();editor=null;
    if(trigger?.isConnected)trigger.focus();else(document.querySelector('[data-edit="'+id+'"]')||$('add-supplier')).focus();
  }
  function requestClose(){
    if(!editor||editor.saving)return;
    if(isDirty()){focusBeforeConfirm=document.activeElement;$('confirm-dialog').showModal();$('confirm-continue').focus();}
    else closeEditor();
  }
  ['supplier-close','supplier-cancel'].forEach(id=>$(id).addEventListener('click',requestClose));
  $('confirm-continue').addEventListener('click',()=>{$('confirm-dialog').close();if(focusBeforeConfirm?.isConnected)focusBeforeConfirm.focus();});
  $('confirm-discard').addEventListener('click',()=>{$('confirm-dialog').close();closeEditor();});
  // Source dialogs use explicit close/cancel controls. Esc and backdrop add no undocumented close behavior.
  [$('supplier-dialog'),$('confirm-dialog')].forEach(dialog=>dialog.addEventListener('cancel',event=>event.preventDefault()));
  $('details-edit').addEventListener('click',()=>{
    editor.mode='edit';for(const input of Object.values(fields))input.readOnly=false;
    $('supplier-dialog-title').textContent='编辑供应商';
    $('supplier-cancel').textContent='取消';$('supplier-cancel').hidden=false;$('supplier-save').hidden=false;$('details-edit').hidden=true;fields.name.focus();
  });
  for(const [key,input] of Object.entries(fields)){
    protectComposition(input);
    input.addEventListener('input',()=>{
      if(!editor||editor.mode==='view')return;
      if(key==='notes')updateNotes();
      else if(editor.touched.has(key))setError(key,validate(snapshot())[key]);
    });
    input.addEventListener('blur',()=>{
      if(!editor||editor.mode==='view'||key==='notes')return;
      editor.touched.add(key);setError(key,validate(snapshot())[key]);
    });
  }
  $('supplier-form').addEventListener('submit',event=>{
    event.preventDefault();if(!editor||editor.saving||editor.mode==='view'||Object.values(fields).some(input=>compositions.has(input)))return;
    const data=snapshot(),errors=validate(data);
    for(const key of Object.keys(fields)){editor.touched.add(key);setError(key,errors[key]);}
    updateNotes();
    if(Object.keys(errors).length){fields[Object.keys(errors)[0]].focus();return;}
    editor.saving=true;
    const adding=editor.id===null,result=model.save(editor.id,data);
    if(!result.ok){editor.saving=false;for(const [key,message] of Object.entries(result.errors))setError(key,message);return;}
    if(adding)search.value='';
    renderList();closeEditor();if(adding)resetTableScroll();showToast(adding?'供应商新增成功':'供应商保存成功');
  });
  // The scrollbar DOM and geometry are reused from the verified reference app;
  // only its target is the supplier notes field.
  function syncTextareaScroll(){
    const input=fields.notes,wrap=input.closest('.eager-textarea');if(!$('supplier-dialog').open)return;
    const thumb=wrap.querySelector('.textarea-scrollbar');
    // Reset before measuring so shrinking text reliably leaves scrollable state.
    wrap.classList.remove('is-scrollable');
    const overflowing=input.scrollHeight>input.clientHeight+1;
    wrap.classList.toggle('is-scrollable',overflowing);thumb.hidden=!overflowing;
    if(overflowing){const track=wrap.clientHeight-18,height=Math.max(8,track*input.clientHeight/input.scrollHeight),travel=track-height;thumb.style.height=height+'px';thumb.style.top=(12+travel*input.scrollTop/Math.max(1,input.scrollHeight-input.clientHeight))+'px';}
  }
  fields.notes.addEventListener('scroll',syncTextareaScroll);
  window.addEventListener('resize',syncTextareaScroll);
  document.querySelector('.textarea-scrollbar').addEventListener('pointerdown',event=>{
    const thumb=event.currentTarget,wrap=thumb.closest('.eager-textarea'),input=fields.notes;
    event.preventDefault();const startY=event.clientY,startScroll=input.scrollTop,travel=Math.max(1,wrap.clientHeight-18-thumb.clientHeight),extent=Math.max(0,input.scrollHeight-input.clientHeight);
    wrap.classList.add('scrollbar-dragging');thumb.setPointerCapture(event.pointerId);
    const move=next=>{input.scrollTop=startScroll+(next.clientY-startY)*extent/travel;syncTextareaScroll();};
    const stop=()=>{wrap.classList.remove('scrollbar-dragging');thumb.removeEventListener('pointermove',move);thumb.removeEventListener('pointerup',stop);thumb.removeEventListener('pointercancel',stop);};
    thumb.addEventListener('pointermove',move);thumb.addEventListener('pointerup',stop);thumb.addEventListener('pointercancel',stop);
  });
  window.addEventListener('beforeunload',event=>{if(isDirty()){event.preventDefault();event.returnValue='';}});

  function openSupplierDrawer(id,trigger){
    const row=model.get(id);if(!row)return;
    const html='<section class="drawer-content-block"><h3>基本信息</h3><dl class="record-details"><dt>供应商名称</dt><dd>'+escapeHtml(row.name)+'</dd><dt>联系人</dt><dd>'+escapeHtml(row.contact)+'</dd><dt>联系电话</dt><dd>'+escapeHtml(row.phone)+'</dd><dt>供应商简称</dt><dd>'+escapeHtml(row.shortname||'–')+'</dd><dt>联系地址</dt><dd>'+escapeHtml(row.address||'–')+'</dd><dt>电子邮箱</dt><dd>'+escapeHtml(row.email||'–')+'</dd><dt>档案状态</dt><dd>'+(row.enabled===false?'已停用':'已启用')+'</dd></dl></section><section class="drawer-content-block"><h3>合作备注</h3><p class="record-notes">'+escapeHtml(row.notes||'–')+'</p></section>';
    const drawer=window.EagerUI.openDrawer({title:'供应商详情',html,footerHTML:'<button type="button" class="btn primary" data-supplier-drawer-edit>编辑资料</button>'});

    drawer.querySelector('[data-supplier-drawer-edit]').addEventListener('click',()=>{window.EagerUI.closeDrawer();openEditor('edit',id,trigger);});
  }
  window.EagerSuppliers={
    add(data){const result=model.save(null,{...data,notes:data.notes||''});if(result.ok){search.value='';renderList();resetTableScroll();}return result;},
    openDetails(id){openSupplierDrawer(id,document.activeElement);},
    get(id){const row=model.get(Number(id));return row?{...row}:null;},
    edit(id){openEditor('edit',Number(id),document.activeElement);},
    all(){return model.suppliers.map(row=>({...row}));}
  };

  renderList();
  // Load explicit LOCAL font faces as availability evidence. Do not add these
  // probe faces to document.fonts or change the source component font family.
  // Successful loading still does not prove identical rendered glyphs/antialiasing.
  async function auditLocalFonts(){
    if(typeof FontFace==='undefined'){
      $('font-notice').textContent='当前浏览器无法核查原字体。页面优先使用 PingFang SC，缺失时使用系统 sans-serif；字形与宽度可能不同。';
      $('font-notice').hidden=false;return;
    }
    const probes=[
      {label:'PingFang SC Regular',face:new FontFace('EagerFontAvailabilityRegular','local("PingFangSC-Regular"), local("PingFang SC")',{weight:'400'})},
      {label:'PingFang SC Medium',face:new FontFace('EagerFontAvailabilityMedium','local("PingFangSC-Medium"), local("PingFang SC Medium")',{weight:'500'})}
    ];
    const results=await Promise.allSettled(probes.map(probe=>probe.face.load()));
    const missing=probes.filter((_,index)=>results[index].status==='rejected').map(probe=>probe.label);
    document.documentElement.dataset.fontAvailability=missing.length?'fallback-needed':'source-local-faces-loaded';
    if(missing.length){
      $('font-notice').textContent='未能加载原字体 '+missing.join('、')+'。缺失字重由浏览器匹配，缺失字族使用系统 sans-serif；字形和宽度可能不同。';
      $('font-notice').hidden=false;
    }
  }
  auditLocalFonts();
})();
