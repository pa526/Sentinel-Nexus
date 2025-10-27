(function () {
    let currentDeviceId = window.__INITIAL_DEVICE_ID__;
    const initial = Array.isArray(window.__INITIAL_READINGS__) ? window.__INITIAL_READINGS__ : [];

    // Stats DOM
    const statPower = document.getElementById('stat-power');
    const statEnergy = document.getElementById('stat-energy');
    const statVoltage = document.getElementById('stat-voltage');
    const statCurrent = document.getElementById('stat-current');
    const statTime = document.getElementById('stat-time');
    const tableBody = document.getElementById('readings-table');

    // Prepare chart datasets
    const MAX_POINTS = 150; // keep charts readable
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000; // show last 24 hours
    const nowMs = Date.now();
    // Filter initial readings to the last 24 hours
    const initialTwentyFourHours = initial.filter(r => {
        const t = Date.parse(r.timestamp);
        return !Number.isNaN(t) && t >= nowMs - TWENTY_FOUR_HOURS_MS;
    });
    // Store time as both ms and label strings to manage rolling window
    let timeValuesMs = initialTwentyFourHours.map(r => Date.parse(r.timestamp));
    let timeLabels = timeValuesMs.map(t => {
        const date = new Date(t);
        // Format as hourly intervals (e.g., "12:00", "13:00", "14:00")
        return date.getHours().toString().padStart(2, '0') + ':00';
    });
    // Convert to kW and kWh for visualization
    let powerData = initialTwentyFourHours.map(r => Number(r.powerW) / 1000);
    let energyData = initialTwentyFourHours.map(r => Number(r.energyWh) / 1000);

    function chooseStep(max) {
        const m = Math.max(0, Number(max) || 0);
        if (m <= 1) return 0.2;
        if (m <= 2) return 0.5;
        if (m <= 5) return 1;
        if (m <= 10) return 2;
        if (m <= 20) return 5;
        return 10;
    }
    function niceMax(max, step) {
        const s = step || 1;
        return Math.ceil((Number(max) || 0) / s) * s;
    }
    function applyYAxis(powerChartRef, energyChartRef) {
        // Power axis
        const pMax = Math.max(0, ...powerChartRef.data.datasets[0].data);
        const pStep = chooseStep(pMax);
        powerChartRef.options.scales.y.ticks.stepSize = pStep;
        powerChartRef.options.scales.y.suggestedMax = niceMax(pMax, pStep);

        // Energy axis
        const eMax = Math.max(0, ...energyChartRef.data.datasets[0].data);
        const eStep = chooseStep(eMax);
        energyChartRef.options.scales.y.ticks.stepSize = eStep;
        energyChartRef.options.scales.y.suggestedMax = niceMax(eMax, eStep);
    }

    const powerCtx = document.getElementById('powerChart');
    const energyCtx = document.getElementById('energyChart');

    function chartColors() {
        const dark = document.body.classList.contains('dark');
        return {
            grid: dark ? '#334155' : '#e5e7eb',
            ticks: dark ? '#e5e7eb' : '#374151',
            label: dark ? '#f8fafc' : '#111827'
        };
    }

    let pc = chartColors();
    const powerChart = new Chart(powerCtx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Power (kW)',
                data: powerData,
                borderColor: '#3b82f6', // Modern blue
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                pointRadius: 0,
                pointHoverRadius: 8,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 3,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                // Gradient background
                gradient: {
                    backgroundColor: {
                        type: 'linear',
                        x0: 0,
                        y0: 0,
                        x1: 0,
                        y1: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                            { offset: 0.5, color: 'rgba(59, 130, 246, 0.1)' },
                            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                        ]
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { 
                duration: 2000, 
                easing: 'easeInOutQuart',
                delay: (context) => context.dataIndex * 50
            },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { 
                    display: true, 
                    labels: { 
                        color: pc.label,
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20
                    }
                },
                decimation: { enabled: true, algorithm: 'min-max' },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    cornerRadius: 12,
                    displayColors: true,
                    callbacks: {
                        label: (ctx) => ` ${ctx.parsed.y.toFixed(3)} kW`,
                        title: (ctx) => `Time: ${ctx[0].label}`
                    }
                }
            },
            layout: { padding: { top: 16, right: 20, bottom: 24, left: 20 } },
            scales: {
                x: {
                    display: true,
                    grid: { 
                        color: 'rgba(59, 130, 246, 0.1)',
                        drawBorder: false,
                        lineWidth: 1
                    },
                    ticks: {
                        color: pc.ticks,
                        maxTicksLimit: 24,
                        autoSkip: true,
                        autoSkipPadding: 8,
                        padding: 16,
                        font: {
                            size: 13,
                            weight: '600'
                        },
                        callback: function(value, index, ticks) {
                            const showEvery = Math.max(1, Math.floor(ticks.length / 24));
                            return (index % showEvery === 0) ? this.getLabelForValue(value) : '';
                        }
                    },
                    title: { 
                        display: true, 
                        text: 'Time (Hours)', 
                        color: pc.label,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: { top: 20 }
                    }
                },
                y: {
                    display: true,
                    grid: { 
                        color: 'rgba(59, 130, 246, 0.1)',
                        drawBorder: false,
                        lineWidth: 1
                    },
                    ticks: { 
                        color: pc.ticks,
                        padding: 16,
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    },
                    title: { 
                        display: true, 
                        text: 'Power (kW)', 
                        color: pc.label,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: { bottom: 20 }
                    },
                    beginAtZero: true
                }
            }
        }
    });

    let ec = chartColors();
    const energyChart = new Chart(energyCtx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Energy (kWh)',
                data: energyData,
                borderColor: '#10b981', // Modern emerald green
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                pointRadius: 0,
                pointHoverRadius: 8,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#10b981',
                pointBorderWidth: 3,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                // Gradient background
                gradient: {
                    backgroundColor: {
                        type: 'linear',
                        x0: 0,
                        y0: 0,
                        x1: 0,
                        y1: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                            { offset: 0.5, color: 'rgba(16, 185, 129, 0.1)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
                        ]
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { 
                duration: 2000, 
                easing: 'easeInOutQuart',
                delay: (context) => context.dataIndex * 50
            },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { 
                    display: true, 
                    labels: { 
                        color: ec.label,
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20
                    }
                },
                decimation: { enabled: true, algorithm: 'min-max' },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    cornerRadius: 12,
                    displayColors: true,
                    callbacks: {
                        label: (ctx) => ` ${ctx.parsed.y.toFixed(3)} kWh`,
                        title: (ctx) => `Time: ${ctx[0].label}`
                    }
                }
            },
            layout: { padding: { top: 16, right: 20, bottom: 24, left: 20 } },
            scales: {
                x: {
                    display: true,
                    grid: { 
                        color: 'rgba(16, 185, 129, 0.1)',
                        drawBorder: false,
                        lineWidth: 1
                    },
                    ticks: {
                        color: ec.ticks,
                        maxTicksLimit: 24,
                        autoSkip: true,
                        autoSkipPadding: 8,
                        padding: 16,
                        font: {
                            size: 13,
                            weight: '600'
                        },
                        callback: function(value, index, ticks) {
                            const showEvery = Math.max(1, Math.floor(ticks.length / 24));
                            return (index % showEvery === 0) ? this.getLabelForValue(value) : '';
                        }
                    },
                    title: { 
                        display: true, 
                        text: 'Time (Hours)', 
                        color: ec.label,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: { top: 20 }
                    }
                },
                y: {
                    display: true,
                    grid: { 
                        color: 'rgba(16, 185, 129, 0.1)',
                        drawBorder: false,
                        lineWidth: 1
                    },
                    ticks: { 
                        color: ec.ticks,
                        padding: 16,
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    },
                    title: { 
                        display: true, 
                        text: 'Energy (kWh)', 
                        color: ec.label,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: { bottom: 20 }
                    },
                    beginAtZero: true
                }
            }
        }
    });

    // Apply initial y-axis spacing based on data
    applyYAxis(powerChart, energyChart);

    function updateStats(reading) {
        statPower.textContent = reading.powerW ?? '-';
        statEnergy.textContent = reading.energyWh ?? '-';
        statVoltage.textContent = reading.voltageV ?? '-';
        statCurrent.textContent = reading.currentA ?? '-';
        statTime.textContent = new Date(reading.timestamp).toLocaleString();
    }

    function pushRow(reading) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(reading.timestamp).toLocaleString()}</td>
            <td>${reading.powerW}</td>
            <td>${reading.energyWh}</td>
            <td>${reading.voltageV ?? '-'}</td>
            <td>${reading.currentA ?? '-'}</td>
        `;
        tableBody.appendChild(tr);
    }

    // Initialize stats with last reading if present
    if (initial.length > 0) {
        updateStats(initial[initial.length - 1]);
    }

    // Socket.IO for live updates
    const socket = io();
    socket.on('reading:new', (reading) => {
        if (currentDeviceId !== '__ALL__' && reading.device_id !== currentDeviceId) return;

        // update charts
        const tsMs = Date.parse(reading.timestamp);
        if (Number.isNaN(tsMs)) return;
        const timeLabel = new Date(tsMs).toLocaleTimeString();
        timeValuesMs.push(tsMs);
        powerChart.data.labels.push(timeLabel);
        powerChart.data.datasets[0].data.push(Number(reading.powerW) / 1000);
        if (powerChart.data.labels.length > MAX_POINTS) {
            powerChart.data.labels = powerChart.data.labels.slice(-MAX_POINTS);
            powerChart.data.datasets[0].data = powerChart.data.datasets[0].data.slice(-MAX_POINTS);
            timeValuesMs = timeValuesMs.slice(-MAX_POINTS);
        }
        // drop points older than 24 hours
        const cutoff = tsMs - TWENTY_FOUR_HOURS_MS;
        while (timeValuesMs.length && timeValuesMs[0] < cutoff) {
            timeValuesMs.shift();
            powerChart.data.labels.shift();
            powerChart.data.datasets[0].data.shift();
        }
        powerChart.update('none');

        energyChart.data.labels.push(timeLabel);
        energyChart.data.datasets[0].data.push(Number(reading.energyWh) / 1000);
        if (energyChart.data.labels.length > MAX_POINTS) {
            energyChart.data.labels = energyChart.data.labels.slice(-MAX_POINTS);
            energyChart.data.datasets[0].data = energyChart.data.datasets[0].data.slice(-MAX_POINTS);
        }
        // keep energy labels in sync with power labels/timeValues
        while (energyChart.data.labels.length > powerChart.data.labels.length) {
            energyChart.data.labels.shift();
            energyChart.data.datasets[0].data.shift();
        }
        energyChart.update('none');

        // Re-apply y-axis spacing after new point
        applyYAxis(powerChart, energyChart);

        // update stats and table
        updateStats(reading);
        pushRow(reading);
    });

    // Device selector navigate
    const deviceSelect = document.getElementById('device-select');
    async function fetchReadingsFor(deviceId, limit) {
        const params = new URLSearchParams();
        if (deviceId && deviceId !== '__ALL__') params.set('device_id', deviceId);
        if (limit) params.set('limit', String(limit));
        const res = await fetch(`/api/readings?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch readings');
        const data = await res.json();
        // Normalize: coerce numbers and timestamps, sort ascending
        const normalized = (Array.isArray(data) ? data : []).map(r => ({
            ...r,
            powerW: Number(r.powerW),
            energyWh: Number(r.energyWh),
            voltageV: r.voltageV != null ? Number(r.voltageV) : r.voltageV,
            currentA: r.currentA != null ? Number(r.currentA) : r.currentA,
            _tsNum: Date.parse(r.timestamp)
        }))
        .filter(r => !Number.isNaN(r._tsNum))
        .sort((a, b) => a._tsNum - b._tsNum)
        .filter(r => r._tsNum >= Date.now() - TWENTY_FOUR_HOURS_MS)
        .map(({ _tsNum, ...rest }) => rest);
        return normalized;
    }

    function rebuildChartsAndTable(readings) {
        // rebuild labels/datasets for last 24 hours
        timeValuesMs = readings.map(r => Date.parse(r.timestamp));
        timeLabels = timeValuesMs.map(t => {
            const date = new Date(t);
            // Format as hourly intervals (e.g., "12:00", "13:00", "14:00")
            return date.getHours().toString().padStart(2, '0') + ':00';
        });
        powerData = readings.map(r => Number(r.powerW) / 1000);
        energyData = readings.map(r => Number(r.energyWh) / 1000);

        powerChart.data.labels = timeLabels;
        powerChart.data.datasets[0].data = powerData;
        energyChart.data.labels = timeLabels;
        energyChart.data.datasets[0].data = energyData;
        // Re-apply y-axis spacing after dataset rebuild
        applyYAxis(powerChart, energyChart);
        // re-apply y-axis spacing after dataset rebuild
        applyYAxis(powerChart, energyChart);
        powerChart.update();
        energyChart.update();

        // rebuild table
        tableBody.innerHTML = '';
        for (const r of readings) {
            pushRow(r);
        }

        // update stats
        if (readings.length > 0) updateStats(readings[readings.length - 1]);
    }

    if (deviceSelect) {
        deviceSelect.addEventListener('change', async () => {
            const selected = deviceSelect.value;
            currentDeviceId = selected;
            try {
                const readings = await fetchReadingsFor(selected);
                rebuildChartsAndTable(readings);
            } catch (e) {
                console.error(e);
            }
        });
    }

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    function setThemeButtonText(theme) {
        if (!themeToggle) return;
        themeToggle.textContent = theme === 'dark' ? 'Toggle bright' : 'Toggle dark';
    }
    function applyTheme() {
        const t = localStorage.getItem('sn_theme') || 'dark';
        if (t === 'dark') document.body.classList.add('dark');
        else document.body.classList.remove('dark');
        setThemeButtonText(t);
    }
    applyTheme();
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = localStorage.getItem('sn_theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            localStorage.setItem('sn_theme', next);
            applyTheme();
            // Update chart colors after theme change
            const c = chartColors();
            powerChart.options.plugins.legend.labels.color = c.label;
            powerChart.options.scales.x.grid.color = c.grid;
            powerChart.options.scales.y.grid.color = c.grid;
            powerChart.options.scales.x.ticks.color = c.ticks;
            powerChart.options.scales.y.ticks.color = c.ticks;
            powerChart.update('none');

            const c2 = chartColors();
            energyChart.options.plugins.legend.labels.color = c2.label;
            energyChart.options.scales.x.grid.color = c2.grid;
            energyChart.options.scales.y.grid.color = c2.grid;
            energyChart.options.scales.x.ticks.color = c2.ticks;
            energyChart.options.scales.y.ticks.color = c2.ticks;
            energyChart.update('none');
        });
    }

    // --- Simple Login UI Logic ---
    const logoutBtn = document.getElementById('logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/logout', { method: 'POST' });
            window.location.href = '/login';
        });
    }

    // --- Sample Data Generation ---
    const sampleDevice = document.getElementById('sample-device');
    const samplePoints = document.getElementById('sample-points');
    const sampleInterval = document.getElementById('sample-interval');
    const sampleBtn = document.getElementById('sample-generate');
    const sampleStatus = document.getElementById('sample-status');

    async function refreshReadingsView() {
        // Simple approach: reload the page to fetch new initialReadings
        window.location.reload();
    }

    if (sampleBtn) {
        sampleBtn.addEventListener('click', async () => {
            const dev = (sampleDevice && sampleDevice.value) ? sampleDevice.value.trim() : (deviceId === '__ALL__' ? 'DEV-001' : deviceId);
            const points = samplePoints && samplePoints.value ? Number(samplePoints.value) : 50;
            const interval = sampleInterval && sampleInterval.value ? Number(sampleInterval.value) : 30;
            try {
                sampleStatus.textContent = 'Generating...';
                const res = await fetch('/api/sample/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ device_id: dev, points, intervalSeconds: interval })
                });
                if (!res.ok) throw new Error('Request failed');
                const data = await res.json();
                sampleStatus.textContent = `Inserted ${data.inserted} readings for ${dev}`;
                setTimeout(() => { sampleStatus.textContent = ''; }, 2000);
                refreshReadingsView();
            } catch (e) {
                console.error(e);
                sampleStatus.textContent = 'Failed to generate sample';
            }
        });
    }
})();


