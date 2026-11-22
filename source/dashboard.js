/* Eager local snapshot 2026-10-29, renderer 0.10.6. No external dependencies. */
(function () {
  'use strict';
  const suppliers = [
    {name:'上海云帆办公用品有限公司',category:'办公用品',contact:'陈晓',city:'上海',delivery:'99.2%'},
    {name:'杭州青禾包装材料有限公司',category:'包装材料',contact:'林悦',city:'杭州',delivery:'98.7%'},
    {name:'苏州恒信精密设备有限公司',category:'生产设备',contact:'王磊',city:'苏州',delivery:'97.5%'},
    {name:'宁波启明电子科技有限公司',category:'电子设备',contact:'周宁',city:'宁波',delivery:'96.8%'},
    {name:'南京远山文化用品有限公司',category:'文化用品',contact:'李敏',city:'南京',delivery:'98.1%'}
  ];
  const baseDays = [2.9,3.8,3.4,4.1,2.8,3.5,4.8,4.3,5.1,3.7,4.2,4.7,3.8,3.1,4.6,5.4,4.9,3.8,4.5,5.7,4.8,4.1,5.2,4.3,3.9,5.6,4.8,5.9,5.4,6.2];
  function distribute(total,weights) { const sum=weights.reduce((a,b)=>a+b,0), out=weights.map(v=>Math.round(total*v/sum)); out[out.length-1]+=total-out.reduce((a,b)=>a+b,0); return out; }
  function dataset(days) {
    const is30=days===30,total=is30?1286000:324000;
    const daily=distribute(total,is30?baseDays:baseDays.slice(-7));
    return {days,total,daily,orders:is30?486:112,active:is30?36:21,onTime:is30?'97.8':'98.2',changes:is30?['+12.6%','+8.5%','+5.9%','-0.4%']:['+7.3%','+5.7%','+10.5%','+0.8%'],categories:distribute(total,is30?[30,26,19,15,10]:[25,28,18,17,12]),rankAmounts:is30?[268500,224600,188200,153800,116700]:[68700,75200,42600,38800,29700],rankOrders:is30?[104,83,72,61,46]:[24,27,18,15,11],start:is30?'09-30':'10-23',end:'10-29'};
  }
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const yuan = value => value.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
  const wan = value => (value/10000).toFixed(2);
  function dayLabel(index,days) { const date=new Date(Date.UTC(2026,9,30-days+index)); return `${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`; }
  function metric(title,value,unit,change,index) {
    const primary=index===0;
    const numberId=primary?'2284:035949':'2284:035955',numberTextId=primary?'2284:035950':'2284:035956';
    // A business unit can replace the source unit text slot. Source family and
    // typography stay intact: primary16, supporting14; both are weight500.
    const units=[['2284:036132','2284:036133'],['2284:036048','2284:036049'],['2284:036926','2284:036927'],['2284:036194','2284:036195']];
    const [unitId,unitTextId]=units[index];
    return `<article class="ed-metric ${primary?'ed-metric-primary':'ed-metric-supporting'}" data-metric="${index}"><div class="ed-metric-title" data-source-id="2284:033392" data-text-slot="node:2284:033393">${title}</div><div class="ed-metric-amount" data-ink-pair><span class="ed-metric-number" data-source-id="${numberId}" data-text-slot="node:${numberTextId}" data-ink-number><span data-value data-ink-text>${value}</span><i class="ed-baseline-marker" aria-hidden="true"></i></span><span class="ed-metric-unit" data-source-id="${unitId}" data-text-slot="node:${unitTextId}" data-ink-unit><span data-ink-text>${unit}</span><i class="ed-baseline-marker" aria-hidden="true"></i></span></div><div class="ed-metric-change" data-source-id="${change.startsWith('-')?'2284:037035':'2284:037025'}"><span data-text-slot="node:${change.startsWith('-')?'2284:037037':'2284:037027'}">环比</span><span data-change data-text-slot="node:${change.startsWith('-')?'2284:037040':'2284:037030'}" class="${change.startsWith('-')?'ed-down':''}">${change}</span></div></article>`;
  }
  function detailAmount(amount){return `<div class="ed-detail-total" data-ink-pair><span data-ink-number><span data-ink-text>${yuan(amount)}</span><i class="ed-baseline-marker" aria-hidden="true"></i></span><span data-ink-unit><span data-ink-text>元</span><i class="ed-baseline-marker" aria-hidden="true"></i></span></div>`;}
  function html() {
    const d=dataset(30);
    return `<div class="ed-dashboard ed-designed visualization-page" data-composition="custom"><section class="ed-summary page-frame" aria-label="采购经营指标"><header class="ed-heading"><div class="ed-period" aria-label="统计周期"><span class="ed-period-range">2026-09-30 至 2026-10-29</span><button type="button" class="btn secondary" data-period="7" aria-pressed="false">近7天</button><button type="button" class="btn primary" data-period="30" aria-pressed="true">近30天</button></div></header><section class="ed-metrics" aria-label="核心经营指标">${metric('采购金额',wan(d.total),'万',d.changes[0],0)+metric('采购订单',d.orders,'笔',d.changes[1],1)+metric('采购供应商',d.active,'家',d.changes[2],2)+metric('准时交付',d.onTime,'%',d.changes[3],3)}</section></section><div class="ed-charts"><section class="ed-panel page-frame"><div class="ed-panel-head"><h2>采购金额趋势</h2><span class="ed-chart-unit">单位：万元</span></div><div class="ed-chart-wrap" data-chart="trend"></div></section><section class="ed-panel page-frame"><div class="ed-panel-head"><h2>品类采购构成</h2><span class="ed-chart-unit">单位：万元</span></div><div class="ed-chart-wrap" data-chart="category"></div></section></div><section class="ed-panel ed-rank-panel page-frame"><div class="ed-panel-head"><h2>供应商采购排行</h2><button type="button" class="btn text" data-all-suppliers>全部供应商</button></div><div class="ed-rank-scroll"><table class="customer-table ed-rank-table"><colgroup><col style="width:64px"><col style="width:28%"><col style="width:14%"><col style="width:16%"><col style="width:12%"><col style="width:20%"></colgroup><thead><tr><th>排名</th><th>供应商名称</th><th>主要品类</th><th class="ed-num">采购金额(元)</th><th class="ed-num">订单数</th><th class="ed-num">采购占比</th></tr></thead><tbody data-supplier-rows></tbody></table></div></section><p class="ed-font-note" data-font-note>缺少 Bebas，数字使用 Bebas Neue 或系统无衬线字体。</p></div>`;
  }
  function mount(container,ctx) {
    const root=container.querySelector('.ed-dashboard') || container;
    let days=30,d=dataset(days),selectedDay=29,selectedCategory=0;
    const $=selector=>root.querySelector(selector);
    const categoryNames=['办公用品','包装材料','生产设备','电子设备','文化用品'];
    const categoryShort=['办公','包装','设备','电子','文化'];
    // The entire source bubble is retained at its native viewBox geometry.
    // Only the explicitly custom data region receives business text.
    const tooltip=document.createElement('div');
    tooltip.id='ed-chart-data-tooltip';tooltip.className='ed-data-tooltip';tooltip.hidden=true;tooltip.setAttribute('role','tooltip');tooltip.dataset.sourceId='2251:051412';
    tooltip.innerHTML='<img class="ed-tooltip-bubble" src="chart-tooltip-assets/source-bubble.svg" alt="" aria-hidden="true"><div class="ed-tooltip-content" data-source-id="2251:051416"></div>';
    document.body.append(tooltip);
    let tooltipTarget=null,focusTarget=null,pointerTarget=null;
    function hideTooltip(){
      if(tooltipTarget)tooltipTarget.removeAttribute('aria-describedby');
      tooltipTarget=null;tooltip.hidden=true;
    }
    function tooltipRows(target){
      const isDay=target.hasAttribute('data-day'),index=Number(isDay?target.dataset.day:target.dataset.category);
      const amount=isDay?d.daily[index]:d.categories[index];
      const header=isDay?['日期','2026-'+dayLabel(index,days)]:['品类',categoryNames[index]];
      return [header,['采购金额',yuan(amount)+'元'],['统计周期','近'+days+'天'],['周期占比',(amount/d.total*100).toFixed(1)+'%']].map((row,i)=>`<div class="ed-tooltip-row ${i===1?'ed-tooltip-row-divider':''}" data-tooltip-row="${i}"><span class="ed-tooltip-label">${i===1?'<span class="ed-tooltip-swatch" data-source-id="2251:051431"></span>':''}${esc(row[0])}</span><span class="ed-tooltip-value">${esc(row[1])}</span></div>`).join('');
    }
    function showTooltip(target,event){
      if(!target||!root.getClientRects().length){hideTooltip();return;}
      if(target.hasAttribute('data-day'))showDay(Number(target.dataset.day));else showCategory(Number(target.dataset.category));
      if(tooltipTarget!==target){if(tooltipTarget)tooltipTarget.removeAttribute('aria-describedby');tooltipTarget=target;target.setAttribute('aria-describedby',tooltip.id);tooltip.querySelector('.ed-tooltip-content').innerHTML=tooltipRows(target);}
      tooltip.dataset.chart=target.hasAttribute('data-day')?'trend':'category';
      tooltip.hidden=false;
      const anchor=(target.querySelector('.ed-point,.ed-bar')||target).getBoundingClientRect();
      const pointer=event&&Number.isFinite(event.clientX)&&event.type.startsWith('pointer');
      const x=pointer?event.clientX:anchor.left+anchor.width/2,y=pointer?event.clientY:anchor.top+anchor.height/2;
      const w=252.11231994628906,h=185.00001525878906,gap=12;
      const side=x+gap+w+16<=window.innerWidth?'right':'left';
      tooltip.dataset.side=side;
      tooltip.style.left=Math.max(16,Math.min(window.innerWidth-w-16,side==='right'?x+gap:x-gap-w))+'px';
      tooltip.style.top=Math.max(12,Math.min(window.innerHeight-h-20,y-46))+'px';
    }
    const isChartTarget=element=>element?.closest?.('[data-day],[data-category]');
    const routeListener=()=>{pointerTarget=null;focusTarget=null;hideTooltip();};
    document.addEventListener('eager:route',routeListener);
    const scrollListener=()=>{pointerTarget=null;hideTooltip();};
    window.addEventListener('scroll',scrollListener,true);
    function detail(title,body,route) {
      hideTooltip();
      const dialog=ctx.openDrawer({title,html:`<div class="ed-drawer-content">${body}</div>`,footerHTML:`<button type="button" class="btn primary" data-dashboard-route="${route}">${route==='purchase-detail'?'查看采购分析明细':route==='orders'?'查看采购订单':'查看供应商列表'}</button>`});
      window.EagerMetricAlignment?.align(dialog);
      if(dialog && dialog.querySelector) dialog.querySelector('[data-dashboard-route]')?.addEventListener('click',()=>{
        if(typeof ctx.closeDrawer==='function')ctx.closeDrawer();
        else if(typeof window.EagerUI?.closeDrawer==='function')window.EagerUI.closeDrawer();
        else {const close=dialog.querySelector('[data-drawer-close],.eui-drawer-close');if(close)close.click();}
        ctx.navigate(route);
      });
    }
    function showDay(index) {selectedDay=index;root.querySelectorAll('[data-day]').forEach(el=>el.classList.toggle('ed-selected',+el.dataset.day===index));}
    function dayDetail() {const amount=d.daily[selectedDay];detail(`${dayLabel(selectedDay,days)} 采购概况`,`<p>2026-${dayLabel(selectedDay,days)}</p><div class="ed-detail-label">采购金额</div>${detailAmount(amount)}<dl><dt>统计口径</dt><dd>当日已确认采购订单金额</dd><dt>统计周期</dt><dd>近${days}天</dd><dt>周期占比</dt><dd>${(amount/d.total*100).toFixed(1)}%</dd></dl>`,'purchase-detail');}
    function showCategory(index) {selectedCategory=index;}
    function categoryDetail() {const amount=d.categories[selectedCategory];detail(categoryNames[selectedCategory],`<div class="ed-detail-label">采购金额</div>${detailAmount(amount)}<dl><dt>采购占比</dt><dd>${(amount/d.total*100).toFixed(1)}%</dd><dt>统计区间</dt><dd>2026-${d.start} 至 2026-${d.end}</dd></dl>`,'purchase-detail');}
    function supplierDetail(index) {const s=suppliers[index];detail(s.name,`<div class="ed-detail-label">采购金额</div>${detailAmount(d.rankAmounts[index])}<dl><dt>主要品类</dt><dd>${s.category}</dd><dt>所在地</dt><dd>${s.city}</dd><dt>联系人</dt><dd>${s.contact}</dd><dt>采购订单</dt><dd>${d.rankOrders[index]} 笔</dd><dt>准时交付率</dt><dd>${s.delivery}</dd><dt>采购占比</dt><dd>${(d.rankAmounts[index]/d.total*100).toFixed(1)}%</dd><dt>统计区间</dt><dd>2026-${d.start} 至 2026-${d.end}</dd></dl>`,'suppliers');}
    function renderTrend() {
      const wrap=$('[data-chart="trend"]'),w=Math.max(wrap.clientWidth,260),h=242,left=32,right=12,top=18,bottom=34,pw=w-left-right,ph=h-top-bottom,max=Math.ceil(Math.max(...d.daily)/10000/2)*2;
      const labelContext=document.createElement('canvas').getContext('2d');labelContext.font='12px "PingFang SC", sans-serif';
      const labelHalf=Math.max(...d.daily.map((_,i)=>labelContext.measureText(dayLabel(i,days)).width))/2+2;
      const point=(value,i)=>[left+labelHalf+(pw-2*labelHalf)*i/(d.daily.length-1),top+ph*(1-value/10000/max)];
      let svg=`<svg class="ed-chart" viewBox="0 0 ${w} ${h}" role="group" aria-label="近${days}天采购金额折线图">`;
      for(let i=0;i<5;i++){const y=top+ph*i/4;svg+=`<line class="ed-grid" x1="${left}" y1="${y}" x2="${w-right}" y2="${y}"/><text x="${left-10}" y="${y+4}" text-anchor="end">${(max*(1-i/4)).toFixed(max%4?1:0)}</text>`;}
      svg+=`<path class="ed-line" d="${d.daily.map((v,i)=>{const[x,y]=point(v,i);return `${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`;}).join(' ')}"/>`;
      d.daily.forEach((v,i)=>{const[x,y]=point(v,i),label=dayLabel(i,days),labelStep=days===7?1:6;svg+=`<g data-day="${i}" role="button" tabindex="0" aria-label="${label}，采购金额${wan(v)}万元，查看明细"><circle cx="${x}" cy="${y}" r="12" fill="transparent"/><circle class="ed-point" cx="${x}" cy="${y}" r="${days===7?4:2.5}"/></g>`;if(i%labelStep===0||i===days-1)svg+=`<text x="${x}" y="${h-8}" text-anchor="middle" data-date-index="${i}">${label}</text>`;});
      wrap.innerHTML=svg+'</svg>';showDay(Math.min(selectedDay,days-1));
    }
    function renderCategory() {
      const wrap=$('[data-chart="category"]'),w=Math.max(wrap.clientWidth,240),h=242,left=34,right=8,top=18,bottom=34,pw=w-left-right,ph=h-top-bottom,max=Math.ceil(Math.max(...d.categories)/10000/10)*10,step=pw/5,barWidth=Math.min(36,step-14);
      let svg=`<svg class="ed-chart" viewBox="0 0 ${w} ${h}" role="group" aria-label="近${days}天品类采购金额柱状图">`;
      for(let i=0;i<5;i++){const y=top+ph*i/4;svg+=`<line class="ed-grid" x1="${left}" y1="${y}" x2="${w-right}" y2="${y}"/><text x="${left-10}" y="${y+4}" text-anchor="end">${(max*(1-i/4)).toFixed(max%4?1:0)}</text>`;}
      d.categories.forEach((v,i)=>{const x=left+step*(i+.5),barH=v/10000/max*ph,y=top+ph-barH;svg+=`<g data-category="${i}" tabindex="0" role="button" aria-label="${categoryNames[i]}，${wan(v)}万元，查看明细"><rect x="${x-step/2}" y="${top}" width="${step}" height="${ph+bottom}" fill="transparent"/><rect class="ed-bar" x="${x-barWidth/2}" y="${y}" width="${barWidth}" height="${barH}"/><rect class="ed-bar-hover" x="${x-barWidth/2}" y="${y}" width="${barWidth}" height="${barH}"/><text class="ed-bar-value" x="${x}" y="${Math.max(y-8,12)}" text-anchor="middle">${(v/10000).toFixed(1)}</text><text class="ed-bar-name" x="${x}" y="${h-8}" text-anchor="middle">${categoryShort[i]}</text></g>`;});
      wrap.innerHTML=svg+'</svg>';showCategory(selectedCategory);
    }
    function renderRows() {const sorted=suppliers.map((s,i)=>({...s,i})).sort((a,b)=>d.rankAmounts[b.i]-d.rankAmounts[a.i]);$('[data-supplier-rows]').innerHTML=sorted.map((s,rank)=>{const share=(d.rankAmounts[s.i]/d.total*100).toFixed(1);return `<tr><td class="ed-rank">${rank+1}</td><td><button type="button" class="ed-supplier-link" data-supplier="${s.i}">${esc(s.name)}</button></td><td>${s.category}</td><td class="ed-num">${yuan(d.rankAmounts[s.i])}</td><td class="ed-num">${d.rankOrders[s.i]}</td><td class="ed-num">${share}%</td></tr>`;}).join('');}
    function renderAll() {const values=[wan(d.total),d.orders,d.active,d.onTime];root.querySelectorAll('[data-metric]').forEach((card,i)=>{card.querySelector('[data-value]').textContent=values[i];const change=card.querySelector('[data-change]');change.textContent=d.changes[i];change.classList.toggle('ed-down',d.changes[i].startsWith('-'));change.dataset.textSlot='node:'+ (d.changes[i].startsWith('-')?'2284:037040':'2284:037030');card.querySelector('.ed-metric-change > span:first-child').dataset.textSlot='node:'+ (d.changes[i].startsWith('-')?'2284:037037':'2284:037027');card.querySelector('.ed-metric-change').dataset.sourceId=d.changes[i].startsWith('-')?'2284:037035':'2284:037025';});root.querySelectorAll('[data-period]').forEach(button=>{const active=+button.dataset.period===days;button.classList.toggle('primary',active);button.classList.toggle('secondary',!active);button.setAttribute('aria-pressed',String(active));});$('.ed-period-range').textContent=`2026-${d.start} 至 2026-${d.end}`;renderTrend();renderCategory();renderRows();window.EagerMetricAlignment?.align(root);}
    root.addEventListener('click',event=>{const target=event.target.closest('[data-period],[data-day],[data-category],[data-day-detail],[data-category-detail],[data-supplier],[data-all-suppliers]');if(!target)return;if(target.hasAttribute('data-period')){hideTooltip();days=+target.dataset.period;d=dataset(days);selectedDay=days-1;renderAll();}else if(target.hasAttribute('data-day')){showDay(+target.dataset.day);dayDetail();}else if(target.hasAttribute('data-category')){showCategory(+target.dataset.category);categoryDetail();}else if(target.hasAttribute('data-day-detail'))dayDetail();else if(target.hasAttribute('data-category-detail'))categoryDetail();else if(target.hasAttribute('data-supplier'))supplierDetail(+target.dataset.supplier);else ctx.navigate('suppliers');});
    root.addEventListener('pointerover',event=>{const target=isChartTarget(event.target);if(target){pointerTarget=target;showTooltip(target,event);}});
    root.addEventListener('pointermove',event=>{const target=isChartTarget(event.target);if(target){pointerTarget=target;showTooltip(target,event);}});
    root.addEventListener('pointerout',event=>{const target=isChartTarget(event.target);if(target&&isChartTarget(event.relatedTarget)!==target){pointerTarget=null;if(focusTarget)showTooltip(focusTarget);else hideTooltip();}});
    root.addEventListener('focusin',event=>{const target=isChartTarget(event.target);if(target){focusTarget=target;showTooltip(target);}});
    root.addEventListener('focusout',event=>{const target=isChartTarget(event.target);if(target&&isChartTarget(event.relatedTarget)!==target){focusTarget=null;if(pointerTarget)showTooltip(pointerTarget);else hideTooltip();}});
    root.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-day],[data-category]')){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
    renderAll();
    let size=0;const observer=new ResizeObserver(()=>{const next=Math.round($('[data-chart="trend"]').clientWidth);if(next>0&&next!==size){hideTooltip();pointerTarget=null;focusTarget=null;size=next;renderTrend();renderCategory();}});observer.observe(root);
    // Width comparison is only a load hint. It is not a claim of exact browser glyph provenance.
    if(document.fonts)document.fonts.ready.then(()=>{const canvas=document.createElement('canvas'),c=canvas.getContext('2d');c.font='36px monospace';const base=c.measureText('0123456789').width;c.font='36px "Bebas", monospace';const original=c.measureText('0123456789').width;if(original!==base)$('[data-font-note]').hidden=true;});
    return {destroy(){observer.disconnect();hideTooltip();tooltip.remove();document.removeEventListener('eager:route',routeListener);window.removeEventListener('scroll',scrollListener,true);},getState(){return {days,total:d.total,daily:[...d.daily],start:d.start,end:d.end,dailyTotal:d.daily.reduce((a,b)=>a+b,0),categoryTotal:d.categories.reduce((a,b)=>a+b,0),selectedDay,selectedCategory};}};
  }
  window.EagerDashboard={html,mount};
})();
