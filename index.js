const express = require('express');
const cors = require('cors');
const { search } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Scraping MHS API is running',
        version: '1.0.0',
        endpoints: {
            search: 'POST /api/search - Search for students, lecturers, or alumni',
            health: 'GET / - Health check'
        }
    });
});

// Search endpoint
app.post('/api/search', async (req, res) => {
    try {
        const { keyword, type } = req.body;

        // Validation
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: 'Keyword is required'
            });
        }

        if (!type || ![1, 2, 3, '1', '2', '3'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type is required and must be 1 (mahasiswa), 2 (dosen), or 3 (alumni)'
            });
        }

        console.log(`[API] Search request - keyword: "${keyword}", type: ${type}`);

        const results = await search(keyword, parseInt(type));

        // Check if the results contain an error
        if (results && results.error) {
            return res.status(500).json({
                success: false,
                message: 'Search failed',
                error: results.error
            });
        }

        res.json({
            success: true,
            message: 'Search completed successfully',
            data: {
                keyword,
                type: parseInt(type),
                typeDescription: parseInt(type) === 1 ? 'mahasiswa' : parseInt(type) === 2 ? 'dosen' : 'alumni',
                results: results || [],
                count: Array.isArray(results) ? results.length : 0
            }
        });
    } catch (error) {
        console.error('[API] Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed due to server error',
            error: error.message
        });
    }
});

// GET endpoint for quick searches
app.get('/api/search/:keyword/:type', async (req, res) => {
    try {
        const { keyword, type } = req.params;

        // Validation
        if (!type || ![1, 2, 3, '1', '2', '3'].includes(parseInt(type))) {
            return res.status(400).json({
                success: false,
                message: 'Type must be 1 (mahasiswa), 2 (dosen), or 3 (alumni)'
            });
        }

        console.log(`[API] GET Search request - keyword: "${keyword}", type: ${type}`);

        const results = await search(keyword, parseInt(type));

        if (results && results.error) {
            return res.status(500).json({
                success: false,
                message: 'Search failed',
                error: results.error
            });
        }

        res.json({
            success: true,
            message: 'Search completed successfully',
            data: {
                keyword,
                type: parseInt(type),
                typeDescription: parseInt(type) === 1 ? 'mahasiswa' : parseInt(type) === 2 ? 'dosen' : 'alumni',
                results: results || [],
                count: Array.isArray(results) ? results.length : 0
            }
        });

    } catch (error) {
        console.error('[API] GET Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed due to server error',
            error: error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`[SERVER] Server is running on http://localhost:${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[SERVER] API Documentation:`);
    console.log(`  POST /api/search - Search with JSON body {keyword, type}`);
    console.log(`  GET  /api/search/:keyword/:type - Quick search via URL`);
    console.log(`  GET  / - Health check and API info`);
});
