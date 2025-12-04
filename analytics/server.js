const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const LearnAIDAnalytics = require('./extractUsageData');
const PilotStudyChartGenerator = require('./generateCharts');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/charts', express.static('./pilot_study_charts'));
app.use('/data', express.static('./pilot_study_data'));

// Analytics API endpoints
app.get('/api/analytics/summary', async (req, res) => {
    try {
        const summaryPath = './pilot_study_data/summary_statistics.json';
        if (await fs.pathExists(summaryPath)) {
            const summary = await fs.readJSON(summaryPath);
            res.json(summary);
        } else {
            res.status(404).json({ error: 'Summary data not found. Run extraction first.' });
        }
    } catch (error) {
        console.error('Error reading summary:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analytics/charts-data', async (req, res) => {
    try {
        const chartsDataPath = '../src/data/analytics';
        const files = ['engagement_data.json', 'performance_data.json', 'workload_data.json', 'dashboard_data.json'];
        
        const chartsData = {};
        for (const file of files) {
            const filePath = path.join(chartsDataPath, file);
            if (await fs.pathExists(filePath)) {
                const key = file.replace('_data.json', '').replace('.json', '');
                chartsData[key] = await fs.readJSON(filePath);
            }
        }
        
        res.json(chartsData);
    } catch (error) {
        console.error('Error reading charts data:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/analytics/extract', async (req, res) => {
    try {
        console.log('🚀 Starting data extraction via API...');
        
        const analytics = new LearnAIDAnalytics();
        const result = await analytics.runFullExtraction();
        
        res.json({
            success: true,
            message: 'Data extraction completed successfully',
            summary: result.summaryStats
        });
    } catch (error) {
        console.error('Error in data extraction:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/analytics/generate-charts', async (req, res) => {
    try {
        console.log('📊 Starting chart generation via API...');
        
        const chartGenerator = new PilotStudyChartGenerator();
        await chartGenerator.generateAllCharts();
        
        res.json({
            success: true,
            message: 'Charts generated successfully',
            chartsPath: '/charts',
            dataPath: '/data'
        });
    } catch (error) {
        console.error('Error in chart generation:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/analytics/full-analysis', async (req, res) => {
    try {
        console.log('🔄 Starting full pilot study analysis...');
        
        // Step 1: Extract data
        console.log('Step 1: Extracting usage data...');
        const analytics = new LearnAIDAnalytics();
        const extractionResult = await analytics.runFullExtraction();
        
        // Step 2: Generate charts
        console.log('Step 2: Generating charts...');
        const chartGenerator = new PilotStudyChartGenerator();
        await chartGenerator.generateAllCharts();
        
        res.json({
            success: true,
            message: 'Full pilot study analysis completed successfully',
            summary: extractionResult.summaryStats,
            chartsGenerated: [
                'figure1_engagement_comparison.png',
                'figure2_user_adoption.png',
                'figure3_performance_improvement.png',
                'figure4_workload_reduction.png',
                'usage_statistics.png'
            ],
            reactDataFiles: [
                'engagement_data.json',
                'performance_data.json', 
                'workload_data.json',
                'dashboard_data.json'
            ]
        });
    } catch (error) {
        console.error('Error in full analysis:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/analytics/status', (req, res) => {
    res.json({
        status: 'online',
        service: 'LearnAID Analytics Server',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Serve chart images
app.get('/api/charts/:chartName', async (req, res) => {
    try {
        const chartName = req.params.chartName;
        const chartPath = path.join('./pilot_study_charts', chartName);
        
        if (await fs.pathExists(chartPath)) {
            res.sendFile(path.resolve(chartPath));
        } else {
            res.status(404).json({ error: 'Chart not found' });
        }
    } catch (error) {
        console.error('Error serving chart:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ████████████████████████████████████████████████████████
    █                                                      █
    █         📊 LearnAID Analytics Server Started         █
    █                                                      █
    █         Port: ${PORT}                                     █
    █         Environment: ${process.env.NODE_ENV || 'development'}               █
    █                                                      █
    █         API Endpoints:                               █
    █         • GET  /api/analytics/summary                █
    █         • GET  /api/analytics/charts-data            █
    █         • POST /api/analytics/extract                █
    █         • POST /api/analytics/generate-charts        █
    █         • POST /api/analytics/full-analysis          █
    █         • GET  /api/charts/:chartName                █
    █                                                      █
    █         Static Serving:                              █
    █         • /charts - Chart images                     █
    █         • /data   - CSV data files                   █
    █                                                      █
    ████████████████████████████████████████████████████████
    `);
    
    console.log('\n🚀 Ready to process pilot study analytics!');
    console.log('\n📋 Quick Start Commands:');
    console.log('   • POST /api/analytics/full-analysis - Complete analysis');
    console.log('   • GET  /api/analytics/summary - View statistics');
    console.log('   • GET  /charts/figure1_engagement_comparison.png - View charts');
});

module.exports = app;