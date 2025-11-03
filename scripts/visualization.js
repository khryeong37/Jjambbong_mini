// ===== 전역 상태 =====
let G = { ts: [], s: {}, xMin: null, xMax: null };

// ===== 포맷 =====
const fmtInt = new Intl.NumberFormat('en-US'); // 12,345,678
const fmt2 = (v) => (v == null || isNaN(v) ? '' : Number(v).toFixed(2));
const $$ = (sel) => document.querySelector(sel);

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
    priceAtomone: find([
      'atomone price',
      'atomone_price',
      'marketprice_atomone',
    ]),
    priceAtom: find([
      'cosmos price',
      'atom price',
      'cosmos_price',
      'atom_price',
      'marketprice_cosmos',
    ]),
    // norm
    txAtomone: find([
      'atomone tx (norm)',
      'txcount_atomone_norm',
      'atomone tx_norm',
    ]),
    volAtomone: find([
      'atomone volume (norm)',
      'atomone volume_norm',
      'marketvolume_atomone_adj_global',
    ]),
    txAtom: find([
      'cosmos tx (norm)',
      'txcount_cosmos_norm',
      'atom tx_norm',
      'cosmos tx_norm',
    ]),
    volAtom: find([
      'cosmos volume (norm)',
      'cosmos volume_norm',
      'marketvolume_cosmos_adj_global',
    ]),
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

  const ts = [],
    s = {
      pOne: [],
      pAtom: [],
      txOne: [],
      volOne: [],
      txOne7: [],
      volOne7: [],
      txAtom: [],
      volAtom: [],
      txAtom7: [],
      volAtom7: [],
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
    {
      x: ts,
      y: s.pAtom,
      type: 'scatter',
      mode: 'lines',
      name: 'ATOM Price(USD)',
      xaxis: 'x',
      yaxis: 'y',
      line: { color: '#dc2626', width: 2 },
      hoverinfo: 'none',
    },
    {
      x: ts,
      y: s.pOne,
      type: 'scatter',
      mode: 'lines',
      name: 'ATOMONE-Price(USD)',
      xaxis: 'x',
      yaxis: 'y',
      line: { color: '#2563eb', width: 2 },
      hoverinfo: 'none',
    },
    {
      x: ts,
      y: s.txOne,
      type: 'bar',
      name: 'ATOMONE-Tx',
      xaxis: 'x2',
      yaxis: 'y2',
      marker: { color: '#93c5fd' },
      hoverinfo: 'none',
    },
    {
      x: ts,
      y: s.volOne,
      type: 'bar',
      name: 'ATOMONE-Volume',
      xaxis: 'x2',
      yaxis: 'y2',
      marker: { color: '#2563eb' },
      hoverinfo: 'none',
    },
    {
      x: ts,
      y: s.txAtom,
      type: 'bar',
      name: 'ATOM-Tx',
      xaxis: 'x3',
      yaxis: 'y3',
      marker: { color: '#fca5a5' },
      hoverinfo: 'none',
    },
    {
      x: ts,
      y: s.volAtom,
      type: 'bar',
      name: 'ATOM-Volume',
      xaxis: 'x3',
      yaxis: 'y3',
      marker: { color: '#dc2626' },
      hoverinfo: 'none',
    },
  ];

  const layout = {
    grid: {
      rows: 3,
      columns: 1,
      pattern: 'coupled',
      roworder: 'top to bottom',
    },

    xaxis: {
      anchor: 'y',
      type: 'date',
      matches: null,
      showticklabels: false,

      // 스파이크(세로선) 설정
      showspikes: false,
      spikethickness: 1,
      spikecolor: 'rgba(100,100,100,0.55)',
    },
    xaxis2: {
      anchor: 'y2',
      type: 'date',
      matches: 'x',
      showticklabels: false,
      showspikes: false,
      spikethickness: 1,
      spikecolor: 'rgba(100,100,100,0.55)',
    },
    xaxis3: {
      anchor: 'y3',
      type: 'date',
      matches: 'x',
      title: 'Time',

      showspikes: false,
      spikethickness: 1,
      spikecolor: 'rgba(100,100,100,0.55)',
      tickformat: '%b %Y',
    },

    yaxis: { title: 'Price', domain: [0.56, 1.0] },
    yaxis2: {
      title: 'ATOMONE Activity',
      domain: [0.3, 0.52],
      range: [0, 2],
      dtick: 0.5,
    },
    yaxis3: {
      title: 'ATOM Activity',
      domain: [0.0, 0.26],
      range: [0, 2],
      dtick: 0.5,
    },

    barmode: 'stack',
    bargap: 0.05,
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.15 },

    // hover 이벤트를 안정적으로 받되 기본 박스는 투명 처리
    hovermode: 'x unified',
    spikedistance: -1,
    hoverlabel: {
      bgcolor: 'rgba(255,255,255,0)',
      bordercolor: 'rgba(0,0,0,0)',
      font: { color: 'rgba(0,0,0,0)' },
    },

    shapes: [], // 점선 세로선은 런타임에 추가
    margin: { l: 60, r: 18, t: 16, b: 58 },
    height: Math.max(window.innerHeight * 0.78, 520),
    paper_bgcolor: '#fff',
    plot_bgcolor: '#fff',
  };

  Plotly.newPlot('chart', traces, layout, {
    displaylogo: false,
    responsive: true,
  }).then(() => {
    hookInteractions();
  });
}

function hookInteractions() {
  const el = document.getElementById('chart');
  let vline = el.querySelector('.vline');
  if (!vline) {
    vline = document.createElement('div');
    vline.className = 'vline';
    el.appendChild(vline);
  }
  // 없으면 자동 생성
  function ensureBox(id) {
    let n = document.getElementById(id);
    if (!n) {
      n = document.createElement('div');
      n.id = id;
      n.className = 'ttbox';
      n.style.display = 'none';
      el.appendChild(n);
    } else if (n.parentElement !== el) {
      n.parentElement.removeChild(n);
      el.appendChild(n);
    }
    return n;
  }
  const box1 = ensureBox('tt-row1');
  const box2 = ensureBox('tt-row2');
  const box3 = ensureBox('tt-row3');

  // 각 subplot의 세로 중앙에 박스 위치
  function placeBoxes() {
    const rect = el.getBoundingClientRect();
    const fl = el._fullLayout;
    if (!fl) return;

    const h = rect.height;
    const topFromDomain = (domainTop) => (1 - domainTop) * h + 8;

    const top1 = topFromDomain(fl.yaxis.domain[1]); // Row1
    const top2 = topFromDomain(fl.yaxis2.domain[1]); // Row2
    const top3 = topFromDomain(fl.yaxis3.domain[1]); // Row3

    document.getElementById('tt-row1').style.top = `${top1}px`;
    document.getElementById('tt-row2').style.top = `${top2}px`;
    document.getElementById('tt-row3').style.top = `${top3}px`;
  }
  el.on('plotly_hover', (ev) => {
    if (!ev.points || !ev.points.length) return;

    const xVal = new Date(ev.points[0].x).getTime();
    const i = G.ts.findIndex((t) => t.getTime() === xVal);
    if (i < 0) return;

    renderRowBoxes(i);

    const ids = ['tt-row1', 'tt-row2', 'tt-row3'];
    ids.forEach((id) => {
      const n = document.getElementById(id);
      n.style.display = 'block';
      n.style.opacity = '1';
    });

    // 3) x 위치(세로선) 따라다니게: 마우스 좌표 → chart 내부 left
    const rect = el.getBoundingClientRect();
    const mouseX = ev.event.clientX - rect.left; // 커서 x (chart 기준)
    const maxW = 320; // .ttbox max-width와 맞춤
    const pad = 12; // 세로선에서 살짝 띄우기
    const left = Math.max(6, Math.min(mouseX + pad, rect.width - maxW - 6));
    ids.forEach((id) => {
      const n = document.getElementById(id);
      n.style.left = `${left}px`;
      n.style.right = 'auto';
    });
    vline.style.left = `${Math.max(0, Math.min(mouseX, rect.width))}px`;
    vline.style.display = 'block';
    // 4) y(세로 스택) 위치는 도메인 기반으로 고정
    placeBoxes();
  });

  el.on('plotly_unhover', () => {
    ['tt-row1', 'tt-row2', 'tt-row3'].forEach((id) => {
      const n = document.getElementById(id);
      n.style.opacity = '0';
      n.style.display = 'none';
    });

    // 기간 버튼(제목 아래)
    document.querySelectorAll('#rangeBtns .btn').forEach((btn) => {
      btn.addEventListener('click', () => applyRange(btn.dataset.range));
    });
  });

  // ===== 행별 박스(3개) 내용 =====
  function renderRowBoxes(i) {
    const { s, ts } = G;
    const dateStr = new Date(ts[i]).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

    // Row1: Price
    document.getElementById('tt-row1').innerHTML = `
    <div class="title">날짜: ${dateStr} <span class="muted">(UTC)</span></div>
    <div>ATOM Price: $ ${fmt2(s.pAtom[i])}</div>
    <div>ATOMONE Price: $ ${fmt2(s.pOne[i])}</div>
  `;

    // Row2: ATOMONE
    const oneSum = (s.txOne[i] ?? 0) + (s.volOne[i] ?? 0);
    document.getElementById('tt-row2').innerHTML = `
    <div class="title">Row2 (ATOMONE)</div>
    ${
      s.txOne7?.[i] != null
        ? `<div>Tx (7d): ${fmtInt.format(s.txOne7[i])}</div>`
        : ''
    }
    <div>Tx_norm: ${fmt2(s.txOne[i])}</div>
    ${
      s.volOne7?.[i] != null
        ? `<div>Volume (7d): ${fmtInt.format(s.volOne7[i])}</div>`
        : ''
    }
    <div>Volume_norm: ${fmt2(s.volOne[i])}</div>
    <div>ActivitySum (Tx_norm + Volume_norm): ${fmt2(oneSum)}</div>
  `;

    // Row3: ATOM
    const atomSum = (s.txAtom[i] ?? 0) + (s.volAtom[i] ?? 0);
    document.getElementById('tt-row3').innerHTML = `
    <div class="title">Row3 (ATOM)</div>
    ${
      s.txAtom7?.[i] != null
        ? `<div>Tx (7d): ${fmtInt.format(s.txAtom7[i])}</div>`
        : ''
    }
    <div>Tx_norm: ${fmt2(s.txAtom[i])}</div>
    ${
      s.volAtom7?.[i] != null
        ? `<div>Volume (7d): ${fmtInt.format(s.volAtom7[i])}</div>`
        : ''
    }
    <div>Volume_norm: ${fmt2(s.volAtom[i])}</div>
    <div>ActivitySum: ${fmt2(atomSum)}</div>
  `;
  }
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
    alert(
      'CSV 자동 로드 실패: Live Server(HTTP)로 열려 있는지, 그리고 ./data/atomone_cosmos_data_final.csv 경로가 맞는지 확인해주세요.'
    );
  }
})();

// help modal
const dlg = document.getElementById('help');
document
  .getElementById('helpBtn')
  .addEventListener('click', () => dlg.showModal());
document
  .getElementById('closeHelp')
  .addEventListener('click', () => dlg.close());

// resize
window.addEventListener('resize', () => Plotly.Plots.resize('chart'));
