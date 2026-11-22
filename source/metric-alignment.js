/* Align visible glyph bottoms, including when the original font is missing.
   A DOM zero-height inline marker locates the actual alphabetic baseline.
   Canvas metrics use the exact computed font, not a fixed per-font CSS offset. */
(function(){
  'use strict';
  const context=document.createElement('canvas').getContext('2d');
  function ink(element){
    const label=element.querySelector('[data-ink-text]'),marker=element.querySelector('.ed-baseline-marker');
    const style=getComputedStyle(label);
    context.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    // Numeric punctuation (e.g. a thousands comma) may descend below the digits.
    // Align the unit with numeral glyphs rather than with a comma tail.
    const text=element.hasAttribute('data-ink-number')?(label.textContent.replace(/[^0-9]/g,'')||label.textContent):label.textContent;
    const metrics=context.measureText(text);
    return {bottom:marker.getBoundingClientRect().top+metrics.actualBoundingBoxDescent,font:context.font,descent:metrics.actualBoundingBoxDescent};
  }
  function align(root=document){
    if(!root)return;
    for(const pair of root.querySelectorAll('[data-ink-pair]')){
      if(!pair.getClientRects().length)continue;
      const number=pair.querySelector('[data-ink-number]'),unit=pair.querySelector('[data-ink-unit]');
      if(!number||!unit)continue;
      unit.style.transform='none';
      const n=ink(number),u=ink(unit),offset=n.bottom-u.bottom;
      unit.style.transform=`translateY(${offset}px)`;
      // Diagnostics for this render; screenshots and changed-font checks remain required.
      pair.dataset.inkEvidence=JSON.stringify({number:n,unitBefore:u,offset,unitAfter:ink(unit),delta:ink(unit).bottom-n.bottom});
    }
  }
  window.EagerMetricAlignment={align};
  document.addEventListener('eager:route',()=>requestAnimationFrame(()=>align()));
  window.addEventListener('resize',()=>requestAnimationFrame(()=>align()));
  document.fonts?.ready.then(()=>align());
  document.fonts?.addEventListener('loadingdone',()=>align());
})();
