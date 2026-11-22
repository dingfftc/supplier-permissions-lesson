/* Small composition helpers, not a business page template. */
(function(global){
 'use strict';
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clone=v=>JSON.parse(JSON.stringify(v));
 function tagGroup(items,{maxPerRow=null,emptyText='未识别',tone='gray'}={}){
  if(maxPerRow!==null&&(!Number.isInteger(maxPerRow)||maxPerRow<1))throw new TypeError('maxPerRow must be null or a positive integer');
  const labels=items.map(item=>typeof item==='string'?item:item.label);
  if(!labels.length)return `<span class="lp-primary-state" data-text-role="column-primary">${escape(emptyText)}</span>`;
  const size=maxPerRow??labels.length,rows=[];
  for(let i=0;i<labels.length;i+=size)rows.push(labels.slice(i,i+size));
  return `<div class="lp-tags" data-tag-group data-display-only data-tag-mode="display"${maxPerRow===null?'':` data-tag-capacity="${maxPerRow}" data-tag-max-per-row="${maxPerRow}"`}>${rows.map(row=>`<div class="lp-tag-row">${row.map(label=>`<span class="lp-tag${tone==='blue'?' lp-tag-blue':''}" data-tag-item data-source-id="${tone==='blue'?'792:011056':'22:126488'}" title="${escape(label)}">${escape(label)}</span>`).join('')}</div>`).join('')}</div>`;
 }
 function tagFilter(host,{options,value=[],onChange=()=>{}}){
  let selected=new Set(value.map(String));
  function draw(){host.innerHTML=options.map(option=>`<button type="button" class="lp-tag lp-tag-filter" aria-pressed="${selected.has(String(option.value))}" data-tag-value="${escape(option.value)}" data-source-id="${selected.has(String(option.value))?'792:011056':'22:126488'}" data-hover-source-id="792:011056">${escape(option.label)}</button>`).join('');}
  const click=e=>{const button=e.target.closest('[data-tag-value]');if(!button||!host.contains(button))return;const key=button.dataset.tagValue;selected.has(key)?selected.delete(key):selected.add(key);draw();host.querySelector(`[data-tag-value="${CSS.escape(key)}"]`)?.focus({preventScroll:true});onChange([...selected]);};
  host.addEventListener('click',click);draw();
  return {getValue:()=>[...selected],setValue(next,{emit=false}={}){selected=new Set(next.map(String));draw();if(emit)onChange([...selected]);},destroy(){host.removeEventListener('click',click);}};
 }
 function createEditSession(initial,{onCommit=()=>{},equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b),validate=()=>null}={}){
  let committed=clone(initial),draft=clone(initial),pending=false;
  return {
   get:()=>clone(draft),getCommitted:()=>clone(committed),dirty:()=>!equal(draft,committed),isPending:()=>pending,
   replace(next){if(pending)throw new Error('Commit is pending');draft=clone(next);},
   cancel(){if(pending)throw new Error('Commit is pending');draft=clone(committed);return clone(draft);},
   async save(){
    if(pending)return {committed:false,reason:'pending'};
    if(equal(draft,committed))return {committed:false,reason:'unchanged'};
    const error=validate(clone(draft));if(error)return {committed:false,reason:'invalid',error};
    pending=true;const next=clone(draft),previous=clone(committed);
    try{await onCommit(next,previous);committed=clone(next);return {committed:true,value:clone(committed)};}finally{pending=false;}
   }
  };
 }
 function taskToolbar(host,{queries='[data-filter-controls]',actions='[data-filter-actions]',arrangement='compact',reason=''}={}){
  const query=host.querySelector(queries),action=host.querySelector(actions);
  if(!query||!action)throw new TypeError('Map the actual query and action groups');
  host.classList.add('lp-task-toolbar');host.setAttribute('data-table-filters','');
  query.setAttribute('data-filter-controls','');query.classList.add('lp-task-queries');
  action.setAttribute('data-filter-actions','');action.classList.add('lp-task-actions');
  function setArrangement(mode,why=''){
   if(!['compact','separated'].includes(mode))throw new TypeError('Unknown toolbar arrangement');
   if(mode==='separated'&&!String(why).trim())throw new TypeError('Separate groups only with a task-level reason');
   host.dataset.taskToolbar=mode;host.dataset.layoutReason=why;
  }
  setArrangement(arrangement,reason);return {setArrangement};
 }
 global.EagerListPatterns={escape,tagGroup,tagFilter,createEditSession,taskToolbar};
})(typeof window==='undefined'?globalThis:window);
