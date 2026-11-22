(async function () {
  const config = JSON.parse(document.getElementById('runtime-review-config').textContent);
  const list = document.getElementById('font-review');
  list.replaceChildren();
  const records = [];
  async function available(font, i) {
    if (!window.FontFace) return {status:'unsupported',loadedAlias:null};
    const names=[...new Set([font.sourceFont,...(font.localAliases||[])])];
    for (let j=0;j<names.length;j++) {
      const escaped = names[j].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      try {
        const face = new FontFace('eager-local-probe-' + i+'-'+j, 'local("' + escaped + '")');
        await face.load();
        return {status:'local-loadable',loadedAlias:names[j]};
      } catch (_) { /* Try source-proven full/PostScript aliases, not guessed names. */ }
    }
    return {status:'not-confirmed',loadedAlias:null};
  }
  for (let i=0;i<config.fonts.length;i++) {
    const font=config.fonts[i];
    const found=await available(font,i);
    const row=document.createElement('li');
    const fallback=font.fallbackStack.join('、');
    row.textContent=found.status==='local-loadable' ? font.sourceFont+'：已检测到原字体家族成员（'+found.loadedAlias+'）。此检测不修改输出字重；字重仍按源样式，字形和排版仍需核对。' : found.status==='not-confirmed' ? '字体提醒：未能确认本机可加载 '+font.sourceFont+'，可能缺少原字体或受浏览器字体访问限制。已配置替代栈：'+fallback+'；使用替代后字形、宽度可能不同，请复核排版。' : font.sourceFont+'：此浏览器不支持本地字体检测，是否缺失尚不确定。配置替代栈：'+fallback+'。';
    row.dataset.font=font.sourceFont;row.dataset.availability=found.status;list.append(row);
    records.push({sourceFont:font.sourceFont,...found,configuredFallbackStack:font.fallbackStack,actualFallbackGlyphUseVerified:false,detectionMethod:'FontFace local() load using source family and audited exact full/PostScript names. Failure is not conclusive proof of system-wide absence.'});
  }
  if(!records.length){const row=document.createElement('li');row.textContent='当前输出未记录文字字体依赖。';list.append(row);}
  document.getElementById('runtime-review').textContent=JSON.stringify({fontAvailability:records,instances:config.manifests,visualPassed:false},null,2);
})();
