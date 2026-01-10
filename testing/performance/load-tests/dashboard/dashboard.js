/**
 * Dashboard JavaScript untuk K6 Load Testing Metrics
 * Menangani visualisasi real-time dan pengolahan data metrik
 */

// Global variables untuk chart instances dan data
let charts = {};
let isMonitoring = false;
let monitoringInterval;
let metricsData = {
    timestamps: [],
    responseTime: [],
    throughput: [],
    apiErrorRate: [],
    apiSuccessRate: [],
    totalNetworkLatency: [],
    savReadTime: [],
    savWriteTime: [],
    memoryUsage: [],
    cpuUsage: [],
    totalDataTransfer: [],
    serverProcessingTime: [],
    requestQueueTime: [],
    tcpConnectionTime: [],
    dnsResolutionTime: [],
    tlsHandshakeTime: [],
    clientErrors: [],
    serverErrors: [],
    timeoutErrors: [],
    concurrentUsers: []
};

// Konfigurasi chart default
const chartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                usePointStyle: true,
                padding: 15
            }
        },
        tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#3498db',
            borderWidth: 1
        }
    },
    scales: {
        x: {
            type: 'time',
            time: {
                unit: 'second',
                displayFormats: {
                    second: 'HH:mm:ss'
                }
            },
            grid: {
                color: 'rgba(0, 0, 0, 0.1)'
            }
        },
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(0, 0, 0, 0.1)'
            }
        }
    },
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
    }
};

/**
 * Inisialisasi semua chart saat halaman dimuat
 */
function initializeCharts() {
    // Response Time Chart
    charts.responseTime = new Chart(document.getElementById('responseTimeChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Response Time (ms)',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'P95 Response Time',
                data: [],
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: false,
                borderDash: [5, 5]
            }]
        },
        options: {
            ...chartConfig,
            scales: {
                ...chartConfig.scales,
                y: {
                    ...chartConfig.scales.y,
                    title: {
                        display: true,
                        text: 'Time (ms)'
                    }
                }
            }
        }
    });

    // Throughput Chart
    charts.throughput = new Chart(document.getElementById('throughputChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Requests/sec',
                data: [],
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Virtual Users',
                data: [],
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                fill: false,
                yAxisID: 'y1'
            }]
        },
        options: {
            ...chartConfig,
            scales: {
                ...chartConfig.scales,
                y: {
                    ...chartConfig.scales.y,
                    title: {
                        display: true,
                        text: 'Requests/sec'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Virtual Users'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });

    // Error Chart
    charts.error = new Chart(document.getElementById('errorChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Error Rate (%)',
                data: [],
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: true
            }, {
                label: 'Success Rate (%)',
                data: [],
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                fill: false
            }]
        },
        options: {
            ...chartConfig,
            scales: {
                ...chartConfig.scales,
                y: {
                    ...chartConfig.scales.y,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    }
                }
            }
        }
    });

    // Network Chart
    charts.network = new Chart(document.getElementById('networkChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'DNS Lookup (ms)',
                data: [],
                borderColor: '#9b59b6',
                backgroundColor: 'rgba(155, 89, 182, 0.1)',
                fill: false
            }, {
                label: 'Connection (ms)',
                data: [],
                borderColor: '#34495e',
                backgroundColor: 'rgba(52, 73, 94, 0.1)',
                fill: false
            }, {
                label: 'TLS Handshake (ms)',
                data: [],
                borderColor: '#e67e22',
                backgroundColor: 'rgba(230, 126, 34, 0.1)',
                fill: false
            }]
        },
        options: {
            ...chartConfig,
            scales: {
                ...chartConfig.scales,
                y: {
                    ...chartConfig.scales.y,
                    title: {
                        display: true,
                        text: 'Time (ms)'
                    }
                }
            }
        }
    });

    // SAV Operations Chart
    charts.sav = new Chart(document.getElementById('savChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'SAV Read Time (ms)',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: false
            }, {
                label: 'SAV Write Time (ms)',
                data: [],
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: false
            }]
        },
        options: {
            ...chartConfig,
            scales: {
                ...chartConfig.scales,
                y: {
                    ...chartConfig.scales.y,
                    title: {
                        display: true,
                        text: 'Time (ms)'
                    }
                }
            }
        }
    });

    // Resource Usage Chart
    charts.resource = new Chart(document.getElementById('resourceChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Memory Usage (MB)',
                data: [],
                borderColor: '#9b59b6',
                backgroundColor: 'rgba(155, 89, 182, 0.1)',
                fill: true,
                yAxisID: 'y'
            }, {
                label: 'CPU Usage (%)',
                data: [],
                borderColor: '#e67e22',
                backgroundColor: 'rgba(230, 126, 34, 0.1)',
                fill: false,
                yAxisID: 'y1'
            }]
        },
        options: {
            ...chartConfig,
            scales: {
                ...chartConfig.scales,
                y: {
                    ...chartConfig.scales.y,
                    title: {
                        display: true,
                        text: 'Memory (MB)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    max: 100,
                    title: {
                        display: true,
                        text: 'CPU (%)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });

    // Data Transfer Chart
    charts.dataTransfer = new Chart(document.getElementById('dataTransferChart'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Data Transfer (KB)',
                data: [],
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
                borderColor: '#3498db',
                borderWidth: 1
            }]
        },
        options: {
            ...chartConfig,
            scales: {
                ...chartConfig.scales,
                y: {
                    ...chartConfig.scales.y,
                    title: {
                        display: true,
                        text: 'Data (KB)'
                    }
                }
            }
        }
    });

    // Processing Time Chart
    charts.processing = new Chart(document.getElementById('processingChart'), {
        type: 'area',
        data: {
            labels: [],
            datasets: [{
                label: 'Queue Time (ms)',
                data: [],
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.3)',
                fill: true
            }, {
                label: 'Processing Time (ms)',
                data: [],
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.3)',
                fill: true
            }]
        },
        options: {
            ...chartConfig,
            scales: {
                ...chartConfig.scales,
                y: {
                    ...chartConfig.scales.y,
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Time (ms)'
                    }
                }
            }
        }
    });
}

/**
 * Generate demo data untuk testing dashboard
 */
function generateDemoData() {
    const now = new Date();
    const timestamp = now.getTime();
    
    // Simulasi data realistis dengan metrik yang diperbaiki
    const baseResponseTime = 800 + Math.random() * 400;
    const throughput = 10 + Math.random() * 15;
    const apiErrorRate = Math.random() * 5;
    const apiSuccessRate = 100 - apiErrorRate;
    const memoryUsage = 200 + Math.random() * 300;
    const cpuUsage = 20 + Math.random() * 60;
    
    return {
        timestamp: timestamp,
        http_req_duration: baseResponseTime,
        http_req_duration_p95: baseResponseTime * 1.5,
        requests_per_second: throughput,
        api_error_rate_percent: apiErrorRate,
        api_success_rate_percent: apiSuccessRate,
        sav_read_time_ms: baseResponseTime * 1.2,
        sav_write_time_ms: baseResponseTime * 1.8,
        server_memory_usage_mb: memoryUsage,
        server_cpu_usage_percent: cpuUsage,
        tcp_connection_time_ms: 50 + Math.random() * 100,
        dns_resolution_time_ms: 10 + Math.random() * 40,
        tls_handshake_time_ms: 30 + Math.random() * 70,
        total_data_transfer_kb: 50 + Math.random() * 200,
        server_processing_time_ms: baseResponseTime * 0.6,
        request_queue_time_ms: 20 + Math.random() * 50,
        total_network_latency_ms: 100 + Math.random() * 200,
        concurrent_users: Math.floor(5 + Math.random() * 20),
        client_errors: Math.floor(Math.random() * 3),
        server_errors: Math.floor(Math.random() * 2),
        timeout_errors: Math.floor(Math.random() * 1)
    };
}

/**
 * Update semua chart dengan data baru
 */
function updateCharts(data) {
    const timestamp = new Date(data.timestamp);
    
    // Batasi jumlah data points (maksimal 50 untuk performa)
    const maxDataPoints = 50;
    
    // Update Response Time Chart
    charts.responseTime.data.labels.push(timestamp);
    charts.responseTime.data.datasets[0].data.push(data.http_req_duration);
    charts.responseTime.data.datasets[1].data.push(data.http_req_duration_p95);
    
    // Update Throughput Chart
    charts.throughput.data.labels.push(timestamp);
    charts.throughput.data.datasets[0].data.push(data.requests_per_second);
    charts.throughput.data.datasets[1].data.push(data.concurrent_users);
    
    // Update Error Chart
    charts.error.data.labels.push(timestamp);
    charts.error.data.datasets[0].data.push(data.api_error_rate_percent);
    charts.error.data.datasets[1].data.push(data.api_success_rate_percent);
    
    // Update Network Chart
    charts.network.data.labels.push(timestamp);
    charts.network.data.datasets[0].data.push(data.dns_resolution_time_ms);
    charts.network.data.datasets[1].data.push(data.tcp_connection_time_ms);
    charts.network.data.datasets[2].data.push(data.tls_handshake_time_ms);
    
    // Update SAV Chart
    charts.sav.data.labels.push(timestamp);
    charts.sav.data.datasets[0].data.push(data.sav_read_time_ms);
    charts.sav.data.datasets[1].data.push(data.sav_write_time_ms);
    
    // Update Resource Chart
    charts.resource.data.labels.push(timestamp);
    charts.resource.data.datasets[0].data.push(data.server_memory_usage_mb);
    charts.resource.data.datasets[1].data.push(data.server_cpu_usage_percent);
    
    // Update Data Transfer Chart
    charts.dataTransfer.data.labels.push(timestamp);
    charts.dataTransfer.data.datasets[0].data.push(data.total_data_transfer_kb);
    
    // Update Processing Chart
    charts.processing.data.labels.push(timestamp);
    charts.processing.data.datasets[0].data.push(data.request_queue_time_ms);
    charts.processing.data.datasets[1].data.push(data.server_processing_time_ms);
    
    // Hapus data lama jika melebihi batas
    Object.values(charts).forEach(chart => {
        if (chart.data.labels.length > maxDataPoints) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });
        }
        chart.update('none'); // Update tanpa animasi untuk performa
    });
    
    // Update summary cards
    updateSummaryCards(data);
}

/**
 * Update summary cards dengan data terbaru
 */
function updateSummaryCards(data) {
    document.getElementById('totalRequests').textContent = 
        Math.floor(data.requests_per_second * 60); // Estimasi total dalam 1 menit
    document.getElementById('successRate').textContent = 
        data.api_success_rate_percent.toFixed(1) + '%';
    document.getElementById('avgResponseTime').textContent = 
        Math.round(data.http_req_duration);
    document.getElementById('currentVUs').textContent = 
        data.concurrent_users;
    document.getElementById('totalErrors').textContent = 
        (data.client_errors + data.server_errors + data.timeout_errors);
    document.getElementById('throughput').textContent = 
        data.requests_per_second.toFixed(1);
    
    // Update detail stats
    document.getElementById('p95ResponseTime').textContent = 
        Math.round(data.http_req_duration_p95) + 'ms';
    document.getElementById('p99ResponseTime').textContent = 
        Math.round(data.http_req_duration_p95 * 1.2) + 'ms';
    document.getElementById('avgResponseTimeDetail').textContent = 
        Math.round(data.http_req_duration) + 'ms';
    
    document.getElementById('peakThroughput').textContent = 
        Math.round(data.requests_per_second * 1.5) + ' req/s';
    document.getElementById('currentThroughput').textContent = 
        data.requests_per_second.toFixed(1) + ' req/s';
    
    document.getElementById('clientErrors').textContent = data.client_errors;
    document.getElementById('serverErrors').textContent = data.server_errors;
    document.getElementById('timeoutErrors').textContent = data.timeout_errors;
    
    document.getElementById('dnsTime').textContent = 
        Math.round(data.dns_resolution_time_ms) + 'ms';
    document.getElementById('connectTime').textContent = 
        Math.round(data.tcp_connection_time_ms) + 'ms';
    document.getElementById('tlsTime').textContent = 
        Math.round(data.tls_handshake_time_ms) + 'ms';
    
    document.getElementById('savReadAvg').textContent = 
        Math.round(data.sav_read_time_ms) + 'ms';
    document.getElementById('savWriteAvg').textContent = 
        Math.round(data.sav_write_time_ms) + 'ms';
    
    document.getElementById('memoryUsage').textContent = 
        Math.round(data.server_memory_usage_mb) + 'MB';
    document.getElementById('cpuUsage').textContent = 
        Math.round(data.server_cpu_usage_percent) + '%';
    
    document.getElementById('uploadSpeed').textContent = 
        (data.total_data_transfer_kb * 0.3).toFixed(1) + ' KB/s';
    document.getElementById('downloadSpeed').textContent = 
        (data.total_data_transfer_kb * 0.7).toFixed(1) + ' KB/s';
    
    document.getElementById('queueTime').textContent = 
        Math.round(data.request_queue_time_ms) + 'ms';
    document.getElementById('processTime').textContent = 
        Math.round(data.server_processing_time_ms) + 'ms';
}

/**
 * Toggle monitoring on/off
 */
function toggleMonitoring() {
    if (isMonitoring) {
        stopMonitoring();
    } else {
        startMonitoring();
    }
}

/**
 * Mulai monitoring
 */
function startMonitoring() {
    isMonitoring = true;
    const refreshRate = parseInt(document.getElementById('refreshRate').value) * 1000;
    
    // Update UI
    document.getElementById('status').innerHTML = 
        '<span class="status-indicator status-running"></span>Status: Running';
    
    // Mulai interval untuk update data
    monitoringInterval = setInterval(() => {
        const dataSource = document.getElementById('dataSource').value;
        
        if (dataSource === 'demo') {
            const demoData = generateDemoData();
            updateCharts(demoData);
        } else if (dataSource === 'realtime') {
            // TODO: Implementasi WebSocket untuk data real-time
            console.log('Real-time monitoring akan diimplementasi dengan WebSocket');
            // Sementara gunakan demo data
            const demoData = generateDemoData();
            updateCharts(demoData);
        } else if (dataSource === 'file') {
            // TODO: Implementasi pembacaan file JSON
            console.log('File monitoring akan diimplementasi');
        }
    }, refreshRate);
}

/**
 * Stop monitoring
 */
function stopMonitoring() {
    isMonitoring = false;
    
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
    }
    
    // Update UI
    document.getElementById('status').innerHTML = 
        '<span class="status-indicator status-stopped"></span>Status: Stopped';
}

/**
 * Export data ke file JSON
 */
function exportData() {
    const exportData = {
        timestamp: new Date().toISOString(),
        charts: {},
        summary: {}
    };
    
    // Collect data dari semua chart
    Object.keys(charts).forEach(chartName => {
        const chart = charts[chartName];
        exportData.charts[chartName] = {
            labels: chart.data.labels,
            datasets: chart.data.datasets.map(dataset => ({
                label: dataset.label,
                data: dataset.data
            }))
        };
    });
    
    // Create dan download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `k6-metrics-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Inisialisasi dashboard saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    
    // Set default values
    document.getElementById('dataSource').value = 'demo';
    document.getElementById('refreshRate').value = '2';
    
    console.log('🚀 Statify K6 Dashboard initialized successfully!');
    console.log('📊 Gunakan kontrol di atas untuk memulai monitoring');
});