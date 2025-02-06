// Serverless function to proxy API requests
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Forward the request to the actual API
        const response = await fetch('https://api.brilliantplus.app/api/Consultants/CreateConsultant', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.API_ACCESS_TOKEN}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        // Get the response data
        const data = await response.json();

        // Forward the API response
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({
            error: 'Failed to proxy request',
            details: error.message
        });
    }
} 