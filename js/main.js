let timelineData = null;

function toSimpText(s) {
  if (!s) return s;
  return String(s)
    .replace(/-\{([^{}]+)\}-/g, '$1')
    .replace(/遼/g,'辽').replace(/漢/g,'汉').replace(/後/g,'后')
    .replace(/東/g,'东').replace(/晉/g,'晋').replace(/吳/g,'吴')
    .replace(/儀/g,'仪').replace(/調/g,'调').replace(/開/g,'开')
    .replace(/韓/g,'韩').replace(/體/g,'体').replace(/萬/g,'万')
    .replace(/長/g,'长').replace(/證/g,'证').replace(/載/g,'载')
    .replace(/應/g,'应').replace(/讓/g,'让').replace(/曆/g,'历')
    .replace(/閔/g,'闵').replace(/則/g,'则').replace(/視/g,'视')
    .replace(/恆/g,'恒').replace(/啟/g,'启').replace(/徹/g,'彻')
    .replace(/雲/g,'云').replace(/爾/g,'尔').replace(/兒/g,'儿')
    .replace(/歲/g,'岁').replace(/歸/g,'归')
    .replace(/驁/g,'骜').replace(/嬰/g,'婴')
    .replace(/壽/g,'寿').replace(/統/g,'统').replace(/祐/g,'佑')
    .replace(/豐/g,'丰').replace(/從/g,'从').replace(/冊/g,'册')
    .replace(/國/g,'国').replace(/觀/g,'观').replace(/運/g,'运')
    .replace(/龍/g,'龙').replace(/鳳/g,'凤').replace(/紹/g,'绍')
    .replace(/肅/g,'肃').replace(/順/g,'顺').replace(/寧/g,'宁')
    .replace(/臺/g,'台').replace(/廣/g,'广').replace(/莊/g,'庄')
    .replace(/機/g,'机').replace(/淵/g,'渊').replace(/顯/g,'显')
    .replace(/禎/g,'祯').replace(/澤/g,'泽').replace(/濤/g,'涛')
    .replace(/閭/g,'闾').replace(/闔/g,'阖').replace(/鬱/g,'郁')
    .replace(/驃/g,'骠').replace(/覽/g,'览').replace(/燁/g,'烨')
    .replace(/煬/g,'炀').replace(/驥/g,'骥').replace(/嶽/g,'岳')
    .replace(/騏/g,'骐').replace(/麗/g,'丽').replace(/樂/g,'乐')
    .replace(/強/g,'强').replace(/會/g,'会').replace(/總/g,'总')
    .replace(/發/g,'发').replace(/億/g,'亿').replace(/廟/g,'庙')
    .replace(/聖/g,'圣').replace(/興/g,'兴').replace(/欽/g,'钦')
    .replace(/義/g,'义').replace(/禮/g,'礼').replace(/賢/g,'贤')
    .replace(/憲/g,'宪').replace(/業/g,'业').replace(/藝/g,'艺')
    .replace(/寬/g,'宽').replace(/際/g,'际').replace(/馮/g,'冯')
    .replace(/騰/g,'腾').replace(/慶/g,'庆').replace(/寶/g,'宝')
    .replace(/貞/g,'贞').replace(/鎮/g,'镇').replace(/堯/g,'尧')
    .replace(/蕭/g,'萧').replace(/馬/g,'马').replace(/劉/g,'刘')
    .replace(/孫/g,'孙').replace(/楊/g,'杨').replace(/趙/g,'赵')
    .replace(/陳/g,'陈').replace(/齊/g,'齐').replace(/釗/g,'钊')
    .replace(/詡/g,'诩').replace(/綱/g,'纲').replace(/繹/g,'绎')
    .replace(/詧/g,'察').replace(/巋/g,'岿').replace(/權/g,'权')
    .replace(/鹹/g,'咸');
}

function simplifyValue(v) {
  if (typeof v === 'string') return toSimpText(v);
  if (Array.isArray(v)) return v.map(simplifyValue);
  if (v && typeof v === 'object') {
    const out = {};
    Object.keys(v).forEach(k => {
      out[k] = simplifyValue(v[k]);
    });
    return out;
  }
  return v;
}

async function loadTimelineData() {
  if (!window.timelineDataSource || !Array.isArray(window.timelineDataSource.dynasties)) {
    throw new Error('Missing timelineDataSource');
  }
  timelineData = simplifyValue(window.timelineDataSource);
}

const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
tooltip.className = 'tooltip';
document.body.appendChild(tooltip);

const dynastyControllers = [];

const WRAPPER_DYNASTY_NAMES = new Set([
  '周朝',
  '汉朝',
  '三国',
  '晋朝',
  '南北朝',
  '五代十国',
  '宋朝'
]);

const ROOT_DISPLAY_ORDER = [
  '夏', '商', '周', '战国', '秦', '汉', '三国', '晋', '南北朝', '隋', '唐',
  '五代十国', '宋', '辽', '西夏', '金', '元', '明', '清', '中国民国', '新中国'
];

const ROOT_ORDER_INDEX = new Map(ROOT_DISPLAY_ORDER.map((name, idx) => [name, idx]));

function compareRootNodeOrder(a, b) {
  const ai = ROOT_ORDER_INDEX.get(a.dynasty.name);
  const bi = ROOT_ORDER_INDEX.get(b.dynasty.name);
  const aKnown = ai !== undefined;
  const bKnown = bi !== undefined;
  if (aKnown && bKnown) return ai - bi;
  if (aKnown) return -1;
  if (bKnown) return 1;
  return a.dynasty.start - b.dynasty.start;
}

const WRAPPER_CHILDREN = {
  '周朝': ['西周', '东周'],
  '汉朝': ['西汉', '新朝', '东汉'],
  '三国': ['魏', '蜀汉', '吴'],
  '晋朝': ['西晋', '东晋'],
  '南北朝': ['刘宋', '南齐', '梁', '东魏', '西魏', '北齐', '西梁', '陈', '北周'],
  '五代十国': ['后梁', '后唐', '后晋', '后汉', '后周'],
  '宋朝': ['北宋', '南宋']
};

function buildDynastyHierarchy(dynasties) {
  if (dynasties.some(d => d.parent && String(d.parent).trim())) {
    const nodes = dynasties.map(d => ({ dynasty: d, children: [] }));
    const byName = new Map(nodes.map(n => [n.dynasty.name, n]));
    const top = [];
    for (const node of nodes) {
      const parentName = (node.dynasty.parent || '').trim();
      const parentNode = parentName ? byName.get(parentName) : null;
      if (parentNode && parentNode !== node) {
        parentNode.children.push(node);
      } else {
        top.push(node);
      }
    }
    top.sort(compareRootNodeOrder);
    top.forEach(node => node.children.sort((a, b) => a.dynasty.start - b.dynasty.start));
    return top;
  }

  const nodes = dynasties.map(d => ({ dynasty: d, children: [] }));
  const wrappers = nodes.filter(n => WRAPPER_DYNASTY_NAMES.has(n.dynasty.name));
  const nonWrappers = nodes.filter(n => !WRAPPER_DYNASTY_NAMES.has(n.dynasty.name));
  const top = [];
  const assigned = new Set();

  // First pass: explicit children mapping for known umbrella dynasties.
  wrappers.forEach(wrapper => {
    const wanted = new Set(WRAPPER_CHILDREN[wrapper.dynasty.name] || []);
    if (wanted.size === 0) return;
    const matches = nonWrappers.filter(node => (
      !assigned.has(node)
      && wanted.has(node.dynasty.name)
      && node.dynasty.start >= wrapper.dynasty.start
      && node.dynasty.end <= wrapper.dynasty.end
    ));
    matches.sort((a, b) => a.dynasty.start - b.dynasty.start);
    matches.forEach(node => {
      wrapper.children.push(node);
      assigned.add(node);
    });
  });

  // Second pass: assign remaining dynasties by range containment.
  nonWrappers.forEach(node => {
    const d = node.dynasty;
    if (assigned.has(node)) return;
    const parents = wrappers.filter(w => d.start >= w.dynasty.start && d.end <= w.dynasty.end);
    if (parents.length === 0) {
      top.push(node);
      return;
    }
    parents.sort((a, b) => (a.dynasty.end - a.dynasty.start) - (b.dynasty.end - b.dynasty.start));
    parents[0].children.push(node);
    assigned.add(node);
  });

  wrappers.forEach(w => top.push(w));

  top.sort(compareRootNodeOrder);
  top.forEach(node => node.children.sort((a, b) => a.dynasty.start - b.dynasty.start));
  return top;
}

function formatYear(year) {
  // Use signed year format on the Y axis: BC years are negative.
  return `${year}`;
}

function formatRange(start, end) {
  return `${formatYear(start)} - ${formatYear(end)}`;
}

function formatDynastyLabel(dynasty, isChild) {
  const raw = String(dynasty?.name || '');
  if (!isChild) return raw;
  // Secondary nodes don't need parent disambiguation in the label.
  return raw.replace(/\s*[（(][^（）()]+[）)]\s*$/, '');
}

function normalizeLabelText(s) {
  return String(s || '').replace(/[\s·•・]/g, '');
}

function isQinDynastyName(name) {
  return String(name || '').startsWith('秦');
}

function shouldShowNameInLabel(title, name) {
  const t = normalizeLabelText(title);
  const n = normalizeLabelText(name);
  if (!n) return false;

  // Hide redundant regnal-name display, e.g. 雍正帝 · 雍正.
  if (t.endsWith('帝') && t.slice(0, -1) === n) return false;
  return true;
}

function isHonorificTooLong(honorific) {
  return normalizeLabelText(honorific).length > 8;
}

function getNamePrefix(item, dynastyName) {
  if (item.templeTitle) {
    return { type: '庙号', value: item.templeTitle };
  }
  if (item.posthumous) {
    return { type: '谥号', value: item.posthumous };
  }
  if (isQinDynastyName(dynastyName) && item.title) {
    return { type: '尊号', value: item.title };
  }
  return { type: '', value: '' };
}

function formatEmperorLabel(emperor, dynastyName) {
  const prefix = getNamePrefix(emperor, dynastyName);
  const first = prefix.value;
  const name = emperor.name || '';

  if (first) {
    if (name && isHonorificTooLong(first)) return name;
    const showName = shouldShowNameInLabel(first, name);
    return showName ? `${first} · ${name}` : first;
  }

  if (name) return name;

  // Non-Qin dynasties don't display honorific titles in labels.
  if (emperor.title) return emperor.title;
  return '';
}

function textOrDash(s) {
  return s && String(s).trim() ? String(s).trim() : '-';
}

function buildTooltipContent(item) {
  const html = [];
  const honorific = (item.title && item.title !== item.templeTitle && item.title !== item.posthumous)
    ? item.title
    : '';
  const isQin = isQinDynastyName(item._dynastyName || '');
  const requiredName = textOrDash(item.name || item.title);
  const rows = [];

  if (item.templeTitle) rows.push(`<p><strong>庙号:</strong> ${item.templeTitle}</p>`);
  if (item.posthumous) rows.push(`<p><strong>谥号:</strong> ${item.posthumous}</p>`);
  if (isQin && honorific) rows.push(`<p><strong>尊号:</strong> ${honorific}</p>`);
  rows.push(`<p><strong>姓名:</strong> ${requiredName}</p>`);
  if (item.era) rows.push(`<p><strong>年号:</strong> ${item.era}</p>`);
  rows.push(`<p><strong>统治时间:</strong> ${formatRange(item.start, item.end)}</p>`);

  html.push(...rows);
  return html.join('');
}

function showTooltip(event, item) {
  tooltip.innerHTML = buildTooltipContent(item);
  tooltip.style.display = 'block';
  moveTooltip(event);
}

function moveTooltip(event) {
  const offset = 14;
  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;
  let x = event.clientX + offset;
  let y = event.clientY + offset;
  if (x + tw > window.innerWidth - 10) x = event.clientX - tw - offset;
  if (y + th > window.innerHeight - 10) y = event.clientY - th - offset;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideTooltip() {
  tooltip.style.display = 'none';
}

function updateToggleUI(toggle, expanded) {
  if (!toggle) return;
  toggle.classList.toggle('expanded', expanded);
  toggle.classList.toggle('collapsed', !expanded);
  toggle.innerHTML = expanded ? '▾' : '▸';
}

function setSimpleExpanded(controller, expanded, container) {
  controller.expanded = expanded;
  updateToggleUI(controller.toggle, expanded);
  const canShow = !controller.parentRoot || controller.parentRoot.expanded;
  controller.rows.forEach(r => {
    r.style.display = (expanded && canShow) ? '' : 'none';
  });

  const header = container.querySelector('.timeline-header');
  const top = header ? header.offsetHeight : 0;
  renderVerticalRuler(container, top);
}

function setRootExpanded(controller, expanded, container) {
  controller.expanded = expanded;
  updateToggleUI(controller.toggle, expanded);

  controller.ownRows.forEach(r => {
    r.style.display = expanded ? '' : 'none';
  });
  controller.childDynastyRows.forEach(r => {
    r.style.display = expanded ? '' : 'none';
  });
  controller.childControllers.forEach(child => {
    child.rows.forEach(r => {
      r.style.display = (expanded && child.expanded) ? '' : 'none';
    });
  });

  const header = container.querySelector('.timeline-header');
  const top = header ? header.offsetHeight : 0;
  renderVerticalRuler(container, top);
}

function toggleAllRootNodes(container) {
  const allExpanded = dynastyControllers.length > 0 && dynastyControllers.every(c => {
    if (c.kind === 'root') {
      return c.expanded && c.childControllers.every(child => child.expanded);
    }
    return c.expanded;
  });
  const target = !allExpanded;

  dynastyControllers.forEach(controller => {
    if (controller.kind === 'root') {
      // Header global toggle is deep: root + second-level nodes.
      controller.childControllers.forEach(child => {
        child.expanded = target;
        updateToggleUI(child.toggle, target);
      });
      setRootExpanded(controller, target, container);
    } else {
      setSimpleExpanded(controller, target, container);
    }
  });
}

function initSimpleControllerCollapsed(controller) {
  controller.expanded = false;
  updateToggleUI(controller.toggle, false);
  controller.rows.forEach(r => {
    r.style.display = 'none';
  });
}

function initRootControllerCollapsed(controller) {
  controller.expanded = false;
  updateToggleUI(controller.toggle, false);
  controller.ownRows.forEach(r => {
    r.style.display = 'none';
  });
  controller.childDynastyRows.forEach(r => {
    r.style.display = 'none';
  });
  controller.childControllers.forEach(child => {
    child.expanded = false;
    updateToggleUI(child.toggle, false);
    child.rows.forEach(r => {
      r.style.display = 'none';
    });
  });
}

function getEmperorTickLevel(dynasty) {
  // Parallel-state periods get medium ticks for emperor rows.
  const mediumDynasties = ['三国', '五代十国'];
  if (mediumDynasties.includes(dynasty.name) || dynasty.parallelTick === true) {
    return 'medium';
  }
  return 'minor';
}

function applyBarColor(barEl, color) {
  if (typeof color === 'string' && color.trim().startsWith('#')) {
    barEl.style.backgroundColor = color;
    return;
  }
  barEl.classList.add(color || 'gray');
}

function createTimeline() {
  const container = document.getElementById('timeline');
  if (!container || !timelineData || !Array.isArray(timelineData.dynasties)) return;

  dynastyControllers.length = 0;
  container.innerHTML = '';

  const dynasties = timelineData.dynasties;
  const maxDuration = Math.max(...dynasties.map(d => d.end - d.start));
  const tickInterval = 100;
  const maxTick = Math.ceil(maxDuration / tickInterval) * tickInterval;
  const scaleBase = maxTick;

  const header = document.createElement('div');
  header.className = 'timeline-header';

  const timeColHeader = document.createElement('div');
  timeColHeader.className = 'col-time col-header';
  timeColHeader.textContent = '起始年';
  header.appendChild(timeColHeader);

  const labelColHeader = document.createElement('div');
  labelColHeader.className = 'col-label col-header global-toggle-label';
  labelColHeader.textContent = '朝代 / 君王';
  labelColHeader.title = '点击展开/收起所有根节点';
  labelColHeader.addEventListener('click', () => toggleAllRootNodes(container));
  header.appendChild(labelColHeader);

  const barColHeader = document.createElement('div');
  barColHeader.className = 'col-bar col-header axis-col-header';

  const tickWrap = document.createElement('div');
  tickWrap.className = 'tick-wrap';

  for (let yr = 50; yr <= maxTick; yr += 50) {
    if (yr % 100 === 0) continue;
    const pct = Math.min((yr / scaleBase) * 100, 100);
    const minor = document.createElement('span');
    minor.className = 'tick-minor';
    minor.style.left = `${pct}%`;
    tickWrap.appendChild(minor);
  }

  for (let yr = 0; yr <= maxTick; yr += tickInterval) {
    const pct = Math.min((yr / scaleBase) * 100, 100);
    const tick = document.createElement('span');
    tick.className = 'tick-label';
    if (yr === maxTick) tick.classList.add('terminal-tick');
    tick.style.left = `${pct}%`;
    tick.textContent = yr === maxTick ? `${yr}年` : `${yr}`;
    tickWrap.appendChild(tick);
  }

  barColHeader.appendChild(tickWrap);
  header.appendChild(barColHeader);
  container.appendChild(header);

  const rulerTop = header.offsetHeight;

  const hierarchy = buildDynastyHierarchy(dynasties);
  hierarchy.forEach(node => {
    if (node.children.length === 0) {
      const result = renderDynastySection(container, node.dynasty, scaleBase);
      if (result.controller) {
        result.controller.kind = 'simple';
        initSimpleControllerCollapsed(result.controller);
        dynastyControllers.push(result.controller);
      }
      return;
    }

    const rootResult = renderDynastySection(container, node.dynasty, scaleBase, {
      forceShowToggle: true,
      externalToggle: true,
    });

    const childDynastyRows = [];
    const childControllers = [];
    node.children.forEach(childNode => {
      const childResult = renderDynastySection(container, childNode.dynasty, scaleBase, {
        isChild: true,
      });
      childDynastyRows.push(childResult.dynastyRow);
      if (childResult.controller) childControllers.push(childResult.controller);
    });

    const controller = {
      kind: 'root',
      toggle: rootResult.toggle,
      ownRows: rootResult.emperorRows,
      childDynastyRows,
      childControllers,
      expanded: true
    };
    childControllers.forEach(child => {
      child.parentRoot = controller;
    });
    initRootControllerCollapsed(controller);
    dynastyControllers.push(controller);
    rootResult.toggle.addEventListener('click', () => {
      setRootExpanded(controller, !controller.expanded, container);
    });
  });

  renderVerticalRuler(container, rulerTop);
}

function renderDynastySection(container, dynasty, scaleBase, options = {}) {
  const isChild = options.isChild === true;
  const suppressToggle = options.suppressToggle === true;
  const forceShowToggle = options.forceShowToggle === true;
  const externalToggle = options.externalToggle === true;
  const dynastyDuration = dynasty.end - dynasty.start;
  const dynastyWidth = Math.max(1, (dynastyDuration / scaleBase) * 100);
  const hasEmperors = Array.isArray(dynasty.emperors) && dynasty.emperors.length > 0;

  const dynastyRow = document.createElement('div');
  dynastyRow.className = 'row dynasty-row';
  dynastyRow.dataset.tickLevel = 'major';

  const timeCell = document.createElement('div');
  timeCell.className = 'col-time';
  timeCell.textContent = formatYear(dynasty.start);
  dynastyRow.appendChild(timeCell);

  const labelCell = document.createElement('div');
  labelCell.className = 'col-label dynasty-label';
  if (isChild) labelCell.classList.add('subdynasty-label');

  const nameSpan = document.createElement('span');
  nameSpan.className = 'dynasty-name-text';
  nameSpan.textContent = formatDynastyLabel(dynasty, isChild);
  labelCell.appendChild(nameSpan);

  let toggle = null;
  const hasToggle = !suppressToggle && (forceShowToggle || hasEmperors);
  if (hasToggle) {
    toggle = document.createElement('button');
    toggle.className = 'toggle-btn expanded';
    toggle.setAttribute('aria-label', '展开/收起节点');
    toggle.innerHTML = '▾';
    labelCell.appendChild(toggle);
  }

  dynastyRow.appendChild(labelCell);

  const barCell = document.createElement('div');
  barCell.className = 'col-bar';

  const barCellInner = document.createElement('div');
  barCellInner.className = 'bar-cell-inner';

  const trackWrap = document.createElement('div');
  trackWrap.className = 'bar-track-wrap';

  const barTrack = document.createElement('div');
  barTrack.className = 'bar-track';

  const bar = document.createElement('div');
  bar.className = 'bar dynasty-bar';
  applyBarColor(bar, dynasty.color);
  bar.style.width = `${dynastyWidth}%`;

  const value = document.createElement('span');
  value.className = 'bar-value';
  value.textContent = `${dynastyDuration}`;
  value.style.left = `${dynastyWidth}%`;
  if (dynastyWidth > 88) value.classList.add('inside');

  barTrack.appendChild(bar);
  trackWrap.appendChild(barTrack);
  trackWrap.appendChild(value);
  barCellInner.appendChild(trackWrap);
  barCell.appendChild(barCellInner);
  dynastyRow.appendChild(barCell);
  if (isChild) dynastyRow.classList.add('subdynasty-row');

  container.appendChild(dynastyRow);

  const emperorRows = [];
  if (hasEmperors) {
    dynasty.emperors.forEach(emperor => {
      const eRow = renderEmperorRow(dynasty, emperor, scaleBase);
      container.appendChild(eRow);
      emperorRows.push(eRow);
    });

    if (toggle && !externalToggle) {
      const controller = {
        kind: 'simple',
        toggle,
        rows: emperorRows,
        expanded: true
      };
      toggle.addEventListener('click', () => {
        setSimpleExpanded(controller, !controller.expanded, container);
      });
      return { dynastyRow, emperorRows, toggle, controller };
    }
  }

  return { dynastyRow, emperorRows, toggle, controller: null };
}

function renderEmperorRow(dynasty, emperor, scaleBase) {
  const emperorDuration = emperor.end - emperor.start;
  const emperorWidth = Math.max(1, (emperorDuration / scaleBase) * 100);

  const row = document.createElement('div');
  row.className = 'row emperor-row';
  row.dataset.tickLevel = getEmperorTickLevel(dynasty);

  const timeCell = document.createElement('div');
  timeCell.className = 'col-time';
  timeCell.textContent = formatYear(emperor.start);
  row.appendChild(timeCell);

  const labelCell = document.createElement('div');
  labelCell.className = 'col-label emperor-label';
  labelCell.textContent = formatEmperorLabel(emperor, dynasty.name);
  const tooltipItem = { ...emperor, _dynastyName: dynasty.name };
  labelCell.addEventListener('mouseenter', ev => showTooltip(ev, tooltipItem));
  labelCell.addEventListener('mousemove', ev => moveTooltip(ev));
  labelCell.addEventListener('mouseleave', hideTooltip);
  row.appendChild(labelCell);

  const barCell = document.createElement('div');
  barCell.className = 'col-bar';

  const barCellInner = document.createElement('div');
  barCellInner.className = 'bar-cell-inner';

  const trackWrap = document.createElement('div');
  trackWrap.className = 'bar-track-wrap';

  const barTrack = document.createElement('div');
  barTrack.className = 'bar-track';

  const bar = document.createElement('div');
  bar.className = 'bar emperor-bar';
  applyBarColor(bar, dynasty.color);
  bar.style.width = `${emperorWidth}%`;

  const value = document.createElement('span');
  value.className = 'bar-value';
  value.textContent = `${emperorDuration}`;
  value.style.left = `${emperorWidth}%`;
  if (emperorWidth > 88) value.classList.add('inside');

  barTrack.appendChild(bar);
  trackWrap.appendChild(barTrack);
  trackWrap.appendChild(value);
  barCellInner.appendChild(trackWrap);
  barCell.appendChild(barCellInner);
  row.appendChild(barCell);

  return row;
}

function renderVerticalRuler(container, topOffset) {
  const old = container.querySelector('.y-ruler');
  if (old) old.remove();

  const ruler = document.createElement('div');
  ruler.className = 'y-ruler';
  ruler.style.top = `${topOffset}px`;

  const markerRow = container.querySelector('.marker-row');
  let endHeight = 0;

  const line = document.createElement('div');
  line.className = 'y-ruler-line';
  ruler.appendChild(line);

  // Build ruler ticks from rendered rows so tick levels follow data semantics.
  const rows = Array.from(container.querySelectorAll('.row')).filter(row => row.offsetParent !== null);
  if (markerRow) {
    const markerCenter = markerRow.offsetTop + (markerRow.offsetHeight / 2);
    endHeight = Math.max(markerCenter - topOffset, 0);
  } else if (rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    const lastCenter = lastRow.offsetTop + (lastRow.offsetHeight / 2);
    endHeight = Math.max(lastCenter - topOffset, 0);
  }
  ruler.style.height = `${endHeight}px`;

  rows.forEach(row => {
    const y = row.offsetTop + (row.offsetHeight / 2) - topOffset;
    if (y < 0 || y > endHeight) return;

    const tick = document.createElement('span');
    const level = row.dataset.tickLevel || 'minor';
    tick.className = `y-tick ${level}`;
    tick.style.top = `${Math.round(y)}px`;
    ruler.appendChild(tick);
  });

  container.appendChild(ruler);
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadTimelineData();
    createTimeline();
  } catch (error) {
    const container = document.getElementById('timeline');
    if (container) {
      container.innerHTML = `<div style=\"padding:12px;color:#b42318;font-size:14px;\">数据加载失败：${error.message}</div>`;
    }
  }
});
