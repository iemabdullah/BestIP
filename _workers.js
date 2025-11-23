export default {
  async scheduled(event, env, ctx) {
    console.log('Running scheduled IP update...');
    await updateAllIPs(env);
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Check if KV is bound
    if (!env.IP_STORAGE) {
      return new Response('KV namespace IP_STORAGE is not bound. Please bind it in Worker settings.', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      switch (path) {
        case '/':
          return await serveHTML(env);
        case '/update':
          if (request.method !== 'POST') {
            return jsonResponse({ error: 'Method not allowed' }, 405);
          }
          return await handleUpdate(env);
        case '/ips':
          return await handleGetIPs(env);
        case '/ip.txt':
          return await handleGetIPs(env);
        case '/raw':
          return await handleRawIPs(env);
        case '/speedtest':
          return await handleSpeedTest(request, env);
        case '/itdog-data':
          return await handleItdogData(env);
        default:
          return jsonResponse({ error: 'Endpoint not found' }, 404);
      }
    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({ error: error.message }, 500);
    }
  }
};

// Serve HTML page
async function serveHTML(env) {
  const data = await getStoredIPs(env);
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloudflare IP Collector</title>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            background: #f8fafc;
            color: #334155;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        /* Header and social icons */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .header-content h1 {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
            font-weight: 700;
        }
        
        .header-content p {
            color: #64748b;
            font-size: 1.1rem;
        }
        
        .social-links {
            display: flex;
            gap: 15px;
        }
        
        .social-link {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: white;
            border: 1px solid #e2e8f0;
            transition: all 0.3s ease;
            text-decoration: none;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .social-link:hover {
            background: #f8fafc;
            transform: translateY(-2px);
            border-color: #cbd5e1;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .social-link.youtube {
            color: #dc2626;
        }
        
        .social-link.youtube:hover {
            background: #fef2f2;
            border-color: #fecaca;
        }
        
        .social-link.github {
            color: #1f2937;
        }
        
        .social-link.github:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
        }
        
        .social-link.telegram {
            color: #3b82f6;
        }
        
        .social-link.telegram:hover {
            background: #eff6ff;
            border-color: #bfdbfe;
        }
        
        /* Card design */
        .card {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 24px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .card h2 {
            font-size: 1.5rem;
            color: #1e40af;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        /* Statistics */
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .stat {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 8px;
        }
        
        /* Button group */
        .button-group {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .button {
            padding: 12px 20px;
            border: none;
            border-radius: 10px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #3b82f6;
            color: white;
            border: 1px solid #3b82f6;
        }
        
        .button:hover {
            background: #2563eb;
            border-color: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }
        
        .button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .button-success {
            background: #10b981;
            border-color: #10b981;
        }
        
        .button-success:hover {
            background: #059669;
            border-color: #059669;
            box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
        }
        
        .button-warning {
            background: #f59e0b;
            border-color: #f59e0b;
        }
        
        .button-warning:hover {
            background: #d97706;
            border-color: #d97706;
            box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
        }
        
        .button-secondary {
            background: white;
            color: #475569;
            border-color: #cbd5e1;
        }
        
        .button-secondary:hover {
            background: #f8fafc;
            border-color: #94a3b8;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* IP list */
        .ip-list-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .ip-list {
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            max-height: 500px;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
        }
        
        .ip-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
            transition: background 0.3s ease;
        }
        
        .ip-item:hover {
            background: #f1f5f9;
        }
        
        .ip-item:last-child {
            border-bottom: none;
        }
        
        .ip-info {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .ip-address {
            font-family: 'SF Mono', 'Courier New', monospace;
            font-weight: 600;
            min-width: 140px;
            color: #1e293b;
        }
        
        .speed-result {
            font-size: 0.85rem;
            padding: 4px 12px;
            border-radius: 8px;
            background: #e2e8f0;
            min-width: 70px;
            text-align: center;
            font-weight: 600;
        }
        
        .speed-fast {
            background: #d1fae5;
            color: #065f46;
        }
        
        .speed-medium {
            background: #fef3c7;
            color: #92400e;
        }
        
        .speed-slow {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .action-buttons {
            display: flex;
            gap: 8px;
        }
        
        .small-btn {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 0.8rem;
            border: 1px solid #cbd5e1;
            background: white;
            color: #475569;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .small-btn:hover {
            background: #f8fafc;
            border-color: #94a3b8;
        }
        
        .small-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* Loading and status */
        .loading {
            display: none;
            text-align: center;
            padding: 30px;
        }
        
        .spinner {
            border: 3px solid #e2e8f0;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .result {
            margin: 20px 0;
            padding: 16px 20px;
            border-radius: 12px;
            display: none;
            border-left: 4px solid;
        }
        
        .success {
            background: #d1fae5;
            color: #065f46;
            border-left-color: #10b981;
        }
        
        .error {
            background: #fee2e2;
            color: #991b1b;
            border-left-color: #ef4444;
        }
        
        /* Progress bar */
        .speed-test-progress {
            margin: 16px 0;
            background: #e2e8f0;
            border-radius: 8px;
            height: 8px;
            overflow: hidden;
            display: none;
        }
        
        .speed-test-progress-bar {
            background: linear-gradient(90deg, #3b82f6, #06b6d4);
            height: 100%;
            width: 0%;
            transition: width 0.3s ease;
        }
        
        /* Data sources */
        .sources {
            display: grid;
            gap: 12px;
        }
        
        .source {
            padding: 12px 16px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        
        .source.error {
            border-left-color: #ef4444;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
        }
        
        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 16px;
            max-width: 500px;
            width: 90%;
            border: 1px solid #e2e8f0;
            box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
        }
        
        .modal h3 {
            margin-bottom: 16px;
            color: #1e40af;
        }
        
        .modal-buttons {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                gap: 20px;
                text-align: center;
            }
            
            .header-content h1 {
                font-size: 2rem;
            }
            
            .button-group {
                flex-direction: column;
            }
            
            .button {
                width: 100%;
                justify-content: center;
            }
            
            .ip-list-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .ip-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
            }
            
            .ip-info {
                width: 100%;
                justify-content: space-between;
            }
            
            .action-buttons {
                width: 100%;
                justify-content: flex-end;
            }
            
            .modal-buttons {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header section -->
        <div class="header">
            <div class="header-content">
                <h1>🌐 Cloudflare IP Collector</h1>
                <p>Network Acceleration Expert | Intelligent Speed Testing & Optimization</p>
            </div>
            <div class="social-links">
                <a href="https://www.instagram.com/em.abdullah__/" target="_blank" title="Software Recommendations" class="social-link youtube">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12 9.545 15.568z"/>
                    </svg>
                </a>
                <a href="https://github.com/iemabdullah/BestIP" target="_blank" title="GitHub" class="social-link github">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.085 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                </a>
                <a href="https://t.me/ABDULLAHMETHOD" target="_blank" title="Telegram" class="social-link telegram">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="m7.06510669 16.9258959c5.22739451-2.1065178 8.71314291-3.4952633 10.45724521-4.1662364 4.9797665-1.9157646 6.0145193-2.2485535 6.6889567-2.2595423.1483363-.0024169.480005.0315855.6948461.192827.1814076.1361492.23132.3200675.2552048.4491519.0238847.1290844.0536269.4231419.0299841.65291-.2698553 2.6225356-1.4375148 8.986738-2.0315537 11.9240228-.2513602 1.2428753-.7499132 1.5088847-1.2290685 1.5496672-1.0413153.0886298-1.8284257-.4857912-2.8369905-1.0972863-1.5782048-.9568691-2.5327083-1.3984317-4.0646293-2.3321592-1.7703998-1.0790837-.212559-1.583655.7963867-2.5529189.2640459-.2536609 4.7753906-4.3097041 4.755976-4.431706-.0070494-.0442984-.1409018-.481649-.2457499-.5678447-.104848-.0861957-.2595946-.0567202-.3712641-.033278-.1582881.0332286-2.6794907 1.5745492-7.5636077 4.6239616-.715635.4545193-1.3638349.6759763-1.9445998.6643712-.64024672-.0127938-1.87182452-.334829-2.78737602-.6100966-1.12296117-.3376271-1.53748501-.4966332-1.45976769-1.0700283.04048-.2986597.32581586-.610598.8560076-.935815z"/>
                    </svg>
                </a>
            </div>
        </div>

        <!-- System status card -->
        <div class="card">
            <h2>📊 System Status</h2>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value" id="ip-count">${data.count || 0}</div>
                    <div>IP Address Count</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="last-updated">${data.lastUpdated ? 'Updated' : 'Not Updated'}</div>
                    <div>Last Updated</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="last-time">${data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'Never Updated'}</div>
                    <div>Update Time</div>
                </div>
            </div>
            
            <div class="button-group">
                <button class="button" onclick="updateIPs()" id="update-btn">
                    🔄 Update Now
                </button>
                <a href="/ips" class="button button-success" download="cloudflare_ips.txt">
                    📥 Download List
                </a>
                <a href="/ip.txt" class="button button-secondary" target="_blank">
                    🔗 View Text
                </a>
                <button class="button button-warning" onclick="startSpeedTest()" id="speedtest-btn">
                    ⚡ Start Speed Test
                </button>
                <button class="button" onclick="openItdogModal()">
                    🌐 ITDog Speed Test
                </button>
                <button class="button button-secondary" onclick="refreshData()">
                    🔄 Refresh Status
                </button>
            </div>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Collecting IP addresses from multiple sources, please wait...</p>
            </div>
            
            <div class="result" id="result"></div>
        </div>

        <!-- IP list card -->
        <div class="card">
            <div class="ip-list-header">
                <h2>📋 IP Address List</h2>
                <div>
                    <button class="small-btn" onclick="copyAllIPs()">
                        📋 Copy All
                    </button>
                    <button class="small-btn" onclick="sortBySpeed()" id="sort-btn">
                        🔽 Sort by Speed
                    </button>
                </div>
            </div>
            
            <div class="speed-test-progress" id="speed-test-progress">
                <div class="speed-test-progress-bar" id="speed-test-progress-bar"></div>
            </div>
            <div style="text-align: center; margin: 8px 0; font-size: 0.9rem; color: #64748b;" id="speed-test-status">Ready for speed test...</div>
            
            <div class="ip-list" id="ip-list">
                ${data.ips && data.ips.length > 0 ? 
                  data.ips.map(ip => `
                    <div class="ip-item" data-ip="${ip}">
                        <div class="ip-info">
                            <span class="ip-address">${ip}</span>
                            <span class="speed-result" id="speed-${ip.replace(/\./g, '-')}">-</span>
                        </div>
                        <div class="action-buttons">
                            <button class="small-btn" onclick="testSingleIP('${ip}')" id="test-${ip.replace(/\./g, '-')}">Test</button>
                            <button class="small-btn" onclick="copyIP('${ip}')">Copy</button>
                        </div>
                    </div>
                  `).join('') : 
                  '<p style="text-align: center; color: #64748b; padding: 40px;">No IP address data available, please click update button to get</p>'
                }
            </div>
        </div>

        <!-- Data sources card -->
        <div class="card">
            <h2>🌍 Data Source Status</h2>
            <div class="sources" id="sources">
                ${data.sources ? data.sources.map(source => `
                    <div class="source ${source.status === 'success' ? '' : 'error'}">
                        <strong>${source.name}</strong>: 
                        ${source.status === 'success' ? 
                          `Successfully obtained ${source.count} IPs` : 
                          `Failed: ${source.error}`
                        }
                    </div>
                `).join('') : '<p style="color: #64748b;">No data source information available</p>'}
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Cloudflare IP Collector &copy; ${new Date().getFullYear()} | Based on Python script conversion</p>
        </div>
    </div>

    <!-- ITDog modal -->
    <div class="modal" id="itdog-modal">
        <div class="modal-content">
            <h3>🌐 ITDog Batch TCPing Speed Test</h3>
            <p>ITDog.cn provides TCPing speed testing from multiple domestic monitoring points, which can more accurately test IP connectivity within China.</p>
            <p><strong>Usage:</strong></p>
            <ol style="margin-left: 20px; margin-bottom: 16px;">
                <li>Click the button below to copy all IP addresses</li>
                <li>Open the ITDog batch TCPing page</li>
                <li>Paste the copied IPs into the input box</li>
                <li>Click the start test button</li>
            </ol>
            <p><strong>Note:</strong> ITDog free version may have IP quantity limits, please test in batches if there are too many IPs.</p>
            <div class="modal-buttons">
                <button class="button button-secondary" onclick="closeItdogModal()">Cancel</button>
                <button class="button" onclick="copyIPsForItdog()">Copy IP List</button>
                <a href="https://www.itdog.cn/batch_tcping/" class="button button-success" target="_blank">Open ITDog</a>
            </div>
        </div>
    </div>

    <script>
        // JavaScript code remains the same
        let speedResults = {};
        let isTesting = false;
        let currentTestIndex = 0;

        function showMessage(message, type = 'success') {
            const result = document.getElementById('result');
            result.className = \`result \${type}\`;
            result.innerHTML = \`<p>\${message}</p>\`;
            result.style.display = 'block';
            setTimeout(() => {
                result.style.display = 'none';
            }, 3000);
        }

        function openItdogModal() {
            document.getElementById('itdog-modal').style.display = 'flex';
        }

        function closeItdogModal() {
            document.getElementById('itdog-modal').style.display = 'none';
        }

        async function copyIPsForItdog() {
            try {
                const response = await fetch('/itdog-data');
                const data = await response.json();
                
                if (data.ips && data.ips.length > 0) {
                    const ipText = data.ips.join('\\n');
                    await navigator.clipboard.writeText(ipText);
                    showMessage('IP list copied, please paste to ITDog website');
                    closeItdogModal();
                } else {
                    showMessage('No IP addresses available for speed testing', 'error');
                }
            } catch (error) {
                console.error('Failed to get ITDog data:', error);
                showMessage('Failed to get IP list', 'error');
            }
        }

        function copyIP(ip) {
            navigator.clipboard.writeText(ip).then(() => {
                showMessage(\`Copied IP: \${ip}\`);
            }).catch(err => {
                showMessage('Copy failed, please copy manually', 'error');
            });
        }

        function copyAllIPs() {
            const ipItems = document.querySelectorAll('.ip-item span.ip-address');
            const allIPs = Array.from(ipItems).map(span => span.textContent).join('\\n');
            
            if (!allIPs) {
                showMessage('No IP addresses to copy', 'error');
                return;
            }
            
            navigator.clipboard.writeText(allIPs).then(() => {
                showMessage(\`Copied \${ipItems.length} IP addresses\`);
            }).catch(err => {
                showMessage('Copy failed, please copy manually', 'error');
            });
        }

        async function testSingleIP(ip) {
            const testBtn = document.getElementById(\`test-\${ip.replace(/\./g, '-')}\`);
            const speedElement = document.getElementById(\`speed-\${ip.replace(/\./g, '-')}\`);
            
            testBtn.disabled = true;
            testBtn.textContent = 'Testing...';
            speedElement.textContent = 'Testing...';
            speedElement.className = 'speed-result';
            
            try {
                const startTime = performance.now();
                const response = await fetch(\`/speedtest?ip=\${ip}\`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}\`);
                }
                
                const data = await response.json();
                const endTime = performance.now();
                const latency = endTime - startTime;
                
                speedResults[ip] = {
                    latency: latency,
                    success: data.success,
                    time: data.time || 'Unknown'
                };
                
                if (data.success) {
                    const speedClass = latency < 200 ? 'speed-fast' : latency < 500 ? 'speed-medium' : 'speed-slow';
                    speedElement.textContent = \`\${Math.round(latency)}ms\`;
                    speedElement.className = \`speed-result \${speedClass}\`;
                    showMessage(\`IP \${ip} speed test completed: \${Math.round(latency)}ms\`);
                } else {
                    speedElement.textContent = 'Failed';
                    speedElement.className = 'speed-result speed-slow';
                    showMessage(\`IP \${ip} speed test failed\`, 'error');
                }
            } catch (error) {
                speedElement.textContent = 'Error';
                speedElement.className = 'speed-result speed-slow';
                showMessage(\`IP \${ip} speed test error: \${error.message}\`, 'error');
            } finally {
                testBtn.disabled = false;
                testBtn.textContent = 'Test';
            }
        }

        async function startSpeedTest() {
            if (isTesting) {
                showMessage('Speed test in progress, please wait...', 'error');
                return;
            }
            
            const ipItems = document.querySelectorAll('.ip-item');
            if (ipItems.length === 0) {
                showMessage('No IP addresses available for speed testing', 'error');
                return;
            }
            
            const speedtestBtn = document.getElementById('speedtest-btn');
            const progressBar = document.getElementById('speed-test-progress');
            const progressBarInner = document.getElementById('speed-test-progress-bar');
            const statusElement = document.getElementById('speed-test-status');
            
            isTesting = true;
            speedtestBtn.disabled = true;
            speedtestBtn.textContent = 'Testing...';
            progressBar.style.display = 'block';
            
            const totalIPs = ipItems.length;
            currentTestIndex = 0;
            
            document.querySelectorAll('.speed-result').forEach(el => {
                el.textContent = 'Testing...';
                el.className = 'speed-result';
            });
            
            document.querySelectorAll('.test-btn').forEach(btn => {
                btn.disabled = true;
            });
            
            for (let i = 0; i < totalIPs; i++) {
                if (!isTesting) break;
                
                const ip = ipItems[i].dataset.ip;
                
                statusElement.textContent = \`Testing \${i+1}/\${totalIPs}: \${ip}\`;
                
                const startTime = performance.now();
                try {
                    const response = await fetch(\`/speedtest?ip=\${ip}\`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(\`HTTP \${response.status}\`);
                    }
                    
                    const data = await response.json();
                    const endTime = performance.now();
                    const latency = endTime - startTime;
                    
                    speedResults[ip] = {
                        latency: latency,
                        success: data.success,
                        time: data.time || 'Unknown'
                    };
                    
                    const speedElement = document.getElementById(\`speed-\${ip.replace(/\./g, '-')}\`);
                    if (data.success) {
                        const speedClass = latency < 200 ? 'speed-fast' : latency < 500 ? 'speed-medium' : 'speed-slow';
                        speedElement.textContent = \`\${Math.round(latency)}ms\`;
                        speedElement.className = \`speed-result \${speedClass}\`;
                    } else {
                        speedElement.textContent = 'Failed';
                        speedElement.className = 'speed-result speed-slow';
                    }
                } catch (error) {
                    const speedElement = document.getElementById(\`speed-\${ip.replace(/\./g, '-')}\`);
                    speedElement.textContent = 'Error';
                    speedElement.className = 'speed-result speed-slow';
                }
                
                currentTestIndex = i + 1;
                const progress = (currentTestIndex / totalIPs) * 100;
                progressBarInner.style.width = \`\${progress}%\`;
                
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            isTesting = false;
            speedtestBtn.disabled = false;
            speedtestBtn.textContent = '⚡ Start Speed Test';
            progressBar.style.display = 'none';
            document.querySelectorAll('.test-btn').forEach(btn => {
                btn.disabled = false;
            });
            
            sortBySpeed();
            
            showMessage(\`Speed test completed, tested \${currentTestIndex} IP addresses, sorted by latency\`);
        }

        function sortBySpeed() {
            const ipList = document.getElementById('ip-list');
            const ipItems = Array.from(ipList.querySelectorAll('.ip-item'));
            
            ipItems.sort((a, b) => {
                const ipA = a.dataset.ip;
                const ipB = b.dataset.ip;
                
                const resultA = speedResults[ipA];
                const resultB = speedResults[ipB];
                
                if (resultA && resultB) {
                    return resultA.latency - resultB.latency;
                } else if (resultA && !resultB) {
                    return -1;
                } else if (!resultA && resultB) {
                    return 1;
                } else {
                    return 0;
                }
            });
            
            ipItems.forEach(item => ipList.appendChild(item));
        }

        async function updateIPs() {
            const btn = document.getElementById('update-btn');
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            
            btn.disabled = true;
            loading.style.display = 'block';
            result.style.display = 'none';
            
            try {
                const response = await fetch('/update', { method: 'POST' });
                const data = await response.json();
                
                if (data.success) {
                    result.className = 'result success';
                    result.innerHTML = \`
                        <h3>✅ Update Successful!</h3>
                        <p>Duration: \${data.duration}</p>
                        <p>Collected \${data.totalIPs} unique IP addresses</p>
                        <p>Time: \${new Date(data.timestamp).toLocaleString()}</p>
                    \`;
                } else {
                    result.className = 'result error';
                    result.innerHTML = \`
                        <h3>❌ Update Failed</h3>
                        <p>\${data.error}</p>
                    \`;
                }
                result.style.display = 'block';
                
                setTimeout(refreshData, 1000);
                
            } catch (error) {
                result.className = 'result error';
                result.innerHTML = \`
                    <h3>❌ Request Failed</h3>
                    <p>\${error.message}</p>
                \`;
                result.style.display = 'block';
            } finally {
                btn.disabled = false;
                loading.style.display = 'none';
            }
        }
        
        async function refreshData() {
            try {
                const response = await fetch('/raw');
                const data = await response.json();
                
                document.getElementById('ip-count').textContent = data.count || 0;
                document.getElementById('last-updated').textContent = data.lastUpdated ? 'Updated' : 'Not Updated';
                document.getElementById('last-time').textContent = data.lastUpdated ? 
                    new Date(data.lastUpdated).toLocaleTimeString() : 'Never Updated';
                
                const ipList = document.getElementById('ip-list');
                if (data.ips && data.ips.length > 0) {
                    ipList.innerHTML = data.ips.map(ip => \`
                        <div class="ip-item" data-ip="\${ip}">
                            <div class="ip-info">
                                <span class="ip-address">\${ip}</span>
                                <span class="speed-result" id="speed-\${ip.replace(/\./g, '-')}">\${speedResults[ip] ? Math.round(speedResults[ip].latency) + 'ms' : '-'}</span>
                            </div>
                            <div class="action-buttons">
                                <button class="small-btn" onclick="testSingleIP('\${ip}')" id="test-\${ip.replace(/\./g, '-')}">Test</button>
                                <button class="small-btn" onclick="copyIP('\${ip}')">Copy</button>
                            </div>
                        </div>
                    \`).join('');
                    
                    Object.keys(speedResults).forEach(ip => {
                        const result = speedResults[ip];
                        const speedElement = document.getElementById(\`speed-\${ip.replace(/\./g, '-')}\`);
                        if (speedElement && result) {
                            const speedClass = result.latency < 200 ? 'speed-fast' : result.latency < 500 ? 'speed-medium' : 'speed-slow';
                            speedElement.textContent = \`\${Math.round(result.latency)}ms\`;
                            speedElement.className = \`speed-result \${speedClass}\`;
                        }
                    });
                } else {
                    ipList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No IP address data available, please click update button to get</p>';
                }
                
                const sources = document.getElementById('sources');
                if (data.sources && data.sources.length > 0) {
                    sources.innerHTML = data.sources.map(source => \`
                        <div class="source \${source.status === 'success' ? '' : 'error'}">
                            <strong>\${source.name}</strong>: 
                            \${source.status === 'success' ? 
                              \`Successfully obtained \${source.count} IPs\` : 
                              \`Failed: \${source.error}\`
                            }
                        </div>
                    \`).join('');
                }
            } catch (error) {
                console.error('Failed to refresh data:', error);
            }
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            refreshData();
        });
    </script>
</body>
</html>`;
  
  return new Response(html, {
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
    }
  });
}

// Other functions remain the same...
// Handle ITDog data retrieval
async function handleItdogData(env) {
  const data = await getStoredIPs(env);
  return jsonResponse({
    ips: data.ips || [],
    count: data.count || 0
  });
}

// Handle speed test requests
async function handleSpeedTest(request, env) {
  const url = new URL(request.url);
  const ip = url.searchParams.get('ip');
  
  if (!ip) {
    return jsonResponse({ error: 'IP parameter is required' }, 400);
  }
  
  try {
    // Use Cloudflare's speed test domain
    const testUrl = `https://speed.cloudflare.com/__down?bytes=1000`;
    
    // Set custom Host header to point to specific IP
    const response = await fetch(testUrl, {
      headers: {
        'Host': 'speed.cloudflare.com'
      },
      cf: {
        // Use resolveOverride to specify IP
        resolveOverride: ip
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Read response to ensure connection completes
    await response.text();
    
    return jsonResponse({
      success: true,
      ip: ip,
      time: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`Speed test failed for IP ${ip}:`, error);
    return jsonResponse({
      success: false,
      ip: ip,
      error: error.message,
      time: new Date().toISOString()
    }, 500);
  }
}

// Handle manual update
async function handleUpdate(env) {
  try {
    // Check KV binding again
    if (!env.IP_STORAGE) {
      throw new Error('KV namespace IP_STORAGE is not bound. Please check your Worker settings.');
    }

    const startTime = Date.now();
    const { uniqueIPs, results } = await updateAllIPs(env);
    const duration = Date.now() - startTime;

    // Store to KV
    await env.IP_STORAGE.put('cloudflare_ips', JSON.stringify({
      ips: uniqueIPs,
      lastUpdated: new Date().toISOString(),
      count: uniqueIPs.length,
      sources: results
    }));

    return jsonResponse({
      success: true,
      message: 'IPs collected successfully',
      duration: `${duration}ms`,
      totalIPs: uniqueIPs.length,
      timestamp: new Date().toISOString(),
      results: results
    });
  } catch (error) {
    console.error('Update error:', error);
    return jsonResponse({
      success: false,
      error: error.message
    }, 500);
  }
}

// Handle getting IP list - plain text format
async function handleGetIPs(env) {
  const data = await getStoredIPs(env);
  return new Response(data.ips.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'inline; filename="cloudflare_ips.txt"',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// Handle getting raw data
async function handleRawIPs(env) {
  const data = await getStoredIPs(env);
  return jsonResponse(data);
}

// Main IP collection logic - removed specified websites
async function updateAllIPs(env) {
  // Updated URL list - removed specified websites
  const urls = [
    'https://ip.164746.xyz', 
    'https://ip.haogege.xyz/',
    'https://stock.hostmonit.com/CloudFlareYes', 
    'https://api.uouin.com/cloudflare.html',
    'https://addressesapi.090227.xyz/CloudFlareYes',
    'https://addressesapi.090227.xyz/ip.164746.xyz',
    // Removed the following two websites
    // 'https://www.wetest.vip/page/edgeone/address_v4.html',
    // 'https://www.wetest.vip/page/cloudfront/address_v4.html',
    'https://www.wetest.vip/page/cloudflare/address_v4.html'
  ];

  const uniqueIPs = new Set();
  const results = [];

  // Use the same regular expression as the Python script
  const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/gi;

  // Process URLs in batches, control concurrency
  const BATCH_SIZE = 3;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(url => fetchURLWithTimeout(url, 8000));
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      const url = batch[j];
      const sourceName = getSourceName(url);
      
      if (result.status === 'fulfilled') {
        const content = result.value;
        const ipMatches = content.match(ipPattern) || [];
        
        // Add to set (automatically deduplicates)
        ipMatches.forEach(ip => {
          if (isValidIPv4(ip)) {
            uniqueIPs.add(ip);
          }
        });
        
        results.push({
          name: sourceName,
          status: 'success',
          count: ipMatches.length,
          error: null
        });
        
        console.log(`Successfully collected ${ipMatches.length} IPs from ${sourceName}`);
      } else {
        console.error(`Failed to fetch ${sourceName}:`, result.reason);
        results.push({
          name: sourceName,
          status: 'error',
          count: 0,
          error: result.reason.message
        });
      }
    }
    
    // Delay between batches
    if (i + BATCH_SIZE < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Sort IP addresses in numerical order (same as Python script)
  const sortedIPs = Array.from(uniqueIPs).sort((a, b) => {
    const aParts = a.split('.').map(part => parseInt(part, 10));
    const bParts = b.split('.').map(part => parseInt(part, 10));
    
    for (let i = 0; i < 4; i++) {
      if (aParts[i] !== bParts[i]) {
        return aParts[i] - bParts[i];
      }
    }
    return 0;
  });

  return {
    uniqueIPs: sortedIPs,
    results: results
  };
}

// Get friendly name for URL
function getSourceName(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
  } catch (e) {
    return url;
  }
}

// Fetch with timeout
async function fetchURLWithTimeout(url, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cloudflare-IP-Collector/1.0)',
        'Accept': 'text/html,application/json,text/plain,*/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

// Get stored IPs from KV
async function getStoredIPs(env) {
  try {
    if (!env.IP_STORAGE) {
      console.error('KV namespace IP_STORAGE is not bound');
      return getDefaultData();
    }
    
    const data = await env.IP_STORAGE.get('cloudflare_ips');
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading from KV:', error);
  }
  
  return getDefaultData();
}

// Default data
function getDefaultData() {
  return {
    ips: [],
    lastUpdated: null,
    count: 0,
    sources: []
  };
}

// IPv4 address validation
function isValidIPv4(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) return false;
    // Exclude private IP ranges
    if (part.startsWith('0') && part.length > 1) return false;
  }
  
  // Exclude private addresses
  if (ip.startsWith('10.') || 
      ip.startsWith('192.168.') ||
      (ip.startsWith('172.') && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31) ||
      ip.startsWith('127.') ||
      ip.startsWith('169.254.') ||
      ip === '255.255.255.255') {
    return false;
  }
  
  return true;
}

// Utility functions
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function handleCORS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
