/* Local prototype data and business rules. No network, storage or backend calls. */
(function(root){
  'use strict';
  const PAGE_SIZE=20;
  const charCount=value=>Array.from(value).length;
  const capSearch=value=>Array.from(value).slice(0,100).join('');
  const seeds=[
    ['上海云帆办公用品有限公司','陈晓'],['杭州青禾包装材料有限公司','林悦'],['苏州恒信精密设备有限公司','王磊'],['宁波启明电子科技有限公司','周宁'],['南京远山文化用品有限公司','李敏'],
    ['无锡百川物流服务有限公司','赵峰'],['上海星途信息技术有限公司','刘洋'],['嘉兴新辰服装辅料有限公司','孙静'],['常州华盈机械制造有限公司','吴斌'],['合肥瑞达印务有限公司','郑颖'],
    ['上海朗途商业服务有限公司','陈楠'],['杭州澄明照明科技有限公司','许诺'],['苏州悦和家居用品有限公司','方晴'],['宁波德润五金有限公司','蒋晨'],['南京创想数字科技有限公司','何涛'],
    ['无锡丰谷食品有限公司','宋佳'],['上海锐新环保科技有限公司','朱琳'],['嘉兴铭盛箱包有限公司','马骏'],['常州启源工业设备有限公司','高翔'],['合肥知行教育用品有限公司','黄莹'],
    ['上海泽远纸业有限公司','陈希'],['杭州新禾工艺品有限公司','徐阳'],['苏州合力精密模具有限公司','梁晨'],['宁波远洋日用品有限公司','陆瑶'],['南京景川展览服务有限公司','沈佳'],
    ['无锡嘉瑞纺织有限公司','唐宁'],['上海和盛办公家具有限公司','许安'],['嘉兴博达塑料制品有限公司','韩雪'],['常州晨光仪器有限公司','顾辰'],['合肥蓝图软件技术有限公司','曹宇'],
    ['上海优联电子商务有限公司','潘悦'],['杭州星河创意设计有限公司','叶琳'],['苏州汇成自动化有限公司','邵华'],['宁波清源清洁用品有限公司','汪岚'],['南京润泽印刷有限公司','丁一'],
    ['无锡恒泰机电有限公司','罗欣'],['上海嘉禾供应链有限公司','陈宇'],['嘉兴信远金属材料有限公司','程远'],['常州绿洲园艺有限公司','田恬'],['合肥安捷物流有限公司','孟浩'],
    ['上海海纳文具有限公司','江月'],['杭州时新礼品有限公司','顾言'],['苏州同创包装科技有限公司','林悦']
  ];
  const remarks=[
    '常用办公耗材供应商，补货前确认库存与交付时间。',
    '可提供定制包装，打样完成后统一确认颜色和规格。',
    '对接设备采购及售后，技术资料需随货提供。',
    '日常联系优先使用电话，订单信息由联系人统一确认。',
    '',
    '合作资料已整理，新增订单前请核对最新报价。',
    '支持分批送货，发货前请提前沟通到货安排。'
  ];
  const makeSeed=()=>seeds.map(([name,contact],index)=>({id:index+1,name,contact,phone:'1380000'+String(1001+index),notes:remarks[index%remarks.length]}));
  function validate(data){
    const errors={};
    for(const [field,label] of [['name','供应商名称'],['contact','联系人'],['phone','联系电话']]){
      if(!String(data[field]||'').trim()) errors[field]='请输入'+label;
    }
    const count=charCount(data.notes||'');
    if(count>500) errors.notes='已超出 '+(count-500)+' 个字';
    return errors;
  }
  class SupplierModel{
    constructor(){this.suppliers=makeSeed();this.query='';this.page=1;this.nextId=this.suppliers.length+1;}
    get filtered(){const key=this.query.toLocaleLowerCase();return this.suppliers.filter(row=>!key||row.name.toLocaleLowerCase().includes(key)||row.contact.toLocaleLowerCase().includes(key));}
    get pageCount(){return Math.max(1,Math.ceil(this.filtered.length/PAGE_SIZE));}
    get visible(){return this.filtered.slice((this.page-1)*PAGE_SIZE,this.page*PAGE_SIZE);}
    search(value){this.query=capSearch(String(value)).trim();this.page=1;}
    setPage(value){const text=String(value).trim();if(!/^\d+$/.test(text))return false;const page=Number(text);if(!Number.isSafeInteger(page)||page<1||page>this.pageCount)return false;this.page=page;return true;}
    get(id){return this.suppliers.find(row=>row.id===id);}
    save(id,data){
      const errors=validate(data);if(Object.keys(errors).length)return {ok:false,errors};
      const normalized={name:data.name.trim(),contact:data.contact.trim(),phone:data.phone.trim(),notes:data.notes};
      for(const key of ['shortname','address','email']) if(Object.prototype.hasOwnProperty.call(data,key)) normalized[key]=String(data[key]||'').trim();
      if(Object.prototype.hasOwnProperty.call(data,'enabled')) normalized.enabled=Boolean(data.enabled);
      let row;
      if(id===null){row={id:this.nextId++,...normalized};this.suppliers.unshift(row);this.search('');}
      else{row=this.get(id);if(!row)return {ok:false,errors:{name:'供应商不存在，请重新打开列表'}};Object.assign(row,normalized);this.page=Math.min(this.page,this.pageCount);}
      return {ok:true,row};
    }
  }
  const api={SupplierModel,PAGE_SIZE,charCount,capSearch,validate,makeSeed};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SupplierDemo=api;
})(typeof window!=='undefined'?window:globalThis);
