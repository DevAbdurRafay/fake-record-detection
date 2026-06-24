const PAGE_SIZE = 20;

let allResults  = [];
let filtered    = [];
let currentPage = 1;

const emptyState       = document.getElementById('emptyState');
const dashboardContent = document.getElementById('dashboardContent');
const tableBody        = document.getElementById('tableBody');
const pagination       = document.getElementById('pagination');
const filterSelect     = document.getElementById('filterPrediction');
const searchInput      = document.getElementById('searchInput');
const exportBtn        = document.getElementById('exportBtn');
const tableMeta        = document.getElementById('tableMeta');

// ── LOAD DATA ────────────────────────────────────────
const raw = sessionStorage.getItem('analysisResults');

if (!raw) {
  emptyState.classList.remove('hidden');
  dashboardContent.classList.add('hidden');
} else {
  const data   = JSON.parse(raw);
  allResults   = data.results;
  filtered     = [...allResults];

  const total = data.summary.total;
  const fake  = data.summary.fake;
  const susp  = data.summary.suspicious;
  const norm  = data.summary.normal;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statFake').textContent  = fake;
  document.getElementById('statSusp').textContent  = susp;
  document.getElementById('statNorm').textContent  = norm;

  document.getElementById('dashSub').textContent =
    `${total} records analyzed · ${fake} fake · ${susp} suspicious · ${norm} normal`;

  // Progress bars on summary cards
  if (total > 0) {
    document.getElementById('fakeBar').style.width = (fake / total * 100) + '%';
    document.getElementById('suspBar').style.width = (susp / total * 100) + '%';
    document.getElementById('normBar').style.width = (norm / total * 100) + '%';
  }

  emptyState.classList.add('hidden');
  dashboardContent.classList.remove('hidden');

  initCharts(fake, susp, norm, allResults);
  renderTable();
}

// ── FILTERS ──────────────────────────────────────────
filterSelect.addEventListener('change', applyFilters);
searchInput.addEventListener('input', applyFilters);

function applyFilters() {
  const pred   = filterSelect.value;
  const search = searchInput.value.toLowerCase().trim();

  filtered = allResults.filter(r => {
    const matchPred   = pred === 'all' || r.prediction === pred;
    const matchSearch = !search ||
      String(r.applicant_name  || '').toLowerCase().includes(search) ||
      String(r.email           || '').toLowerCase().includes(search) ||
      String(r.university      || '').toLowerCase().includes(search) ||
      String(r.application_id  || '').toLowerCase().includes(search) ||
      String(r.department      || '').toLowerCase().includes(search);
    return matchPred && matchSearch;
  });

  currentPage = 1;
  renderTable();
}

// ── TABLE ─────────────────────────────────────────────
function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filtered.slice(start, start + PAGE_SIZE);

  tableMeta.textContent =
    filtered.length === allResults.length
      ? `Showing all ${allResults.length} records`
      : `Showing ${filtered.length} of ${allResults.length} records`;

  if (page.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:40px;color:var(--muted)">No records match your filters</td></tr>`;
    pagination.innerHTML = '';
    return;
  }

  tableBody.innerHTML = page.map(r => {
    const scoreClass = r.anomaly_score >= 0
      ? 'score-good'
      : r.anomaly_score >= -0.1
        ? 'score-mid'
        : 'score-bad';

    return `
    <tr>
      <td class="td-mono">${esc(r.application_id)}</td>
      <td>${esc(r.applicant_name)}</td>
      <td class="td-email" title="${esc(r.email)}">${esc(r.email)}</td>
      <td>${esc(r.university)}</td>
      <td class="td-mono">${r.cgpa ?? '—'}</td>
      <td style="font-size:0.8rem;color:var(--muted2)">${esc(r.submission_time) || '—'}</td>
      <td class="td-mono">${r.time_to_fill_sec ?? '—'}s</td>
      <td class="td-score ${scoreClass}">${r.anomaly_score}</td>
      <td><span class="cluster-chip">${r.cluster}</span></td>
      <td><span class="badge badge-${r.prediction}">${r.prediction}</span></td>
      <td>${renderAlerts(r.alerts)}</td>
    </tr>`;
  }).join('');

  renderPagination();
}

function esc(val) {
  if (val == null) return '—';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAlerts(alerts) {
  if (!alerts || alerts.length === 0) return '<span class="no-alerts">None</span>';
  const pills = alerts.map(a =>
    `<span class="alert-pill ${a.severity === 'medium' ? 'medium' : ''}" title="${esc(a.message)}">${a.id.replace(/_/g, ' ')}</span>`
  ).join('');
  return `<div class="alert-pills">${pills}</div>`;
}

// ── PAGINATION ───────────────────────────────────────
function renderPagination() {
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  if (totalPages <= 1) { pagination.innerHTML = ''; return; }

  let html = '';
  const delta = 2;
  const range = [];

  for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
    range.push(i);
  }

  if (currentPage > 1) html += `<button class="page-btn" data-page="${currentPage - 1}">‹ Prev</button>`;
  if (range[0] > 1)    html += `<button class="page-btn" data-page="1">1</button>${range[0] > 2 ? '<span style="color:var(--muted);padding:0 4px">…</span>' : ''}`;

  range.forEach(i => {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  });

  if (range[range.length - 1] < totalPages) {
    html += `${range[range.length - 1] < totalPages - 1 ? '<span style="color:var(--muted);padding:0 4px">…</span>' : ''}<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  if (currentPage < totalPages) html += `<button class="page-btn" data-page="${currentPage + 1}">Next ›</button>`;

  pagination.innerHTML = html;
  pagination.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      renderTable();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// ── CHARTS ───────────────────────────────────────────
function initCharts(fake, susp, norm, results) {

  // ── Doughnut — Prediction Distribution ──────────────
  const distCtx = document.getElementById('distributionChart').getContext('2d');
  new Chart(distCtx, {
    type: 'doughnut',
    data: {
      labels: ['Fake', 'Suspicious', 'Normal'],
      datasets: [{
        data: [fake, susp, norm],
        backgroundColor: [
          'rgba(244,63,94,0.8)',
          'rgba(245,158,11,0.8)',
          'rgba(16,185,129,0.8)',
        ],
        borderColor: [
          'rgba(244,63,94,1)',
          'rgba(245,158,11,1)',
          'rgba(16,185,129,1)',
        ],
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      // FIX: click chart segment → filter table
      onClick: (e, elements) => {
        if (!elements.length) {
          filterSelect.value = 'all';
          applyFilters();
          return;
        }
        const labels = ['fake', 'suspicious', 'normal'];
        filterSelect.value = labels[elements[0].index];
        applyFilters();
        document.querySelector('.filters-row').scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            font: { size: 12, family: 'Inter' },
            padding: 20,
            usePointStyle: true,
            pointStyleWidth: 8,
          },
          // FIX: clicking legend label also filters
          onClick: (e, legendItem, legend) => {
            const labels = ['fake', 'suspicious', 'normal'];
            filterSelect.value = labels[legendItem.index];
            applyFilters();
            document.querySelector('.filters-row').scrollIntoView({ behavior: 'smooth', block: 'center' });
          },
        },
        tooltip: {
          backgroundColor: '#0d1020',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw} (${((ctx.raw / (fake + susp + norm)) * 100).toFixed(1)}%) — click to filter`,
          },
        },
      },
    },
  });

  // ── Bar — Cluster Composition ────────────────────────
  const clusterCounts = [0, 1, 2].map(c => {
    const group = results.filter(r => r.cluster === c);
    return {
      fake:       group.filter(r => r.prediction === 'fake').length,
      suspicious: group.filter(r => r.prediction === 'suspicious').length,
      normal:     group.filter(r => r.prediction === 'normal').length,
    };
  });

  const clCtx = document.getElementById('clusterChart').getContext('2d');
  new Chart(clCtx, {
    type: 'bar',
    data: {
      labels: ['Cluster 0', 'Cluster 1', 'Cluster 2'],
      datasets: [
        {
          label: 'Fake',
          data: clusterCounts.map(c => c.fake),
          backgroundColor: 'rgba(244,63,94,0.75)',
          borderColor: 'rgba(244,63,94,1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Suspicious',
          data: clusterCounts.map(c => c.suspicious),
          backgroundColor: 'rgba(245,158,11,0.75)',
          borderColor: 'rgba(245,158,11,1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Normal',
          data: clusterCounts.map(c => c.normal),
          backgroundColor: 'rgba(16,185,129,0.75)',
          borderColor: 'rgba(16,185,129,1)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      // FIX: click bar segment → filter table by prediction type
      onClick: (e, elements) => {
        if (!elements.length) {
          filterSelect.value = 'all';
          applyFilters();
          return;
        }
        const labels = ['fake', 'suspicious', 'normal'];
        filterSelect.value = labels[elements[0].datasetIndex];
        applyFilters();
        document.querySelector('.filters-row').scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            font: { size: 12, family: 'Inter' },
            padding: 20,
            usePointStyle: true,
            pointStyleWidth: 8,
          },
          // FIX: clicking legend label also filters
          onClick: (e, legendItem, legend) => {
            const labels = ['fake', 'suspicious', 'normal'];
            filterSelect.value = labels[legendItem.datasetIndex];
            applyFilters();
            document.querySelector('.filters-row').scrollIntoView({ behavior: 'smooth', block: 'center' });
          },
        },
        tooltip: {
          backgroundColor: '#0d1020',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          callbacks: {
            afterLabel: () => 'Click to filter table',
          },
        },
      },
      scales: {
        x: {
          stacked: false,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#64748b', font: { family: 'Inter', size: 12 } },
          border: { color: 'rgba(255,255,255,0.06)' },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#64748b', font: { family: 'Inter', size: 12 }, precision: 0 },
          border: { color: 'rgba(255,255,255,0.06)' },
        },
      },
    },
  });

  // FIX: pointer cursor on both charts
  document.getElementById('distributionChart').style.cursor = 'pointer';
  document.getElementById('clusterChart').style.cursor = 'pointer';
}

// ── EXPORT CSV ───────────────────────────────────────
exportBtn.addEventListener('click', () => {
  if (!filtered.length) return;

  const headers = [
    'application_id', 'applicant_name', 'email', 'university', 'department',
    'cgpa', 'submission_time', 'time_to_fill_sec', 'email_domain_type',
    'anomaly_score', 'cluster', 'prediction', 'ground_truth', 'alert_count',
  ];

  const rows = filtered.map(r => [
    r.application_id, r.applicant_name, r.email, r.university, r.department,
    r.cgpa, r.submission_time, r.time_to_fill_sec, r.email_domain_type,
    r.anomaly_score, r.cluster, r.prediction, r.ground_truth || '',
    r.alerts?.length || 0,
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`));

  const csv  = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `anomaly_results_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});