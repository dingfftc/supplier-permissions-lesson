/* Source-backed table overflow affordance. Track position is attached to the
   viewport's bottom, as a sibling, so vertical table scrolling cannot hide it. */
(function(){
  'use strict';
  const selectors='.table-scroll,.eb-table-scroll,.ed-rank-scroll';
  const instances=new Map();let serial=0,scheduled=false;
  // Inline labels expose the same rendered text anchors used by visual review.
  // Do not measure full-width td/th boxes and mistake their edges for glyph alignment.
  function exposeTextAnchors(table){
    const wrap=(element,attribute)=>{
      if(element.children.length||!element.textContent.trim())return;
      const span=document.createElement('span');span.setAttribute(attribute,'');
      span.textContent=element.textContent;element.replaceChildren(span);
    };
    for(const cell of table.querySelectorAll('th,td')){
      if(cell.closest('table')!==table)continue;
      if(!cell.children.length){wrap(cell,cell.tagName==='TH'?'data-table-header-label':'data-table-cell-value');continue;}
      if(cell.tagName==='TH'||cell.querySelector('.row-actions,.eb-status'))continue;
      // Keep clipping and button hit areas unchanged; measure an inline text
      // child rather than their potentially stretched block boxes.
      for(const leaf of cell.querySelectorAll('button,time,.cell-text,.eb-clip,.ed-supplier-link')){
        if(leaf.closest('table')===table)wrap(leaf,'data-table-cell-value');
      }
    }
  }
  function constrainActions(table){
    exposeTextAnchors(table);
    if(!table.classList.contains('customer-table'))return;
    const groups=[...table.tBodies].flatMap(body=>[...body.rows]).filter(row=>!row.classList.contains('expanded-row')).map(row=>row.cells[row.cells.length-1]).filter(Boolean).map(cell=>({cell,group:cell.querySelector('.row-actions')})).filter(item=>item.group&&item.group.closest('table')===table&&item.group.getClientRects().length);
    if(!groups.length)return;
    table.classList.add('eager-has-actions');
    const widths=groups.map(({cell,group})=>{const children=[...group.children].filter(el=>el.getClientRects().length);const gap=parseFloat(getComputedStyle(group).columnGap)||0;return children.reduce((sum,el)=>sum+el.getBoundingClientRect().width,0)+gap*Math.max(0,children.length-1)+(parseFloat(getComputedStyle(cell).paddingLeft)||0)+24;});
    const col=table.querySelector(':scope > colgroup > col:last-child');
    if(col){const width=Math.max(...widths);if(Math.abs(parseFloat(col.style.width)-width)>.01||!col.style.width)col.style.width=width+'px';}
  }
  // Explicit business-column mapping, not a guess based on the word "操作".
  // Existing customer-table row-actions are also mapped. Nested detail tables,
  // merged rows and tables without a row action group do not gain fake actions.
  function fixedActions(viewport,overflow){
    const table=viewport.querySelector('table');if(!table)return 0;
    const mapped=table.dataset.fixedActions==='right'||(table.dataset.fixedActions!=='none'&&table.classList.contains('eager-has-actions'));
    const header=table.tHead?.rows[table.tHead.rows.length-1]?.lastElementChild;
    const active=!!(mapped&&overflow&&header&&header.colSpan===1);
    table.classList.toggle('eager-fixed-actions-active',active);
    if(!mapped)return 0;
    for(const row of [...table.tHead?.rows||[],...[...table.tBodies].flatMap(body=>[...body.rows])]){
      if(row.classList.contains('expanded-row'))continue;
      const cell=row.cells[row.cells.length-1];if(!cell||cell.colSpan!==1)continue;
      cell.classList.add('eager-fixed-action');
      if(cell.tagName==='TH')cell.classList.add('eager-fixed-action-header');
    }
    return active?header.getBoundingClientRect().width:0;
  }
  function attach(viewport){
    if(instances.has(viewport))return;
    viewport.classList.add('eager-table-managed');
    if(!viewport.id)viewport.id='eager-table-viewport-'+(++serial);
    const rail=document.createElement('div');rail.className='eager-table-scrollbar';rail.hidden=true;
    rail.setAttribute('role','scrollbar');rail.setAttribute('aria-label','表格横向滚动');rail.setAttribute('aria-orientation','horizontal');rail.setAttribute('aria-controls',viewport.id);rail.setAttribute('aria-valuemin','0');rail.tabIndex=0;rail.dataset.sourceId='2214:046076';
    const thumb=document.createElement('span');thumb.className='eager-table-scrollbar-thumb';thumb.dataset.sourceId='2214:046078';rail.append(thumb);viewport.after(rail);
    let frame=0;
    const update=()=>{
      frame=0;if(!viewport.isConnected){rail.remove();observer.disconnect();contentObserver.disconnect();instances.delete(viewport);return;}
      if(!viewport.getClientRects().length){rail.hidden=true;return;}
      if(viewport.matches('#orders-view .eb-table-scroll,#supplier-view .table-scroll')){
        const page=viewport.closest('section[data-page]');
        const footer=page.querySelector('.eb-pagination,.pagination');
        const top=viewport.getBoundingClientRect().top+window.scrollY;
        const available=Math.max(240,window.innerHeight-top-(footer?.getBoundingClientRect().height||48)-47);
        const height=Math.floor(available)+'px';
        if(viewport.style.getPropertyValue('--eager-table-max-height')!==height)viewport.style.setProperty('--eager-table-max-height',height);
      }
      viewport.querySelectorAll('table').forEach(constrainActions);
      const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth),overflow=max>.5;
      const fixedWidth=fixedActions(viewport,overflow);
      rail.hidden=!overflow;
      if(!overflow)return;
      const style=getComputedStyle(viewport),width=Math.max(0,viewport.clientWidth-fixedWidth);
      rail.style.width=width+'px';rail.style.marginLeft=style.marginLeft;rail.style.marginRight=style.marginRight;
      const thumbWidth=width*width/Math.max(width,viewport.scrollWidth-fixedWidth),travel=width-thumbWidth;
      thumb.style.width=thumbWidth+'px';thumb.style.transform='translateX('+(travel*Math.min(max,Math.max(0,viewport.scrollLeft))/max)+'px)';
      rail.setAttribute('aria-valuemax',String(Math.round(max)));rail.setAttribute('aria-valuenow',String(Math.round(viewport.scrollLeft)));
      rail.setAttribute('aria-valuetext','已横向滚动 '+Math.round(viewport.scrollLeft)+' 像素，共 '+Math.round(max)+' 像素');
    };
    const refresh=()=>{if(!frame)frame=requestAnimationFrame(update);};
    const observer=new ResizeObserver(refresh);observer.observe(viewport);
    viewport.querySelectorAll('table').forEach(table=>observer.observe(table));
    const contentObserver=new MutationObserver(()=>{viewport.querySelectorAll('table').forEach(table=>observer.observe(table));refresh();});
    contentObserver.observe(viewport,{subtree:true,childList:true,characterData:true});
    viewport.addEventListener('scroll',refresh,{passive:true});
    rail.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;event.preventDefault();rail.focus({preventScroll:true});
      const max=viewport.scrollWidth-viewport.clientWidth,track=rail.getBoundingClientRect(),thumbRect=thumb.getBoundingClientRect(),travel=track.width-thumbRect.width;
      if(max<=0||travel<=0)return;
      if(event.clientX<thumbRect.left||event.clientX>thumbRect.right)viewport.scrollLeft=Math.min(max,Math.max(0,(event.clientX-track.left-thumbRect.width/2)/travel*max));
      const startX=event.clientX,startScroll=viewport.scrollLeft;
      rail.setPointerCapture(event.pointerId);
      const move=e=>{viewport.scrollLeft=startScroll+(e.clientX-startX)/travel*max;refresh();};
      const stop=()=>{rail.removeEventListener('pointermove',move);rail.removeEventListener('pointerup',stop);rail.removeEventListener('pointercancel',stop);};
      rail.addEventListener('pointermove',move);rail.addEventListener('pointerup',stop);rail.addEventListener('pointercancel',stop);refresh();
    });
    rail.addEventListener('keydown',event=>{
      const max=viewport.scrollWidth-viewport.clientWidth;let next;
      if(event.key==='ArrowLeft')next=viewport.scrollLeft-40;else if(event.key==='ArrowRight')next=viewport.scrollLeft+40;else if(event.key==='Home')next=0;else if(event.key==='End')next=max;else if(event.key==='PageUp')next=viewport.scrollLeft-viewport.clientWidth;else if(event.key==='PageDown')next=viewport.scrollLeft+viewport.clientWidth;else return;
      event.preventDefault();viewport.scrollLeft=Math.min(max,Math.max(0,next));refresh();
    });
    rail.addEventListener('wheel',event=>{const delta=event.deltaX||(event.shiftKey?event.deltaY:0);if(!delta)return;event.preventDefault();viewport.scrollLeft+=delta;refresh();},{passive:false});
    instances.set(viewport,{refresh,update,rail,thumb,observer,contentObserver});refresh();
  }
  function scan(){scheduled=false;document.querySelectorAll(selectors).forEach(attach);instances.forEach(state=>state.refresh());}
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(scan);}}
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',schedule);document.addEventListener('eager:route',schedule);document.addEventListener('eager:content-updated',schedule);
  window.EagerTables={refresh:scan};scan();
})();
