import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Initialize dotenv
dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 8000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// API proxy endpoint
app.post('/api/create-consultant', async (req, res) => {
    try {
        console.log('Received request:', req.body);
        
        const response = await fetch('https://api.brilliantplus.app/api/Consultants/CreateConsultant', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.API_ACCESS_TOKEN}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        console.log('API Response:', data);
        
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Failed to proxy request',
            details: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 