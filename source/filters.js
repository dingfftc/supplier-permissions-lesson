/* Single-select behavior composed from the read-only Eager COPY sources.
   Exact geometry and original SVGs: filter-assets/source-nodes.json. */
(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const instances = new WeakMap(), openControls = new Set();
  const widths = [90, 120, 150, 180];
  const defaultSources = {90:'1895:080208',120:'22:156856',150:'22:156850',180:'22:156844'};
  function html({id, label, placeholder='请选择', options=[], width, value='', required=false, disabled=false}) {
    const choices = options.filter(option => String(option.value) !== '');
    const maxLength = Math.max(Array.from(placeholder).length, ...choices.map(option => Array.from(String(option.label)).length));
    const autoWidth = maxLength <= 3 ? 90 : maxLength <= 5 ? 120 : maxLength <= 7 ? 150 : 180;
    const size = widths.includes(Number(width)) ? Number(width) : autoWidth;
    const selected = choices.find(option => String(option.value) === String(value));
    return `<div class="eager-select${selected?' has-value':''}" data-select-id="${esc(id)}" data-select-value="${esc(selected?.value ?? '')}" data-select-placeholder="${esc(placeholder)}" style="width:${size}px"><button type="button" id="${esc(id)}" class="eager-select-trigger" role="combobox" aria-label="${esc(label)}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${esc(id)}-options"${required?' aria-required="true"':''}${disabled?' disabled':''} data-source-id="${defaultSources[size]}"><span class="eager-select-text">${esc(selected?.label ?? placeholder)}</span><img class="eager-select-arrow" src="filter-assets/arrow-down.svg" width="14" height="14" alt=""></button><button type="button" class="eager-select-clear" aria-label="清除${esc(label)}"${selected?'':' hidden'}${disabled?' disabled':''}><img src="filter-assets/clear.svg" width="14" height="14" alt=""></button><div class="eager-select-popup" id="${esc(id)}-options" role="listbox" aria-label="${esc(label)}选项" data-source-id="1483:013183" hidden>${choices.map((option,index)=>`<div id="${esc(id)}-option-${index}" class="eager-select-option" role="option" aria-selected="${String(option.value)===String(selected?.value)}" data-value="${esc(option.value)}" data-source-id="${String(option.value)===String(selected?.value)?'1466:037460':'1466:036684'}">${esc(option.label)}</div>`).join('')}</div></div>`;
  }
  function mount(host, {onChange}={}) {
    if (!host) throw new Error('EagerSelect.mount requires a host element.');
    instances.get(host)?.destroy();
    const signal = new AbortController(), on = (target,event,handler,options={}) => target.addEventListener(event,handler,{...options,signal:signal.signal});
    const trigger=host.querySelector('.eager-select-trigger'), text=host.querySelector('.eager-select-text'), arrow=host.querySelector('.eager-select-arrow'), clearButton=host.querySelector('.eager-select-clear'), popup=host.querySelector('.eager-select-popup'), options=Array.from(popup.querySelectorAll('[role="option"]'));
    let value=host.dataset.selectValue || '', active=-1, open=false;
    function markActive(index,scroll=true) {
      active=Math.max(0,Math.min(options.length-1,index));
      options.forEach((option,i)=>option.classList.toggle('is-active',i===active));
      if(options[active]) {trigger.setAttribute('aria-activedescendant',options[active].id);if(scroll)options[active].scrollIntoView({block:'nearest'});}
    }
    function close() {
      open=false;popup.hidden=true;host.classList.remove('is-open');trigger.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-activedescendant');arrow.src='filter-assets/arrow-down.svg';openControls.delete(close);
    }
    function show(index) {
      if(trigger.disabled || !options.length)return;
      openControls.forEach(other=>{if(other!==close)other();});
      open=true;popup.hidden=false;host.classList.add('is-open');trigger.setAttribute('aria-expanded','true');arrow.src='filter-assets/arrow-up.svg';openControls.add(close);
      const selected=options.findIndex(option=>option.dataset.value===value);
      markActive(index ?? (selected<0?0:selected),false);
      requestAnimationFrame(()=>{if(open)options[active]?.scrollIntoView({block:'nearest'});});
    }
    function setValue(next,{emit=false}={}) {
      const selected=options.find(option=>option.dataset.value===String(next));
      const nextValue=selected?.dataset.value || '', changed=value!==nextValue;value=nextValue;
      host.dataset.selectValue=value;host.classList.toggle('has-value',!!selected);text.textContent=selected?.textContent || host.dataset.selectPlaceholder;
      clearButton.hidden=!selected;
      options.forEach(option=>{const chosen=option===selected;option.setAttribute('aria-selected',String(chosen));option.dataset.sourceId=chosen?'1466:037460':'1466:036684';});
      if(emit&&changed){onChange?.(value,{id:host.dataset.selectId,label:selected?.textContent || ''});host.dispatchEvent(new CustomEvent('eager-select-change',{bubbles:true,detail:{value,label:selected?.textContent || ''}}));}
    }
    function choose(index) {if(options[index])setValue(options[index].dataset.value,{emit:true});close();trigger.focus({preventScroll:true});}
    on(trigger,'click',()=>open?close():show());
    on(clearButton,'click',event=>{event.stopPropagation();setValue('',{emit:true});close();trigger.focus({preventScroll:true});});
    on(popup,'pointerdown',event=>event.preventDefault());
    on(popup,'pointermove',event=>{const option=event.target.closest('[role="option"]');if(option&&popup.contains(option))markActive(options.indexOf(option),false);});
    on(popup,'click',event=>{const option=event.target.closest('[role="option"]');if(option&&popup.contains(option))choose(options.indexOf(option));});
    on(trigger,'keydown',event=>{
      if(event.isComposing||event.keyCode===229)return;
      if(!['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape'].includes(event.key))return;
      if(event.key==='Escape'){if(open){event.preventDefault();event.stopPropagation();close();}return;}
      event.preventDefault();event.stopPropagation();
      if(event.key==='Enter'||event.key===' '){if(open)choose(active);else show();return;}
      if(event.key==='Home'){if(!open)show(0);else markActive(0);return;}
      if(event.key==='End'){if(!open)show(options.length-1);else markActive(options.length-1);return;}
      if(!open){show(event.key==='ArrowUp'?options.length-1:undefined);return;}
      markActive(active+(event.key==='ArrowDown'?1:-1));
    });
    on(document,'pointerdown',event=>{if(open&&!host.contains(event.target))close();},{capture:true});
    on(host,'focusout',event=>{if(!host.contains(event.relatedTarget))close();});
    const api={getValue:()=>value,setValue,clear:()=>{setValue('',{emit:true});close();},destroy:()=>{close();signal.abort();instances.delete(host);}};
    setValue(value);instances.set(host,api);return api;
  }
  window.EagerSelect={html,mount};
})();
