/* Read-only, observable DOM audit. No model state or design document access.
   Consumers may use window.inspectSourceScene() after document.fonts.ready.
   Substituted text stays at source size; overflow is reported, never shrunk. */
(() => {
  'use strict';
  window.inspectSourceScene = (scope = document) => {
    const records = [...scope.querySelectorAll('.mg-node')].map(node => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const expected = [Number(node.dataset.sourceWidth),Number(node.dataset.sourceHeight)];
      const text = node.dataset.textNode === 'true';
      const range = text ? document.createRange() : null;
      if (range) range.selectNodeContents(node);
      const glyph = range ? range.getBoundingClientRect() : null;
      const overflow = text && (node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight || glyph.right > rect.right + .5 || glyph.bottom > rect.bottom + .5);
      return {instanceId:node.dataset.instanceId,renderId:node.id,sourceNodeId:node.dataset.sourceId,name:node.dataset.sourceName,width:rect.width,height:rect.height,expectedWidth:expected[0],expectedHeight:expected[1],widthDelta:rect.width-expected[0],heightDelta:rect.height-expected[1],geometryMatches:rect.width===expected[0]&&rect.height===expected[1],potentialTextOverflow:!!overflow,font:style.font,color:style.color,background:style.backgroundColor};
    });
    const textSlots = [...scope.querySelectorAll('[data-text-slot]')].map(node => {
      const range=document.createRange();range.selectNodeContents(node);
      const rect=node.getBoundingClientRect();const glyph=range.getBoundingClientRect();
      const lines=[...range.getClientRects()].map(r=>({x:r.x,y:r.y,width:r.width,height:r.height}));
      const forcedLineBreaks=node.querySelectorAll('br').length;
      const declaredLineLimit=node.dataset.sourceLineLimit?Number(node.dataset.sourceLineLimit):null;
      const sourceSampleHeight=Number(node.dataset.sourceTextHeight)||null;
      const clips=[];
      for(let parent=node.parentElement;parent;parent=parent.parentElement){
        const s=getComputedStyle(parent),r=parent.getBoundingClientRect();
        if(['hidden','clip','scroll','auto'].includes(s.overflowX)||['hidden','clip','scroll','auto'].includes(s.overflowY))clips.push({sourceNodeId:parent.dataset.sourceId,overflowX:s.overflowX,overflowY:s.overflowY,clipRect:{x:r.x,y:r.y,width:r.width,height:r.height},glyphOutside:{left:Math.max(0,r.left-glyph.left),right:Math.max(0,glyph.right-r.right),top:Math.max(0,r.top-glyph.top),bottom:Math.max(0,glyph.bottom-r.bottom)}});
        if(parent.classList.contains('mg-scene'))break;
      }
      return {instanceId:node.closest('.mg-scene')?.dataset.instanceId,slotId:node.dataset.textSlot,text:node.innerText,overridden:node.dataset.slotOverridden==='true',forcedLineBreaks,sourceForcedBreaks:Number(node.dataset.sourceBreaks)||0,declaredLineLimit,lineLimitExceeded:declaredLineLimit!==null&&forcedLineBreaks+1>declaredLineLimit,sourceSampleHeight,heightExceedsSourceSample:sourceSampleHeight!==null&&rect.height>sourceSampleHeight,box:{width:rect.width,height:rect.height},glyphLineRects:lines,clippingAncestors:clips,font:getComputedStyle(node).font,note:'Text adaptation may change width. Source sample height is not by itself a universal line limit; declared line limits and family policy take priority. Glyph range bounds include font metrics. No font shrinking occurs.'};
    });
    return {status:'measured-not-visually-approved',viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},fontLoadingStatus:document.fonts.status,fontAvailability:'Not proven by CSS font-family or FontFaceSet.check; verify installed source font separately',records,geometryDifferences:records.filter(x=>!x.geometryMatches),potentialTextOverflows:records.filter(x=>x.potentialTextOverflow),textSlots};
  };
})();
