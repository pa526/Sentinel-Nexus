(function() {
    // Performance optimization: Throttle updates
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 3000; // 3 seconds instead of 2
    
    function throttleUpdate(callback) {
        const now = Date.now();
        if (now - lastUpdateTime >= UPDATE_INTERVAL) {
            lastUpdateTime = now;
            callback();
        }
    }

    // Theme management
    const themeToggle = document.getElementById('theme-toggle');
    function applyTheme() {
        const theme = localStorage.getItem('sn_theme') || 'dark';
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }
    applyTheme();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = localStorage.getItem('sn_theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            localStorage.setItem('sn_theme', next);
            applyTheme();
        });
    }

    // Back to dashboard
    const backBtn = document.getElementById('back-dashboard');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/dashboard';
        });
    }

    // Device selector functionality
    const deviceSelector = document.getElementById('device-selector');
    if (deviceSelector) {
        deviceSelector.addEventListener('change', function() {
            currentSelectedDevice = this.value;
            updateDeviceView(currentSelectedDevice);
        });
    }

    // Initialize device-specific readings
    function initializeDeviceReadings() {
        ['device-1', 'device-2', 'device-3'].forEach(device => {
            // Generate initial readings for each device
            for (let i = 0; i < 50; i++) {
                const now = Date.now() - i * 60000 * 30; // Last 50 readings, 30 min intervals
                deviceReadings[device].push({
                    timestamp: new Date(now),
                    power: (Math.random() * 3 + 0.5).toFixed(2),
                    energy: (Math.random() * 5 + 1).toFixed(2)
                });
            }
        });
    }

    // Update device view based on selection
    function updateDeviceView(deviceId) {
        const data = deviceData[deviceId];
        const banner = document.getElementById('device-status-banner');
        
        // Update banner class
        banner.className = 'device-status-banner ' + deviceId;
        
        // Update banner content
        document.getElementById('selected-device-name').textContent = data.name;
        document.getElementById('selected-device-status').textContent = 
            deviceId === 'all' ? 'Viewing combined data from all devices' : 
            `Status: ${data.status} • Power: ${data.power} kW`;
        
        // Update banner stats
        if (deviceId === 'all') {
            const totalPower = Object.values(deviceData).slice(1).reduce((sum, d) => sum + d.power, 0);
            const totalEnergy = Object.values(deviceData).slice(1).reduce((sum, d) => sum + d.energy, 0);
            document.getElementById('device-power').textContent = totalPower.toFixed(1);
            document.getElementById('device-energy').textContent = totalEnergy.toFixed(1);
        } else {
            document.getElementById('device-power').textContent = data.power.toFixed(1);
            document.getElementById('device-energy').textContent = data.energy.toFixed(1);
        }

        // Update energy flow visualization for selected device
        updateEnergyFlowForDevice(deviceId);
        
        // Update predictions for selected device
        updatePredictionsForDevice(deviceId);
    }

    // Update energy flow for specific device
    function updateEnergyFlowForDevice(deviceId) {
        if (deviceId === 'all') {
            // Show all connections
            document.querySelectorAll('.device-card').forEach(card => {
                card.style.display = '';
            });
        } else {
            // Hide non-selected devices
            document.querySelectorAll('.device-card').forEach(card => {
                const cardDevice = card.getAttribute('data-device');
                if (cardDevice && cardDevice.replace('machinery-', 'device-') === deviceId) {
                    card.style.display = '';
                    card.style.transform = 'scale(1.05)';
                    card.style.transition = 'all 0.3s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        }
        
        // Trigger flow lines redraw
        setTimeout(() => {
            if (typeof drawFlowLines === 'function') {
                drawFlowLines();
            }
        }, 100);
    }

    // Update predictions for specific device
    function updatePredictionsForDevice(deviceId) {
        // This will be called when predictions are generated
        const readings = deviceId === 'all' ? 
            [...deviceReadings['device-1'], ...deviceReadings['device-2'], ...deviceReadings['device-3']] :
            deviceReadings[deviceId];
        
        // Update chart data based on selected device
        // Implementation will be added to prediction initialization
    }

    // Initialize
    initializeDeviceReadings();
    updateDeviceView('all');

    // Socket.IO connection
    const socket = io();

    // Device data storage
    let deviceData = {
        'all': { name: 'All Devices', power: 0, energy: 0 },
        'device-1': { name: 'Machinery 1 (HVAC)', power: 2.5, energy: 45.2, status: 'Active' },
        'device-2': { name: 'Machinery 2 (Water Pump)', power: 1.8, energy: 32.4, status: 'Active' },
        'device-3': { name: 'Machinery 3 (Lighting)', power: 0.9, energy: 15.6, status: 'Active' }
    };

    let currentSelectedDevice = 'all';
    let deviceReadings = {
        'device-1': [],
        'device-2': [],
        'device-3': []
    };

    // Simulated data for demonstration with renewable energy tracking
    let renewableEnergy = {
        solar: 0,
        wind: 0,
        total: 0,
        avgHourly: []
    };

    let windData = {
        currentOutput: 0,
        avg24h: 0,
        windSpeed: 0,
        independenceScore: 0
    };

    let batteryData = {
        level: 65,
        voltage: 48.5,
        current: 12.3,
        temperature: 32,
        cycles: 450,
        health: 85,
        status: 'Charging'
    };

    // Track hourly renewable energy for analysis
    function trackRenewableEnergy(solar, wind) {
        renewableEnergy.solar = parseFloat(solar) || 0;
        renewableEnergy.wind = parseFloat(wind) || 0;
        renewableEnergy.total = renewableEnergy.solar + renewableEnergy.wind;
        
        const now = new Date();
        renewableEnergy.avgHourly.push({
            hour: now.getHours(),
            total: renewableEnergy.total,
            timestamp: now.getTime()
        });
        
        // Keep only last 24 hours
        if (renewableEnergy.avgHourly.length > 24) {
            renewableEnergy.avgHourly.shift();
        }
    }

    // Calculate average renewable energy
    function getAverageRenewableEnergy() {
        if (renewableEnergy.avgHourly.length === 0) return 0;
        const sum = renewableEnergy.avgHourly.reduce((acc, h) => acc + h.total, 0);
        return sum / renewableEnergy.avgHourly.length;
    }

    // Smart battery recommendations based on renewable energy analysis
    function generateSmartBatteryRecommendations() {
        const avgRenewable = getAverageRenewableEnergy();
        const currentRenewable = renewableEnergy.total;
        const batteryLevel = batteryData.level;
        const suggestions = [];
        const now = new Date();
        const currentHour = now.getHours();

        // High renewable energy - suggest charging
        if (currentRenewable > 12) {
            suggestions.push({
                title: '🟢 Optimal Charging Window (NOW)',
                description: `Renewable energy is high (${currentRenewable.toFixed(1)} kW). Charge your battery now to maximize renewable energy usage.`,
                benefit: 'Save $5-8 per charge cycle',
                priority: 'high',
                action: 'Start charging immediately'
            });
        }
        // Medium renewable - suggest smart charging
        else if (currentRenewable > 6 && batteryLevel < 70) {
            suggestions.push({
                title: '🟡 Good Charging Opportunity',
                description: `Renewable energy is moderate (${currentRenewable.toFixed(1)} kW). Consider charging if battery is below 70%.`,
                benefit: 'Save $3-5 per charge cycle',
                priority: 'medium',
                action: 'Charge when renewables peak'
            });
        }
        // Low renewable - suggest using battery
        else if (currentRenewable < 4 && batteryLevel > 40) {
            suggestions.push({
                title: '⚡ Use Battery Now',
                description: `Renewable energy is low (${currentRenewable.toFixed(1)} kW). Switch machinery to battery power to avoid grid usage.`,
                benefit: 'Save $2-4 during low-renewable hours',
                priority: 'high',
                action: 'Switch devices to battery source'
            });
        }

        // Evening peak prediction - save battery for peak hours
        if (currentHour >= 18 && currentHour < 22 && batteryLevel > 50) {
            suggestions.push({
                title: '🌙 Peak Hour Strategy',
                description: 'Evening peak hours (6-10 PM). Reserve battery for peak hours to maximize savings.',
                benefit: 'Save up to $10/day during peak',
                priority: 'high',
                action: 'Reserve battery for 6-10 PM'
            });
        }

        // Low battery warning
        if (batteryLevel < 30) {
            suggestions.push({
                title: '⚠️ Low Battery Warning',
                description: `Battery level critical (${batteryLevel}%). Charge during next renewable energy surge.`,
                benefit: 'Prevent grid dependency',
                priority: 'critical',
                action: 'Charge immediately when renewables peak'
            });
        }

        // Optimal charging times based on historical data
        if (renewableEnergy.avgHourly.length >= 6) {
            const peakHour = renewableEnergy.avgHourly.reduce((max, h) => h.total > max.total ? h : max);
            if (peakHour.total > 10) {
                suggestions.push({
                    title: '📊 Peak Renewable Window Detected',
                    description: `Best time: ${peakHour.hour}:00. Average renewable: ${peakHour.total.toFixed(1)} kW`,
                    benefit: `Save $${(peakHour.total * 0.5).toFixed(2)} per session`,
                    priority: 'medium',
                    action: `Schedule charging at ${peakHour.hour}:00`
                });
            }
        }

        return suggestions;
    }

    // Initialize Wind Energy Panel (Optimized)
    function initWindEnergy() {
        // Simulate wind generation data with throttling
        setInterval(() => {
            throttleUpdate(() => {
                const windGen = parseFloat((Math.random() * 15 + 5).toFixed(1));
                windData.currentOutput = windGen;
                windData.avg24h = (Math.random() * 12 + 4).toFixed(1);
                windData.windSpeed = (Math.random() * 8 + 2).toFixed(1);
                
                // Update renewable energy tracking
                trackRenewableEnergy(renewableEnergy.solar, windGen);
                
                // Calculate independence based on actual renewable vs grid
                const gridUsage = Math.max(0, 8 - renewableEnergy.total);
                const renewablePercent = (renewableEnergy.total / (renewableEnergy.total + gridUsage)) * 100;
                windData.independenceScore = Math.min(100, Math.floor(renewablePercent));

                // Update DOM with requestAnimationFrame for smooth updates
                requestAnimationFrame(() => {
                    const el = document.getElementById('wind-current-output');
                    if (el) el.textContent = windData.currentOutput + ' kW';
                    
                    const avgEl = document.getElementById('wind-avg-24h');
                    if (avgEl) avgEl.textContent = windData.avg24h + ' kW';
                    
                    const speedEl = document.getElementById('wind-speed');
                    if (speedEl) speedEl.textContent = windData.windSpeed + ' m/s';
                    
                    const indEl = document.getElementById('independence-score');
                    if (indEl) indEl.textContent = windData.independenceScore + '%';
                });
            });
        }, UPDATE_INTERVAL);

        // Machinery recommendations
        const recommendations = [
            { name: 'HVAC System', recommendation: 'Shift to wind energy - high availability', impact: 'High' },
            { name: 'Water Pump', recommendation: 'Can utilize wind energy effectively', impact: 'Medium' },
            { name: 'Lighting System', recommendation: 'Consider switching to solar during peak', impact: 'Low' }
        ];

        const recommendationsList = document.getElementById('machinery-recommendations');
        recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <h4>${rec.name}</h4>
                <p>${rec.recommendation}</p>
                <span class="suggestion-benefit">Impact: ${rec.impact}</span>
            `;
            recommendationsList.appendChild(item);
        });

        // Manual shifting controls
        const machineryList = [
            { id: 'mach-1', name: 'HVAC System', currentSource: 'Grid', powerUsage: '2.5 kW' },
            { id: 'mach-2', name: 'Water Pump', currentSource: 'Solar', powerUsage: '1.8 kW' },
            { id: 'mach-3', name: 'Lighting', currentSource: 'Battery', powerUsage: '0.9 kW' }
        ];

        const shiftingControls = document.getElementById('shifting-controls');
        machineryList.forEach(mach => {
            const control = document.createElement('div');
            control.className = 'shift-control';
            control.innerHTML = `
                <div class="shift-control-info">
                    <h4>${mach.name}</h4>
                    <span>Current: ${mach.currentSource} • ${mach.powerUsage}</span>
                </div>
                <div class="shift-control-actions">
                    <button class="source-btn" data-source="grid" data-machinery="${mach.id}">Grid</button>
                    <button class="source-btn" data-source="solar" data-machinery="${mach.id}">Solar</button>
                    <button class="source-btn active" data-source="${mach.currentSource.toLowerCase()}" data-machinery="${mach.id}">Wind</button>
                </div>
            `;
            shiftingControls.appendChild(control);
        });

        // Handle source button clicks
        document.querySelectorAll('.source-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const parent = this.parentElement;
                parent.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const machineryId = this.dataset.machinery;
                const source = this.dataset.source;
                console.log(`Switching ${machineryId} to ${source}`);
                
                // Show visual feedback
                showNotification(`Switching ${machineryId} to ${source.charAt(0).toUpperCase() + source.slice(1)} energy`);
            });
        });
    }

    // Initialize Battery Health Panel
    function initBatteryHealth() {
        function updateBatteryDisplay() {
            const batteryLevelBar = document.getElementById('battery-level-bar');
            batteryLevelBar.style.height = batteryData.level + '%';
            
            document.getElementById('battery-percentage').textContent = batteryData.level + '%';
            document.getElementById('battery-status-text').textContent = batteryData.status;
            document.getElementById('battery-voltage').textContent = batteryData.voltage + ' V';
            document.getElementById('battery-current').textContent = batteryData.current + ' A';
            document.getElementById('battery-temp').textContent = batteryData.temperature + '°C';
            document.getElementById('battery-cycles').textContent = batteryData.cycles;
            document.getElementById('battery-life-estimate').textContent = 
                batteryData.health + '% (' + (batteryData.health / 16.5).toFixed(1) + ' years)';

            // Update health indicator
            const healthIndicator = document.getElementById('health-indicator');
            const healthValue = document.getElementById('health-value');
            healthIndicator.className = 'indicator-fill';
            
            if (batteryData.health >= 80) {
                healthIndicator.classList.add('health-good');
                healthValue.textContent = 'Excellent';
            } else if (batteryData.health >= 60) {
                healthIndicator.classList.add('health-fair');
                healthValue.textContent = 'Good';
            } else {
                healthIndicator.classList.add('health-poor');
                healthValue.textContent = 'Needs Attention';
            }
            
            healthIndicator.style.width = batteryData.health + '%';
        }

        // Simulate battery data updates (Optimized with smart charging logic)
        setInterval(() => {
            throttleUpdate(() => {
                // Smart charging logic based on renewable energy
                const renewable = renewableEnergy.total;
                const maxLevel = 100;
                const minLevel = 0;
                
                // If renewable energy is high and battery is low, charge faster
                if (renewable > 10 && batteryData.level < 90) {
                    batteryData.level = Math.min(maxLevel, batteryData.level + (renewable / 10) * 1.5);
                    batteryData.status = 'Smart Charging';
                }
                // If renewable is low and battery has charge, discharge slightly
                else if (renewable < 3 && batteryData.level > 30) {
                    batteryData.level = Math.max(minLevel, batteryData.level - 0.3);
                    batteryData.status = 'Discharging to Load';
                }
                // Normal operation
                else {
                    batteryData.level = Math.max(0, Math.min(100, batteryData.level + (Math.random() - 0.45) * 0.5));
                    batteryData.status = batteryData.level > 90 ? 'Standby' : 'Balanced';
                }
                
                batteryData.voltage = (47 + Math.random() * 2).toFixed(1);
                batteryData.current = (10 + Math.random() * 5).toFixed(1);
                batteryData.temperature = Math.floor(28 + Math.random() * 8);
                
                // Update display
                requestAnimationFrame(() => {
                    updateBatteryDisplay();
                    updateSmartChargingSuggestions();
                });
            });
        }, UPDATE_INTERVAL);

        // Update smart charging suggestions dynamically
        function updateSmartChargingSuggestions() {
            const suggestionsList = document.getElementById('charging-suggestions');
            if (!suggestionsList) return;
            
            // Clear existing suggestions
            suggestionsList.innerHTML = '';
            
            // Get AI-powered recommendations based on renewable energy analysis
            const suggestions = generateSmartBatteryRecommendations();
            
            if (suggestions.length === 0) {
                suggestionsList.innerHTML = '<div class="suggestion-item"><h4>✅ System Optimized</h4><p>No immediate action needed. Battery management is optimal.</p></div>';
                return;
            }
            
            suggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                
                const priorityClass = suggestion.priority === 'critical' ? 'suggestion-critical' : 
                                    suggestion.priority === 'high' ? 'suggestion-high' : 'suggestion-medium';
                
                item.innerHTML = `
                    <h4 class="${priorityClass}">${suggestion.title}</h4>
                    <p>${suggestion.description}</p>
                    <div style="margin-top: 8px;">
                        <span class="suggestion-benefit">💰 Benefit: ${suggestion.benefit}</span>
                        <div style="margin-top: 6px; font-size: 11px; color: #22c55e; font-weight: 600;">
                            ↪️ ${suggestion.action}
                        </div>
                    </div>
                `;
                suggestionsList.appendChild(item);
            });
        }

        updateBatteryDisplay();
    }

    // Initialize Energy Flow Visualization (Optimized)
    function initEnergyFlow() {
        // Simulate energy flow data
        const sources = ['solar', 'wind', 'battery', 'grid'];
        let devices = [
            { id: 'machinery-1', name: 'Machinery 1', power: 2.5, source: 'Solar', priority: 'high' },
            { id: 'machinery-2', name: 'Machinery 2', power: 1.8, source: 'Wind', priority: 'medium' },
            { id: 'machinery-3', name: 'Machinery 3', power: 0.9, source: 'Battery', priority: 'low' }
        ];

        let svg = null;
        let animationId = null;

        // Create SVG for energy flow visualization (only once)
        const flowCanvas = document.getElementById('energy-flow-canvas');
        if (flowCanvas) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '1';
            flowCanvas.appendChild(svg);

            // Draw clearer flow lines with beautiful arrows
            function drawFlowLines() {
                if (!svg) return;
                svg.innerHTML = '';
                
                // Add definitions for arrow markers
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                
                // Green arrow for active flows
                const markerGreen = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                markerGreen.setAttribute('id', 'arrow-green');
                markerGreen.setAttribute('markerWidth', '12');
                markerGreen.setAttribute('markerHeight', '12');
                markerGreen.setAttribute('refX', '12');
                markerGreen.setAttribute('refY', '6');
                markerGreen.setAttribute('orient', 'auto');
                const polygonGreen = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygonGreen.setAttribute('points', '0 0, 12 6, 0 12');
                polygonGreen.setAttribute('fill', '#22c55e');
                polygonGreen.setAttribute('stroke', '#16a34a');
                polygonGreen.setAttribute('stroke-width', '1');
                polygonGreen.setAttribute('opacity', '0.9');
                markerGreen.appendChild(polygonGreen);
                defs.appendChild(markerGreen);
                
                // Orange arrow for consumption flows
                const markerOrange = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                markerOrange.setAttribute('id', 'arrow-orange');
                markerOrange.setAttribute('markerWidth', '12');
                markerOrange.setAttribute('markerHeight', '12');
                markerOrange.setAttribute('refX', '12');
                markerOrange.setAttribute('refY', '6');
                markerOrange.setAttribute('orient', 'auto');
                const polygonOrange = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygonOrange.setAttribute('points', '0 0, 12 6, 0 12');
                polygonOrange.setAttribute('fill', '#f59e0b');
                polygonOrange.setAttribute('stroke', '#d97706');
                polygonOrange.setAttribute('stroke-width', '1');
                polygonOrange.setAttribute('opacity', '0.9');
                markerOrange.appendChild(polygonOrange);
                defs.appendChild(markerOrange);
                
                // Blue arrow for grid flows
                const markerBlue = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                markerBlue.setAttribute('id', 'arrow-blue');
                markerBlue.setAttribute('markerWidth', '12');
                markerBlue.setAttribute('markerHeight', '12');
                markerBlue.setAttribute('refX', '12');
                markerBlue.setAttribute('refY', '6');
                markerBlue.setAttribute('orient', 'auto');
                const polygonBlue = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygonBlue.setAttribute('points', '0 0, 12 6, 0 12');
                polygonBlue.setAttribute('fill', '#3b82f6');
                polygonBlue.setAttribute('stroke', '#2563eb');
                polygonBlue.setAttribute('stroke-width', '1');
                polygonBlue.setAttribute('opacity', '0.9');
                markerBlue.appendChild(polygonBlue);
                defs.appendChild(markerBlue);
                
                svg.appendChild(defs);

                // Map sources to devices with intelligent connections
                const connections = [
                    { source: 'solar', device: 'machinery-1', priority: 'high', color: '#22c55e', arrow: 'arrow-green' },
                    { source: 'wind', device: 'machinery-2', priority: 'medium', color: '#22c55e', arrow: 'arrow-green' },
                    { source: 'battery', device: 'machinery-3', priority: 'low', color: '#22c55e', arrow: 'arrow-green' },
                    { source: 'grid', device: 'machinery-1', priority: 'fallback', color: '#3b82f6', arrow: 'arrow-blue' }
                ];

                // Draw connections from sources to devices
                connections.forEach((conn) => {
                    const sourceCard = document.querySelector(`[data-source="${conn.source}"]`);
                    const deviceCard = document.querySelector(`[data-device="${conn.device}"]`);
                    
                    if (!sourceCard || !deviceCard || !sourceCard.classList.contains('active')) return;

                    const srcRect = sourceCard.getBoundingClientRect();
                    const canvasRect = flowCanvas.getBoundingClientRect();
                    const srcX = srcRect.left + srcRect.width / 2 - canvasRect.left;
                    const srcY = srcRect.top + srcRect.height;

                    const devRect = deviceCard.getBoundingClientRect();
                    const devX = devRect.left + devRect.width / 2 - canvasRect.left;
                    const devY = devRect.top;

                    // Create wire-frame style connection line
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const controlY = (srcY + devY) / 2;
                    const controlX1 = srcX + (devX - srcX) * 0.3;
                    const controlX2 = srcX + (devX - srcX) * 0.7;
                    const d = `M ${srcX} ${srcY} C ${controlX1} ${srcY + 50}, ${controlX2} ${devY - 50}, ${devX} ${devY}`;
                    
                    path.setAttribute('d', d);
                    path.setAttribute('fill', 'none');
                    path.setAttribute('stroke', conn.color);
                    path.setAttribute('stroke-width', '5');
                    path.setAttribute('stroke-linecap', 'round');
                    path.setAttribute('opacity', conn.priority === 'high' ? '0.95' : '0.75');
                    path.setAttribute('marker-end', `url(#${conn.arrow})`);
                    path.setAttribute('stroke-dasharray', conn.color === '#3b82f6' ? '12,6' : '10,4');
                    path.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(34, 197, 94, 0.3))');
                    svg.appendChild(path);

                    // Add animated energy particles along wire
                    for (let i = 0; i < 2; i++) {
                        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        circle.setAttribute('r', '8');
                        circle.setAttribute('fill', conn.color);
                        circle.setAttribute('opacity', '1');
                        circle.setAttribute('class', `energy-particle-${conn.device}-${i}`);
                        circle.setAttribute('stroke', '#ffffff');
                        circle.setAttribute('stroke-width', '1.5');
                        svg.appendChild(circle);

                        // Animate each particle along the wire
                        let t = i * 0.5;
                        const animateParticle = () => {
                            t += 0.012;
                            if (t > 1) t = 0;
                            
                            // Calculate position along curved path (Bezier curve)
                            const t1 = t;
                            const x = (1-t1)**2 * srcX + 2*(1-t1)*t1 * controlX1 + t1**2 * devX;
                            const y = (1-t1)**2 * srcY + 2*(1-t1)*t1 * controlY + t1**2 * devY;
                            
                            circle.setAttribute('cx', x);
                            circle.setAttribute('cy', y);
                            requestAnimationFrame(animateParticle);
                        };
                        animateParticle();
                    }
                    
                    // Add connection label on the wire
                    const midPoint = {
                        x: (srcX + devX) / 2,
                        y: (srcY + devY) / 2
                    };
                    
                    const textLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    textLabel.setAttribute('x', midPoint.x);
                    textLabel.setAttribute('y', midPoint.y);
                    textLabel.setAttribute('text-anchor', 'middle');
                    textLabel.setAttribute('fill', conn.color);
                    textLabel.setAttribute('font-size', '10');
                    textLabel.setAttribute('font-weight', '600');
                    textLabel.setAttribute('opacity', '0.7');
                    textLabel.setAttribute('style', 'pointer-events: none;');
                    textLabel.textContent = `${conn.source.toUpperCase()}`;
                    svg.appendChild(textLabel);
                });

                // Add glow filter for particles (only once)
                if (!svg.querySelector('filter#glow')) {
                    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
                    filter.setAttribute('id', 'glow');
                    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
                    feGaussianBlur.setAttribute('stdDeviation', '4');
                    feGaussianBlur.setAttribute('result', 'coloredBlur');
                    filter.appendChild(feGaussianBlur);
                    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
                    const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
                    feMergeNode1.setAttribute('in', 'coloredBlur');
                    const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
                    feMergeNode2.setAttribute('in', 'SourceGraphic');
                    feMerge.appendChild(feMergeNode1);
                    feMerge.appendChild(feMergeNode2);
                    filter.appendChild(feMerge);
                    defs.appendChild(filter);
                    
                    // Apply glow to all energy particles
                    requestAnimationFrame(() => {
                        document.querySelectorAll('[class^="energy-particle"]').forEach(el => {
                            el.setAttribute('filter', 'url(#glow)');
                        });
                    });
                }
            }

            drawFlowLines();
            
            // Update less frequently for better performance
            setInterval(() => {
                throttleUpdate(() => {
                    drawFlowLines();
                });
            }, UPDATE_INTERVAL);
        }

        // Update source data with renewable energy tracking
        setInterval(() => {
            throttleUpdate(() => {
                const solarPower = parseFloat((Math.random() * 8 + 3).toFixed(1));
                const windPower = parseFloat((Math.random() * 12 + 2).toFixed(1));
                const batteryPower = parseFloat((Math.random() * 5 + 1).toFixed(1));
                const gridPower = parseFloat((Math.random() * 2).toFixed(1));

                // Track renewable energy
                trackRenewableEnergy(solarPower, windPower);

                requestAnimationFrame(() => {
                    const solarEl = document.getElementById('solar-power');
                    if (solarEl) solarEl.textContent = solarPower + ' kW';
                    
                    const windEl = document.getElementById('wind-power');
                    if (windEl) windEl.textContent = windPower + ' kW';
                    
                    const battEl = document.getElementById('battery-flow-power');
                    if (battEl) battEl.textContent = batteryPower + ' kW';
                    
                    const gridEl = document.getElementById('grid-power');
                    if (gridEl) gridEl.textContent = gridPower + ' kW';
                });

                // Update active sources based on renewable generation
                sources.forEach(source => {
                    const card = document.querySelector(`[data-source="${source}"]`);
                    if (card) {
                        let isActive = false;
                        if (source === 'solar' && solarPower > 5) isActive = true;
                        else if (source === 'wind' && windPower > 8) isActive = true;
                        else if (source === 'battery' && batteryData.level > 50) isActive = true;
                        else if (source === 'grid' && renewableEnergy.total < 8) isActive = true;
                        
                        if (isActive) {
                            card.classList.add('active');
                        } else {
                            card.classList.remove('active');
                        }
                    }
                });
            });
        }, UPDATE_INTERVAL);

        // Optimized device information updates
        setInterval(() => {
            throttleUpdate(() => {
                devices.forEach(device => {
                    const deviceCard = document.querySelector(`[data-device="${device.id}"]`);
                    if (deviceCard) {
                        const powerEl = deviceCard.querySelector('.device-power');
                        const sourceEl = deviceCard.querySelector('.device-source');
                        
                        // Smart source assignment based on renewable energy
                        let bestSource = 'Grid'; // default
                        if (renewableEnergy.solar > renewableEnergy.wind && renewableEnergy.solar > 8) {
                            bestSource = 'Solar';
                        } else if (renewableEnergy.wind > 8) {
                            bestSource = 'Wind';
                        } else if (batteryData.level > 50 && renewableEnergy.total < 6) {
                            bestSource = 'Battery';
                        }
                        
                        requestAnimationFrame(() => {
                            if (powerEl) {
                                const newPower = (parseFloat(device.power) + (Math.random() - 0.5) * 0.3).toFixed(1);
                                powerEl.textContent = newPower + ' kW';
                            }
                            if (sourceEl && Math.random() < 0.2) {
                                sourceEl.textContent = bestSource;
                            }
                        });
                    }
                });
            });
        }, UPDATE_INTERVAL);
    }

    // Initialize Energy Prediction System
    let predictionChart;
    function initEnergyPrediction() {
        const ctx = document.getElementById('prediction-chart');
        if (!ctx) return;

        // Generate prediction data
        const now = new Date();
        const labels = [];
        const generationData = [];
        const consumptionData = [];
        
        for (let i = 0; i < 24; i++) {
            const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
            labels.push(hour.getHours() + ':00');
            generationData.push(Math.random() * 15 + 5);
            consumptionData.push(Math.random() * 10 + 3);
        }

        const isDark = document.body.classList.contains('dark');
        
        predictionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '🟢 Energy Generation',
                        data: generationData,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        borderWidth: 3,
                        tension: 0.5,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#22c55e',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        shadowOffsetX: 0,
                        shadowOffsetY: 4,
                        shadowBlur: 10,
                        shadowColor: 'rgba(34, 197, 94, 0.4)'
                    },
                    {
                        label: '🟠 Energy Consumption',
                        data: consumptionData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        borderWidth: 3,
                        tension: 0.5,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        shadowOffsetX: 0,
                        shadowOffsetY: 4,
                        shadowBlur: 10,
                        shadowColor: 'rgba(245, 158, 11, 0.4)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#e5e7eb',
                            padding: 15,
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#f8fafc',
                        bodyColor: '#e5e7eb',
                        borderColor: '#4f46e5',
                        borderWidth: 2,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        boxWidth: 8,
                        boxHeight: 8,
                        titleFont: {
                            size: 13,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 12
                        },
                        callbacks: {
                            title: function(context) {
                                return '⏰ ' + context[0].label;
                            },
                            label: function(context) {
                                return context.dataset.label.replace('🟢 ', '').replace('🟠 ', '') + ': ' + context.parsed.y.toFixed(2) + ' kW';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            padding: 8,
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 8
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.15)',
                            drawBorder: false,
                            lineWidth: 1
                        }
                    },
                    y: {
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            padding: 8
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.15)',
                            drawBorder: false,
                            lineWidth: 1
                        },
                        title: {
                            display: true,
                            text: 'Power (kW)',
                            color: '#cbd5e1',
                            font: {
                                size: 12,
                                weight: '600'
                            }
                        }
                    }
                }
            }
        });

        // Shift recommendations
        const recommendations = [
            { 
                time: '14:00', 
                action: 'Shift HVAC to solar',
                savings: 'Save 2.3 kWh',
                confidence: 'High (85%)'
            },
            { 
                time: '18:00', 
                action: 'Use battery for peak hour',
                savings: 'Save 1.8 kWh',
                confidence: 'Medium (72%)'
            },
            { 
                time: '22:00', 
                action: 'Switch to wind energy',
                savings: 'Save 3.2 kWh',
                confidence: 'High (90%)'
            }
        ];

        const recommendationsList = document.getElementById('shift-recommendations');
        recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <h4>${rec.time} - ${rec.action}</h4>
                <p>${rec.savings} • Confidence: ${rec.confidence}</p>
            `;
            recommendationsList.appendChild(item);
        });

        // Update savings display
        document.getElementById('energy-saved').textContent = '45.2 kWh';
        document.getElementById('cost-saved').textContent = '$6.78';
        document.getElementById('prediction-confidence').textContent = '82%';

        // Time range buttons
        document.querySelectorAll('.time-range-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.time-range-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const range = this.dataset.range;
                updatePredictionChart(range);
            });
        });

        function updatePredictionChart(range) {
            const pointCount = range === '24h' ? 24 : range === '7d' ? 7 : 30;
            const labels = [];
            const generationData = [];
            const consumptionData = [];
            
            for (let i = 0; i < pointCount; i++) {
                if (range === '24h') {
                    labels.push(String(i).padStart(2, '0') + ':00');
                } else {
                    labels.push('Day ' + (i + 1));
                }
                generationData.push(Math.random() * 15 + 5);
                consumptionData.push(Math.random() * 10 + 3);
            }
            
            predictionChart.data.labels = labels;
            predictionChart.data.datasets[0].data = generationData;
            predictionChart.data.datasets[1].data = consumptionData;
            predictionChart.update();
        }
    }

    // Notification system
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4f46e5, #6366f1);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(79, 70, 229, 0.4);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Initialize all panels
    initWindEnergy();
    initBatteryHealth();
    initEnergyFlow();
    initEnergyPrediction();

    console.log('Energy Management System initialized');
})();
