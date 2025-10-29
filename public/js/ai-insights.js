(function(){
  // Theme management
  const aiThemeToggle = document.getElementById('ai-theme-toggle');
  function applyTheme() {
    const theme = localStorage.getItem('sn_theme') || 'dark';
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
  applyTheme();

  if (aiThemeToggle) {
    aiThemeToggle.addEventListener('click', () => {
      const current = localStorage.getItem('sn_theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('sn_theme', next);
      applyTheme();
    });
  }

  const deviceSelect = document.getElementById('ai-device');
  const fromInput = document.getElementById('ai-from');
  const toInput = document.getElementById('ai-to');
  const applyBtn = document.getElementById('ai-apply');

  const anomalyBody = document.getElementById('ai-anomaly-body');
  const recoList = document.getElementById('ai-reco-list');
  const summaryEl = document.getElementById('ai-summary');
  const refreshSummaryBtn = document.getElementById('ai-refresh-summary');
  const historyWrap = document.getElementById('ai-history');
  const historyApply = document.getElementById('ai-history-apply');
  const historyConf = document.getElementById('ai-history-confidence');
  const historyFrom = document.getElementById('ai-history-from');
  const historyTo = document.getElementById('ai-history-to');
  const autoApply = document.getElementById('ai-auto-apply');

  const predictionCanvas = document.getElementById('ai-prediction-chart');
  const nextHourEl = document.getElementById('ai-next-hour');
  const confEl = document.getElementById('ai-confidence');
  const confBar = document.getElementById('ai-confidence-fill');
  const statusIcon = document.getElementById('ai-status-icon');
  const statusText = document.getElementById('ai-status-text');
  const lastUpdatedEl = document.getElementById('ai-last-updated');

  const DEVICE_ALL = '__ALL__';
  let currentDeviceId = window.__AI_DEVICE_ID__ || DEVICE_ALL;

  // Populate device dropdown (reuse existing /api paths if available)
  async function loadDevices() {
    // Devices are server-rendered in the select; ensure currentDeviceId selected
    currentDeviceId = window.__AI_DEVICE_ID__ || DEVICE_ALL;
    if (deviceSelect) deviceSelect.value = currentDeviceId;
  }

  function formatTs(ts){ return new Date(ts).toLocaleString(); }

  // Fetch AI endpoints (placeholders as per prompt)
  async function fetchPrediction(deviceId, from, to) {
    // Mock prediction data
    const now = Date.now();
    const data = [];
    for (let i = 0; i < 24; i++) {
      const ts = now + (i * 60 * 60 * 1000);
      const base = 2.5 + Math.sin(i * 0.3) * 0.8;
      const noise = (Math.random() - 0.5) * 0.3;
      data.push({
        timestamp: new Date(ts).toISOString(),
        predicted: base + noise,
        confidence: Math.max(0.6, 0.9 - Math.abs(noise) * 2)
      });
    }
    return data;
  }

  async function fetchAnomalies(deviceId, from, to) {
    // Mock anomaly data
    const anomalies = [];
    const now = Date.now();
    for (let i = 0; i < 3; i++) {
      anomalies.push({
        timestamp: new Date(now - (i + 1) * 2 * 60 * 60 * 1000).toISOString(),
        device_id: deviceId === DEVICE_ALL ? `DEV-00${i + 1}` : deviceId,
        type: ['Power Spike', 'Voltage Drop', 'Energy Surge'][i],
        severity: ['high', 'medium', 'low'][i],
        description: `Detected ${['power spike', 'voltage drop', 'energy surge'][i]} at ${new Date(now - (i + 1) * 2 * 60 * 60 * 1000).toLocaleString()}`
      });
    }
    return anomalies;
  }

  async function fetchRecommendations(deviceId) {
    // Mock recommendations
    return [
      {
        id: 'opt-1',
        title: 'Schedule AC for Off-Peak Hours',
        description: 'Move AC usage to 10 PM - 6 AM to save 15% on energy costs',
        impact: 'high',
        effort: 'low',
        savings: '$45/month'
      },
      {
        id: 'opt-2',
        title: 'Optimize Water Heater Temperature',
        description: 'Reduce water heater temperature by 10°F to save energy',
        impact: 'medium',
        effort: 'low',
        savings: '$20/month'
      },
      {
        id: 'opt-3',
        title: 'Install Smart Thermostat',
        description: 'Smart thermostat can reduce heating/cooling costs by 20%',
        impact: 'high',
        effort: 'high',
        savings: '$60/month'
      }
    ];
  }

  async function fetchHistory(deviceId, confidence, from, to) {
    // Mock history data
    const history = [];
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      history.push({
        timestamp: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
        action: ['Prediction Generated', 'Anomaly Detected', 'Recommendation Applied'][i % 3],
        confidence: ['high', 'medium', 'low'][i % 3],
        details: `AI performed ${['prediction', 'anomaly detection', 'optimization'][i % 3]} analysis`
      });
    }
    return history;
  }

  // Chart rendering functions
  function renderChart(predictionData) {
    if (!predictionCanvas || !predictionData) return;
    
    const ctx = predictionCanvas.getContext('2d');
    const labels = predictionData.map(p => new Date(p.timestamp).toLocaleTimeString());
    const predicted = predictionData.map(p => p.predicted);
    const confidence = predictionData.map(p => p.confidence);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Predicted Energy (kWh)',
          data: predicted,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Energy (kWh)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Time'
            }
          }
        }
      }
    });
  }

  function renderForecast(predictionData) {
    if (!predictionData || predictionData.length === 0) return;
    
    const nextHour = predictionData[0]?.predicted || 0;
    const avgConfidence = predictionData.reduce((sum, p) => sum + p.confidence, 0) / predictionData.length;
    
    if (nextHourEl) nextHourEl.textContent = `Next Hour: ${nextHour.toFixed(2)} kWh`;
    if (confEl) confEl.textContent = `${Math.round(avgConfidence * 100)}%`;
    if (confBar) confBar.style.width = `${avgConfidence * 100}%`;
    
    const status = avgConfidence > 0.8 ? '🟢' : avgConfidence > 0.6 ? '🟡' : '🔴';
    const statusText = avgConfidence > 0.8 ? 'High Confidence' : avgConfidence > 0.6 ? 'Medium Confidence' : 'Low Confidence';
    
    if (statusIcon) statusIcon.textContent = status;
    if (statusText) statusText.textContent = statusText;
    if (lastUpdatedEl) lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleString()}`;
  }

  function renderAnomalies(anomalies) {
    if (!anomalyBody || !anomalies) return;
    
    anomalyBody.innerHTML = '';
    anomalies.forEach(anomaly => {
      const row = document.createElement('tr');
      const severityClass = anomaly.severity === 'high' ? 'text-red-600' : anomaly.severity === 'medium' ? 'text-yellow-600' : 'text-green-600';
      row.innerHTML = `
        <td>${formatTs(anomaly.timestamp)}</td>
        <td>${anomaly.device_id}</td>
        <td>${anomaly.type}</td>
        <td class="${severityClass}">${anomaly.severity.toUpperCase()}</td>
        <td>${anomaly.description}</td>
      `;
      anomalyBody.appendChild(row);
    });
  }

  function renderRecommendations(recommendations) {
    if (!recoList || !recommendations) return;
    
    recoList.innerHTML = '';
    recommendations.forEach(rec => {
      const card = document.createElement('div');
      card.className = 'ai-reco-card';
      card.innerHTML = `
        <h4>${rec.title}</h4>
        <p>${rec.description}</p>
        <div style="display:flex; justify-content:space-between; margin-top:8px;">
          <span class="ai-impact-${rec.impact}">${rec.impact.toUpperCase()}</span>
          <span class="ai-savings">${rec.savings}</span>
        </div>
        <button class="ai-apply-btn" onclick="applyRecommendation('${rec.id}')">Apply</button>
      `;
      recoList.appendChild(card);
    });
  }

  function renderSummary(text) {
    if (summaryEl) summaryEl.textContent = text;
  }

  function renderHistory(history) {
    if (!historyWrap || !history) return;
    
    historyWrap.innerHTML = '';
    history.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'ai-history-item';
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
          <span>${entry.action}</span>
          <span class="ai-confidence-${entry.confidence}">${entry.confidence.toUpperCase()}</span>
        </div>
        <div style="font-size:12px; color:#6b7280; margin-top:4px;">
          ${formatTs(entry.timestamp)} - ${entry.details}
        </div>
      `;
      historyWrap.appendChild(item);
    });
  }

  function renderOverviewCharts() {
    const initData = window.__AI_INIT_DATA__ || {};
    const { byType = {}, byStatus = {}, energyByDevice = [] } = initData;

    // Type chart - Bar Chart
    const typeCtx = document.getElementById('ai-type-chart');
    if (typeCtx) {
      new Chart(typeCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(byType),
          datasets: [{
            label: 'Device Count',
            data: Object.values(byType),
            backgroundColor: ['#4f46e5', '#16a34a', '#f59e0b', '#ef4444'],
            borderColor: ['#4f46e5', '#16a34a', '#f59e0b', '#ef4444'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              },
              title: {
                display: true,
                text: 'Number of Devices'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Device Type'
              }
            }
          }
        }
      });
    }

    // Status chart - Bar Chart
    const statusCtx = document.getElementById('ai-status-chart');
    if (statusCtx) {
      new Chart(statusCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(byStatus),
          datasets: [{
            label: 'Device Count',
            data: Object.values(byStatus),
            backgroundColor: ['#16a34a', '#ef4444', '#f59e0b'],
            borderColor: ['#16a34a', '#ef4444', '#f59e0b'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              },
              title: {
                display: true,
                text: 'Number of Devices'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Device Status'
              }
            }
          }
        }
      });
    }

    // Energy share chart
    const energyCtx = document.getElementById('ai-energy-share');
    if (energyCtx) {
      new Chart(energyCtx, {
        type: 'bar',
        data: {
          labels: energyByDevice.map(d => d.device_id),
          datasets: [{
            label: 'Energy (kWh)',
            data: energyByDevice.map(d => d.kWh),
            backgroundColor: energyByDevice.map((_, index) => {
              const colors = ['#4f46e5', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
              return colors[index % colors.length];
            }),
            borderColor: energyByDevice.map((_, index) => {
              const colors = ['#4f46e5', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
              return colors[index % colors.length];
            }),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false // Hide legend for cleaner look with many devices
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.parsed.y.toFixed(2)} kWh`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Energy (kWh)'
              },
              ticks: {
                callback: function(value) {
                  return value.toFixed(1) + ' kWh';
                }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Device ID'
              },
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      });
    }
  }

  // Mock AI insight generation
  async function generateInsights(){
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "AI analysis complete. Energy patterns show optimal usage during off-peak hours. Consider scheduling high-consumption devices for 10 PM - 6 AM to maximize savings.";
  }

  async function refreshAll(){
    const dev = deviceSelect.value || currentDeviceId || DEVICE_ALL;
    const from = fromInput.value || '';
    const to = toInput.value || '';

    const [pred, anomalies, recos, history] = await Promise.all([
      fetchPrediction(dev, from, to),
      fetchAnomalies(dev, from, to),
      fetchRecommendations(dev),
      fetchHistory(dev, historyConf.value, historyFrom.value, historyTo.value)
    ]);

    renderChart(pred);
    renderForecast(pred);
    renderAnomalies(anomalies);
    renderRecommendations(recos);
    renderSummary('Insights refreshed.');
    renderHistory(history);
  }

  // Init
  loadDevices();
  deviceSelect.value = currentDeviceId;
  applyBtn.addEventListener('click', refreshAll);
  refreshSummaryBtn.addEventListener('click', async () => { await generateInsights(); await refreshAll(); });
  historyApply.addEventListener('click', refreshAll);
  autoApply.addEventListener('change', async (e) => {
    if (e.target.checked) { await generateInsights(); await refreshAll(); }
  });

  renderOverviewCharts();
  refreshAll();
})();

