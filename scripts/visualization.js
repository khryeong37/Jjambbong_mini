// ===== 전역 상태 =====
let G = { ts: [], s: {}, xMin: null, xMax: null };

// ===== 포맷 =====
const fmtInt = new Intl.NumberFormat('en-US'); // 12,345,678
const fmt2 = (v) => (v == null || isNaN(v) ? '' : Number(v).toFixed(2));
const $$ = (sel) => document.querySelector(sel);

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
const COLOR = {
  atomPr: cssVar('--data-atom-pr'),
  onePr: cssVar('--data-one-pr'),
  atomVol: cssVar('--data-atom-vol'),
  atomTx: cssVar('--data-atom-tx'),
  oneVol: cssVar('--data-one-vol'),
  oneTx: cssVar('--data-one-tx'),
  paper: cssVar('--static-bg'),
  plot: cssVar('--static-bg'),
  grid: cssVar('--grid')
};

// CSV path (자동 로드)
const CSV_PATH = './data/atomone_cosmos_data_final.csv';

// ===== 컬럼 매핑 =====
function resolveCols(fields) {
  const H = fields.map((h) => (h || '').toLowerCase().trim());
  const find = (cands) => {
    const i = H.findIndex((h) => cands.some((c) => h.includes(c)));
    return i >= 0 ? fields[i] : null;
  };
  return {
    timestamp: find(['timestamp', 'date', 'time']),
    priceAtomone: find(['atomone price', 'atomone_price', 'marketprice_atomone']),
    priceAtom: find(['cosmos price', 'atom price', 'cosmos_price', 'atom_price', 'marketprice_cosmos']),
    // norm
    txAtomone: find(['atomone tx (norm)', 'txcount_atomone_norm', 'atomone tx_norm']),
    volAtomone: find(['atomone volume (norm)', 'atomone volume_norm', 'marketvolume_atomone_adj_global']),
    txAtom: find(['cosmos tx (norm)', 'txcount_cosmos_norm', 'atom tx_norm', 'cosmos tx_norm']),
    volAtom: find(['cosmos volume (norm)', 'cosmos volume_norm', 'marketvolume_cosmos_adj_global']),
    // optional raw 7d
    txAtomone7: find(['atomone tx (7d)', 'atomone tx_7d']),
    volAtomone7: find(['atomone volume (7d)', 'atomone volume_7d']),
    txAtom7: find(['cosmos tx (7d)', 'atom tx (7d)', 'cosmos tx_7d']),
    volAtom7: find(['cosmos volume (7d)', 'cosmos volume_7d']),
  };
}

// ===== CSV 파싱 → 시리즈 구성 =====
function parseCSVAndDraw(csvText) {
  const parsed = Papa.parse(csvText, {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true,
  });
  const { data, meta } = parsed;
  const c = resolveCols(meta.fields);

  const ts = [], s = {
    pOne: [], pAtom: [],
    txOne: [], volOne: [], txOne7: [], volOne7: [],
    txAtom: [], volAtom: [], txAtom7: [], volAtom7: [],
  };

  for (const row of data) {
    const t = row[c.timestamp];
    if (!t) continue;
    ts.push(new Date(t));
    s.pOne.push(+row[c.priceAtomone]);
    s.pAtom.push(+row[c.priceAtom]);
    s.txOne.push(+row[c.txAtomone]);
    s.volOne.push(+row[c.volAtomone]);
    s.txAtom.push(+row[c.txAtom]);
    s.volAtom.push(+row[c.volAtom]);
    s.txOne7.push(c.txAtomone7 ? +row[c.txAtomone7] : null);
    s.volOne7.push(c.volAtomone7 ? +row[c.volAtomone7] : null);
    s.txAtom7.push(c.txAtom7 ? +row[c.txAtom7] : null);
    s.volAtom7.push(c.volAtom7 ? +row[c.volAtom7] : null);
  }

  G = { ts, s, xMin: ts[0], xMax: ts[ts.length - 1] };
  draw(ts, s);
}

// ===== 차트 렌더 =====
function draw(ts, s) {
  const traces = [
    // Row1: Price (lines)
    {
      x: ts, y: s.pAtom,
      type: 'scatter',
      mode: 'lines',
      name: 'ATOM - Price (USD)',
      xaxis: 'x', yaxis: 'y',
      line: { color: COLOR.atomPr, width: 2 },
      hoverinfo: 'skip',              // Plotly 툴팁 완전 비활성화
      hovertemplate: null,            // 추가로 안전하게
      marker: { size: 0 },
      showlegend: true
    },
    {
      x: ts, y: s.pOne,
      type: 'scatter',
      mode: 'lines',
      name: 'ATOMONE - Price (USD)',
      xaxis: 'x', yaxis: 'y',
      line: { color: COLOR.onePr, width: 2 },
      hoverinfo: 'none',
      hovertemplate: null,
      marker: { size: 0 },
      showlegend: true
    },

    // Row2: ATOM Activity (bars, stack)
    {
      x: ts, y: s.txAtom, type: 'bar', name: 'ATOM - Tx',
      xaxis: 'x2', yaxis: 'y2', marker: { color: COLOR.atomTx }, hovertemplate: '<extra></extra>'
    },
    {
      x: ts, y: s.volAtom, type: 'bar', name: 'ATOM - Volume',
      xaxis: 'x2', yaxis: 'y2', marker: { color: COLOR.atomVol }, hovertemplate: '<extra></extra>'
    },

    // Row3: ATOMONE Activity (bars, stack)
    {
      x: ts, y: s.txOne, type: 'bar', name: 'ATOMONE - Tx',
      xaxis: 'x3', yaxis: 'y3', marker: { color: COLOR.oneTx }, hovertemplate: '<extra></extra>'
    },
    {
      x: ts, y: s.volOne, type: 'bar', name: 'ATOMONE - Volume',
      xaxis: 'x3', yaxis: 'y3', marker: { color: COLOR.oneVol }, hovertemplate: '<extra></extra>'
    },
  ];

  const layout = {
    grid: { rows: 3, columns: 1, pattern: 'coupled', roworder: 'top to bottom' },

    xaxis: { anchor: 'y', type: 'date', matches: null, showticklabels: false, showspikes: false, spikethickness: 1, spikecolor: 'rgba(100,100,100,0.55)' },
    xaxis2: { anchor: 'y2', type: 'date', matches: 'x', showticklabels: false, showspikes: false, spikethickness: 1, spikecolor: 'rgba(100,100,100,0.55)' },
    xaxis3: { anchor: 'y3', type: 'date', matches: 'x', showspikes: false, spikethickness: 1, spikecolor: 'rgba(100,100,100,0.55)', tickformat: '%b %Y' },

    yaxis: { title: 'Price', domain: [0.56, 1.0] },
    yaxis2: { title: 'ATOMONE Activity', domain: [0.30, 0.52], range: [0, 2], dtick: 0.5 },
    yaxis3: { title: 'ATOM Activity', domain: [0.00, 0.26], range: [0, 2], dtick: 0.5 },

    barmode: 'stack',
    bargap: 0.05,
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.15 },

    // Plotly 기본 hoverlabel은 숨기고(완전 투명), 커스텀 kv-tooltip만 쓴다
    hovermode: 'x unified',
    spikedistance: -1,
    hoverlabel: {
      bgcolor: 'rgba(255,255,255,0)',
      bordercolor: 'rgba(0,0,0,0)',
      font: { color: 'rgba(0,0,0,0)' },
      align: 'left',
      namelength: -1
    },

    shapes: [],
    margin: { l: 60, r: 18, t: 16, b: 58 },
    height: Math.max(window.innerHeight * 0.78, 520),
    paper_bgcolor: COLOR.paper,
    plot_bgcolor: COLOR.paper,
  };

  Plotly.newPlot('chart', traces, layout, {
    displaylogo: false,
    responsive: true,
  }).then(() => {
    createKVTooltips();
    hookInteractions();
  });
}
function createKVTooltips() {
  ['kv-row1', 'kv-row2', 'kv-row3'].forEach(id => {
    if (!document.getElementById(id)) {
      const n = document.createElement('div');
      n.id = id;
      n.className = 'kv-tooltip';
      document.body.appendChild(n);
    }
  });
}

function hookInteractions() {
  const el = document.getElementById('chart');

  // 세로 점선
  let vline = el.querySelector('.vline');
  if (!vline) {
    vline = document.createElement('div');
    vline.className = 'vline';
    el.appendChild(vline);
  }

  // ===== kv-tooltip 3개 생성(행별) =====
  function ensureKV(id) {
    let n = document.getElementById(id);
    if (!n) {
      n = document.createElement('div');
      n.id = id;
      n.className = 'kv-tooltip';        // ← 네가 정의한 카드 스타일 클래스
      n.style.opacity = '0';
      document.body.appendChild(n);      // fixed 포지셔닝이라 body에 붙임
    }
    return n;
  }
  const kv1 = ensureKV('kv-row1');
  const kv2 = ensureKV('kv-row2');
  const kv3 = ensureKV('kv-row3');

  // ===== 위치 계산 유틸 =====
  function placeKVBoxes(mouseClientX) {
    const rect = el.getBoundingClientRect();
    const fl = el._fullLayout;
    if (!fl) return;

    // X: 커서 기준, 화면 넘치면 왼쪽으로
    const tipW = 262;
    const pad = 12;
    let x = mouseClientX + pad;
    if (x + tipW + 6 > window.innerWidth) x = mouseClientX - tipW - pad;
    if (x < 6) x = 6;

    kv1.style.left = kv2.style.left = kv3.style.left = `${x}px`;

    // Y: subplot 중앙 = offset + length/2 (절대좌표 = chartTop + …)
    const centers = [
      { el: kv1, ax: 'yaxis' },
      { el: kv2, ax: 'yaxis2' },
      { el: kv3, ax: 'yaxis3' }
    ];

    centers.forEach(({ el, ax }) => {
      const off = fl[ax]._offset;   // subplot의 top (px)
      const len = fl[ax]._length;   // subplot의 높이 (px)
      const cy = rect.top + off + (len / 2);   // 페이지 기준 중앙 Y
      const h = el.offsetHeight || 0;         // 카드 높이
      el.style.top = `${cy - h / 2}px`;            // 중앙 정렬
    });
  }

  // ===== 내용 렌더 =====
  function renderKV(i) {
    const { s, ts } = G;
    const dateStr = new Date(ts[i]).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

    // Row1: Price
    kv1.innerHTML = `
  <div class="kv-tooltip-inner">
    <div class="kv-title04">${dateStr} <span class="kv-muted">(UTC)</span></div>
    <div class="kv-body04"><b>ATOM Price:</b> $ ${fmt2(s.pAtom[i])}</div>
    <div class="kv-body04"><b>ATOMONE Price:</b> $ ${fmt2(s.pOne[i])}</div>
  </div>
`;

    // Row2: ATOM
    const atomSum = (s.txAtom[i] ?? 0) + (s.volAtom[i] ?? 0);
    kv2.innerHTML = `
  <div class="kv-tooltip-inner">
    <div class="kv-title04">ATOM</div>
    ${s.txAtom7?.[i] != null ? `<div class="kv-body04">Tx (7d): ${fmtInt.format(s.txAtom7[i])}</div>` : ''}
    <div class="kv-body04">Tx_norm: ${fmt2(s.txAtom[i])}</div>
    ${s.volAtom7?.[i] != null ? `<div class="kv-body04">Volume (7d): ${fmtInt.format(s.volAtom7[i])}</div>` : ''}
    <div class="kv-body04">Volume_norm: ${fmt2(s.volAtom[i])}</div>
    <div class="kv-body04"><b>ActivitySum (Tx_norm + Volume_norm):</b> ${fmt2(atomSum)}</div>
  </div>
`;

    // Row3: ATOMONE
    const oneSum = (s.txOne[i] ?? 0) + (s.volOne[i] ?? 0);
    kv3.innerHTML = `
  <div class="kv-tooltip-inner">
    <div class="kv-title04">ATOMONE</div>
    ${s.txOne7?.[i] != null ? `<div class="kv-body04">Tx (7d): ${fmtInt.format(s.txOne7[i])}</div>` : ''}
    <div class="kv-body04">Tx_norm: ${fmt2(s.txOne[i])}</div>
    ${s.volOne7?.[i] != null ? `<div class="kv-body04">Volume (7d): ${fmtInt.format(s.volOne7[i])}</div>` : ''}
    <div class="kv-body04">Volume_norm: ${fmt2(s.volOne[i])}</div>
    <div class="kv-body04"><b>ActivitySum (Tx_norm + Volume_norm):</b> ${fmt2(oneSum)}</div>
  </div>
`;
  }

  // ===== 이벤트 =====
  el.on('plotly_hover', (ev) => {
    if (!ev.points || !ev.points.length) return;

    // 인덱스 찾기
    const xVal = new Date(ev.points[0].x).getTime();
    const i = G.ts.findIndex((t) => t.getTime() === xVal);
    if (i < 0) return;

    // 내용 렌더 + 표시
    renderKV(i);
    kv1.classList.add('is-show');
    kv2.classList.add('is-show');
    kv3.classList.add('is-show');

    // 위치
    placeKVBoxes(ev.event.clientX);

    // 세로 보조선
    const rect = el.getBoundingClientRect();
    const mouseX = ev.event.clientX - rect.left;
    vline.style.left = `${Math.max(0, Math.min(mouseX, rect.width))}px`;
    vline.style.display = 'block';
  });

  el.on('plotly_unhover', () => {
    kv1.classList.remove('is-show');
    kv2.classList.remove('is-show');
    kv3.classList.remove('is-show');
    vline.style.display = 'none';
  });

  // 리사이즈/리레아이웃 시 위치 보정
  el.on('plotly_relayout', () => {
    // 최근 마우스 위치는 없으니 중앙 기준으로 재배치
    const rect = el.getBoundingClientRect();
    placeKVBoxes(rect.left + rect.width / 2);
  });

  // 기간 버튼(초기 바인딩 한 번만)
  document.querySelectorAll('#rangeBtns .btn').forEach((btn) => {
    btn.addEventListener('click', () => applyRange(btn.dataset.range));
  });
}

// ===== 기간 버튼 동작 =====
function applyRange(kind) {
  const el = document.getElementById('chart');
  if (kind === 'all') {
    Plotly.relayout(el, {
      'xaxis.autorange': true,
      'xaxis2.autorange': true,
      'xaxis3.autorange': true,
    });
    return;
  }
  const days = parseInt(kind, 10);
  const end = G.xMax;
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  Plotly.relayout(el, {
    'xaxis.range': [start, end],
    'xaxis2.range': [start, end],
    'xaxis3.range': [start, end],
  });
}

// ---- boot: CSV 자동 로드 ----
(async function boot() {
  try {
    const res = await fetch(CSV_PATH);
    const text = await res.text();
    parseCSVAndDraw(text);
  } catch (e) {
    console.error(e);
    alert('CSV 자동 로드 실패: Live Server(HTTP)로 열려 있는지, 그리고 ./data/atomone_cosmos_data_final.csv 경로가 맞는지 확인해주세요.');
  }
})();

// ===== Help modal =====
const helpBtn = document.getElementById('helpBtn');
const helpPop = document.getElementById('helpPop');

function openHelp() {
  helpPop.classList.add('is-open');
  helpBtn.classList.add('is-open');
  helpBtn.setAttribute('aria-expanded', 'true');
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKeyDown);
}
function closeHelp() {
  helpPop.classList.remove('is-open');
  helpBtn.classList.remove('is-open');
  helpBtn.setAttribute('aria-expanded', 'false');
  document.removeEventListener('click', onDocClick);
  document.removeEventListener('keydown', onKeyDown);
}
function toggleHelp(e) {
  e.stopPropagation();
  if (helpPop.classList.contains('is-open')) closeHelp();
  else openHelp();
}
function onDocClick(e) {
  if (!helpPop.contains(e.target) && e.target !== helpBtn) closeHelp();
}
function onKeyDown(e) {
  if (e.key === 'Escape') closeHelp();
}
helpBtn.addEventListener('click', toggleHelp);

// 리사이즈
window.addEventListener('resize', () => Plotly.Plots.resize('chart'));
