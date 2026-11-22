(function(){
  'use strict';
  const groups=[
    {id:'analysis',label:'经营分析',iconSourceId:'22:103376',items:[{id:'dashboard',label:'经营概览'},{id:'fulfillment',label:'履约工作台'}]},
    {id:'business',label:'业务管理',iconSourceId:'3284:024425',items:[{id:'suppliers',label:'供应商档案'},{id:'orders',label:'采购订单'},{id:'purchase-request',label:'采购申请'}]}
  ];
  const routes=Object.fromEntries(groups.flatMap(g=>g.items.map(i=>[i.id,{...i,parent:g.label}])));
  const expanded={analysis:true,business:true};
  routes['supplier-form']={id:'supplier-form',key:'supplier-form',label:'新增供应商',root:'suppliers'};
  routes['purchase-detail']={id:'purchase-detail',key:'purchase-detail',label:'采购分析明细',root:'dashboard'};
  function resolve(route){if(/^supplier-detail\/\d+$/.test(route)){const id=route.split('/')[1];routes[route]={id,key:'supplier-detail',label:window.EagerSuppliers.get(id)?.name||'供应商详情',root:'suppliers'};}return routes[route];}
  const escapeLabel=v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const nav=document.getElementById('sidebar-nav');
  const confirm=document.getElementById('navigation-confirm');
  let current='dashboard',pending=null,toastTimer,historyIndex=Number.isInteger(history.state?.index)?history.state.index:0,restoringHistory=false;
  function toast(message){
    const el=document.getElementById('toast');el.replaceChildren();
    const icon=document.createElement('img');icon.src='vendor/assets/success.svg';icon.className='toast-symbol';icon.width=20;icon.height=20;icon.alt='';
    const text=document.createElement('span');text.textContent=message;el.append(icon,text);el.hidden=false;
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},3000);
  }
  function drawNavigation(){
    nav.innerHTML=window.EagerUI.navHTML(groups,routes[current].root||current);
    window.EagerUI.hydrateNavIcons(nav);
    for(const [id,open] of Object.entries(expanded)){
      const button=nav.querySelector('[data-nav-group="'+id+'"]'),children=nav.querySelector('[data-nav-children="'+id+'"]');
      if(button)button.setAttribute('aria-expanded',String(open));if(children)children.hidden=!open;
    }
  }
  function activate(route,writeHistory,nextIndex=null){
    current=route;const entry=routes[current];
    document.querySelectorAll('#page-content > section[data-page]').forEach(page=>{page.hidden=page.dataset.page!==(entry.key||current);});
    const parent=groups.find(group=>group.items.some(item=>item.id===(entry.root||route)));expanded[parent.id]=true;
    drawNavigation();document.getElementById('location-label').innerHTML=entry.root?`<nav class="page-breadcrumbs" aria-label="面包屑"><a class="breadcrumb-parent" href="#${entry.root}" data-route="${entry.root}" data-source-id="78:002601">${routes[entry.root].label}<img src="layout-assets/breadcrumb-separator.svg" alt=""></a><span class="breadcrumb-current" aria-current="page" data-source-id="78:002635">${escapeLabel(entry.label)}</span></nav>`:'';
    if(entry.key==='supplier-detail')window.EagerDrilldown.supplier(document.getElementById('supplier-detail-view'),entry.id);
    if(entry.key==='purchase-detail')window.EagerDrilldown.purchase(document.getElementById('purchase-detail-view'),dashboardController.getState());
    document.title=entry.label+' · Eager采购协作';
    if(writeHistory){historyIndex++;history.pushState({route,index:historyIndex},'', '#'+route);}
    else if(Number.isInteger(nextIndex))historyIndex=nextIndex;
    window.scrollTo(0,0);
    document.dispatchEvent(new CustomEvent('eager:route',{detail:{route}}));
  }
  function navigate(route,fromHistory=false,nextIndex=null){
    if(!resolve(route))return;
    if(route===current){if(Number.isInteger(nextIndex))historyIndex=nextIndex;return;}
    if((current==='supplier-form'&&window.EagerBusiness.hasDirtyForm())||(current==='purchase-request'&&window.EagerScenarios.hasDirtyRequest())){
      pending={route,fromHistory,index:nextIndex};
      // A popstate has already moved the history pointer. Restore its position,
      // preserving the destination entry so "continue editing" is reversible.
      if(fromHistory&&Number.isInteger(nextIndex)&&nextIndex!==historyIndex){restoringHistory=true;history.go(historyIndex-nextIndex);}
      if(!confirm.open)confirm.showModal();return;
    }
    activate(route,!fromHistory,nextIndex);
  }
  const ctx={toast,navigate,closeDrawer:()=>window.EagerUI.closeDrawer(),openDrawer:options=>window.EagerUI.openDrawer(options),onSupplierCreated:data=>window.EagerSuppliers.add(data)};
  const dashboard=document.getElementById('dashboard-view');dashboard.innerHTML=window.EagerDashboard.html();const dashboardController=window.EagerDashboard.mount(dashboard,ctx);
  const orders=document.getElementById('orders-view');orders.innerHTML=window.EagerBusiness.ordersHTML();window.EagerBusiness.mountOrders(orders,ctx);
  const form=document.getElementById('supplier-form-view');form.innerHTML=window.EagerBusiness.formHTML();window.EagerBusiness.mountForm(form,ctx);
  form.querySelector('h1').outerHTML='<div class="drill-title"><button type="button" class="page-back" data-route="suppliers" aria-label="返回上一级"><img src="layout-assets/back.svg" alt=""></button><h1>新增供应商</h1></div>';
  const fulfillment=document.getElementById('fulfillment-view');fulfillment.innerHTML=window.EagerScenarios.workbenchHTML();window.EagerScenarios.mountWorkbench(fulfillment,ctx);
  const request=document.getElementById('purchase-request-view');request.innerHTML=window.EagerScenarios.requestHTML();window.EagerScenarios.mountRequest(request,ctx);
  document.addEventListener('eager:suppliers-updated',()=>{const e=routes[current];if(e?.key==='supplier-detail'){window.EagerDrilldown.supplier(document.getElementById('supplier-detail-view'),e.id);e.label=window.EagerSuppliers.get(e.id)?.name||'供应商详情';const crumb=document.querySelector('.breadcrumb-current');if(crumb)crumb.textContent=e.label;document.title=e.label+' · Eager采购协作';}});
  document.addEventListener('click',event=>{
    const route=event.target.closest('[data-route]');if(route){event.preventDefault();navigate(route.dataset.route);return;}
    const group=event.target.closest('[data-nav-group]');if(group){const id=group.dataset.navGroup;expanded[id]=!expanded[id];group.setAttribute('aria-expanded',String(expanded[id]));nav.querySelector('[data-nav-children="'+id+'"]').hidden=!expanded[id];}
  });
  document.getElementById('navigation-continue').addEventListener('click',()=>{pending=null;confirm.close();});
  document.getElementById('navigation-discard').addEventListener('click',()=>{const target=pending;pending=null;if(current==='purchase-request')window.EagerScenarios.discardRequest();else window.EagerBusiness.discardForm();confirm.close();if(target){if(target.fromHistory&&Number.isInteger(target.index)&&target.index!==historyIndex)history.go(target.index-historyIndex);else activate(target.route,!target.fromHistory,target.index);}});
  confirm.addEventListener('cancel',event=>event.preventDefault());
  window.addEventListener('popstate',event=>{if(restoringHistory){restoringHistory=false;return;}navigate(location.hash.slice(1)||'dashboard',true,event.state?.index??null);});
  window.addEventListener('beforeunload',event=>{if(window.EagerBusiness.hasDirtyForm()||window.EagerScenarios.hasDirtyRequest()){event.preventDefault();event.returnValue='';}});
  const initial=location.hash.slice(1);activate(resolve(initial)?initial:'dashboard',false);history.replaceState({route:current,index:historyIndex},'','#'+current);
  window.EagerShell={navigate,toast};
})();
