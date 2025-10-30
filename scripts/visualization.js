// scripts/visualization.js
const CSV_URL = './data/merged-atom-cosmos_final.csv';

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const COLOR_ATOM = cssVar('--atom');
const COLOR_ATOMONE = cssVar('--atomone');
const COLOR_BG = cssVar('--bg');
const COLOR_TEXT = cssVar('--white');
const COLOR_GRAY = cssVar('--gray100');
const COLOR_WHITE = cssVar('--white');
const COLOR_PRIMARY = cssVar('--primary500');

const FONT_title02 = cssVar('--title02-sb-24');

const toNum = (v) => (v === '' || v == null ? null : +v);
const rollingSum = (arr, win = 7) =>
  arr.map((_, i) => {
    const slice = arr
      .slice(Math.max(0, i - win + 1), i + 1)
      .map((v) => (v == null || isNaN(v) ? null : +v))
      .filter((v) => v != null);
    return slice.length ? slice.reduce((a, b) => a + b, 0) : null;
  });
const index100 = (arr) => {
  const first = arr.find((v) => v != null && v > 0);
  return arr.map((v) => (v != null && first ? (v / first) * 100 : null));
};

// 단순 CSV 파서(따옴표 없는 가정)
async function loadCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('CSV fetch 실패: ' + res.status);
  const text = await res.text();
  const [headerLine, ...lines] = text.trim().split('\n');
  const headers = headerLine.split(',').map((h) => h.trim());
  return lines.map((line) => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i]?.trim()));
    return row;
  });
}

let tMin, tMax; // 범위 버튼에서 사용

(async () => {
  const rows = await loadCSV(CSV_URL);

  const t = rows.map((r) => {
    const ms = Number(r.timestamp);
    return isNaN(ms) ? new Date(r.timestamp) : new Date(ms);
  });
  tMin = new Date(Math.min(...t.map((d) => +d)));
  tMax = new Date(Math.max(...t.map((d) => +d)));

  const priceATOM = rows.map((r) => toNum(r.marketPrice_cosmos));
  const priceONE = rows.map((r) => toNum(r.marketPrice_atomone));
  const volATOM_raw = rows.map((r) => toNum(r.marketVolume_cosmos));
  const volONE_raw = rows.map((r) => toNum(r.marketVolume_atomone));
  const txATOM_raw = rows.map((r) => toNum(r.txCount_cosmos));
  const txONE_raw = rows.map((r) => toNum(r.txCount_atomone));

  const volATOM_7d = rollingSum(volATOM_raw, 7);
  const volONE_7d = rollingSum(volONE_raw, 7);
  const txATOM_7d = rollingSum(txATOM_raw, 7);
  const txONE_7d = rollingSum(txONE_raw, 7);

  const volATOM_idx = index100(volATOM_7d);
  const volONE_idx = index100(volONE_7d);
  const txATOM_idx = index100(txATOM_7d);
  const txONE_idx = index100(txONE_7d);

  const cdVolATOM = volATOM_7d.map((v, i) => [v, volATOM_raw[i]]);
  const cdVolONE = volONE_7d.map((v, i) => [v, volONE_raw[i]]);
  const cdTxATOM = txATOM_7d.map((v, i) => [v, txATOM_raw[i]]);
  const cdTxONE = txONE_7d.map((v, i) => [v, txONE_raw[i]]);

  const tracePriceATOM = {
    x: t,
    y: priceATOM,
    name: 'ATOM – Price (actual)',
    mode: 'lines',
    line: { width: 3, color: COLOR_ATOM },
    yaxis: 'y',
    xaxis: 'x2',
  };
  const tracePriceONE = {
    x: t,
    y: priceONE,
    name: 'ATOMONE – Price (actual)',
    mode: 'lines',
    line: { width: 3, color: COLOR_ATOMONE },
    yaxis: 'y',
    xaxis: 'x2',
  };

  const traceVolATOM = {
    x: t,
    y: volATOM_idx,
    name: 'ATOM – Volume (area, 7d index=100)',
    type: 'scatter',
    mode: 'lines',
    fill: 'tozeroy',
    xaxis: 'x2',
    yaxis: 'y2',
    line: { width: 3, color: COLOR_ATOM },
    opacity: 0.2,
    customdata: cdVolATOM,
    hovertemplate:
      '%{y:.2f}<br>',
  };
  const traceVolONE = {
    x: t,
    y: volONE_idx,
    name: 'ATOMONE – Volume (area, 7d index=100)',
    type: 'scatter',
    mode: 'lines',
    fill: 'tozeroy',
    yaxis: 'y2',
    xaxis: 'x2',
    line: { width: 3, color: COLOR_ATOMONE },
    opacity: 0.2,
    customdata: cdVolONE,
    hovertemplate:
      '%{y:.2f}<br>',
  };

  const traceTxATOM = {
    x: t,
    y: txATOM_idx,
    name: 'ATOM – Tx (bar, 7d index=100)',
    type: 'bar',
    yaxis: 'y2',
    xaxis: 'x2',
    marker: { color: COLOR_ATOM },
    opacity: 0.4,
    customdata: cdTxATOM,
    hovertemplate:
      '%{y:.2f}<br>',
  };
  const traceTxONE = {
    x: t,
    y: txONE_idx,
    name: 'ATOMONE – Tx (bar, 7d index=100)',
    type: 'bar',
    yaxis: 'y2',
    xaxis: 'x2',
    marker: { color: COLOR_ATOMONE },
    opacity: 0.4,
    customdata: cdTxONE,
    hovertemplate:
      '%{y:.2f}<br>',
  };
  const traceDummyForSlider = {
    x: t,
    y: t.map(() => null),
    xaxis: 'x', // <- 중요: x축에 붙여서 "이 축도 사용중" 신호
    yaxis: 'y',
    mode: 'lines',
    line: { width: 0 },
    hoverinfo: 'skip',
    showlegend: false,
  };

  // traces
  const traces = [
    traceDummyForSlider, // <- 맨 앞에 넣기
    tracePriceATOM,
    tracePriceONE,
    traceVolATOM,
    traceVolONE,
    traceTxATOM,
    traceTxONE,
  ];

  const layout = {
    hovermode: 'x unified',
    paper_bgcolor: COLOR_BG,
    plot_bgcolor: COLOR_BG,
    font: { color: '#f3eefc' },
    legend: { orientation: 'h', y: -0.22, x: 0.5, xanchor: 'center' }, // 아래 중앙
    margin: { t: 10, r: 72, b: 72, l: 72 }, // 좌우 동일 마진으로 균형
    xaxis: {
      type: 'date',
      rangeslider: { visible: false }, // 미니 그래프 제거
      // rangeselector는 쓰지 않음(HTML 버튼으로 대체)
      tickfont: { size: 12 },
    },
    yaxis: {
      title: 'Price (actual)',
      side: 'left',
      zerolinecolor: 'rgba(255,255,255,.2)',
    },
    yaxis2: {
      title: 'Activity — Volume (area) & Tx (bars) — index=100 (7d)',
      overlaying: 'y',
      side: 'right',
      type: 'linear',
    },
    barmode: 'overlay',
  };

  layout.xaxis = {
    // 슬라이더 + 눈금 담당
    type: 'date',
    visible: true, // x축 눈금/라벨 보이게
    showgrid: false,
    tickfont: { size: 12 },
    rangeslider: {
      visible: true, // ✅ 슬라이더 ON
      thickness: 0.08,
      bgcolor: 'rgba(255,255,255,0.08)',
      bordercolor: 'rgba(255,255,255,0.12)',
      // 트레이스가 null이라 미니그래프는 표시되지 않음
    },
  };

  layout.xaxis2 = {
    // 실제 그래프가 쓰는 축
    type: 'date',
    matches: 'x', // ✅ 슬라이더와 범위 동기화
    anchor: 'y',
    tickfont: { size: 12 },
  };

  // 겹침 방지 & 가운데 느낌
  // 1) 메인 플롯을 살짝 위로 올려서(=아래에 공간 확보)
  layout.yaxis = {
    title: {
      text: 'Price (actual)',
      standoff: 24,
      font: {
        ...FONT_title02,
        color: COLOR_WHITE
      }
    },
    side: 'left', domain: [0.18, 1]
  };
  layout.yaxis2 = {
    title: {
      text: 'Activity — Volume (area) & Tx (bars) — index=100 (7d)',
      standoff: 24,
      font: {
        ...FONT_title02,
        color: COLOR_WHITE
      }
    },
    overlaying: 'y',
    side: 'right',
    type: 'linear',
    domain: [0.18, 1],
  };

  // 2) 하단 여백을 넉넉하게 (슬라이더 + 범례 들어갈 자리)
  layout.margin = { t: 64, r: 80, b: 170, l: 80 };

  // 3) 범례 위치를 "슬라이더 아래, 가운데"로 더 내리기
  layout.legend = {
    orientation: 'h',
    x: 0.5,
    xanchor: 'center',
    y: -0.33, // ↓ 더 내리고 싶으면 -0.36, -0.40 로 조정
    font: { size: 12 },
    itemsizing: 'constant',
  };

  // 4) 슬라이더는 조금 얇게(겹침 느낌 완화)
  layout.xaxis.rangeslider = {
    ...layout.xaxis.rangeslider,
    visible: true,
    thickness: 0.06, // 0.08 → 0.06
    bgcolor: 'rgba(255,255,255,0.10)',
    bordercolor: 'rgba(255,255,255,0.18)',
  };

  window.Plotly.newPlot('chart', traces, layout, {
    responsive: true,
    scrollZoom: false,
  });

  // ===== 상단 컨트롤 연결 =====
  // 1) 로그 토글
  const logToggle = document.getElementById('logToggle');
  logToggle.addEventListener('change', () => {
    window.Plotly.relayout('chart', {
      'yaxis2.type': logToggle.checked ? 'log' : 'linear',
    });
  });

  // 2) 기간 버튼
  const buttons = document.querySelectorAll('.btn[data-range]');
  const setActive = (el) => {
    buttons.forEach((b) => b.classList.toggle('active', b === el));
  };
  const days = (n) => 24 * 3600 * 1000 * n;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActive(btn);
      const key = btn.dataset.range;
      if (key === 'all') {
        window.Plotly.relayout('chart', { 'xaxis.range': [tMin, tMax] });
      } else {
        const n = parseInt(key, 10); // 30 / 90 / 180
        const end = tMax;
        const start = new Date(+end - days(n));
        window.Plotly.relayout('chart', { 'xaxis.range': [start, end] });
      }
    });
  });

  // 도움말 팝오버
  const helpBtn = document.getElementById('helpBtn');
  const pop = document.getElementById('helpPopover');

  function closePop(e) {
    if (!pop.contains(e.target) && e.target !== helpBtn) {
      pop.classList.remove('open');
      helpBtn.classList.remove('is-open');
      helpBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', closePop);
    }
  }

  helpBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !pop.classList.contains('open');

    if (willOpen) {
      pop.classList.add('open');
      helpBtn.classList.add('is-open');
      helpBtn.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', closePop);
    } else {
      pop.classList.remove('open');
      helpBtn.classList.remove('is-open');
      helpBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', closePop);
    }
  });
  // 초기 범위: all
  window.Plotly.relayout('chart', { 'xaxis.range': [tMin, tMax] });
})();
