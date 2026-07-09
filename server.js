import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows your frontend to talk to your backend
app.use(express.json()); // Allows your server to parse JSON data sent by the frontend

// The route your frontend will send a POST request to
app.post('/api/generate-lesson', async (req, res) => {
    const { grade, term, subject, topic } = req.body;

    if (!grade || !term || !subject || !topic) {
        return res.status(400).json({ error: 'All fields are required' });
    }

   // Change this line if it's looking for GEMINI_API_KEY
const apiKey = process.env.GROQ_API_KEY; 

if (!apiKey) {
    // This is what is triggering your red error badge on Vercel!
    return res.status(500).json({ error: "API key is missing on the server" }); 
}
    // Build the AI instruction prompt
    const prompt = `
        You are an expert educator. Create a comprehensive, highly creative, and detailed lesson plan and teaching notes based on these details:
        - Grade/Class: ${grade}
        - Term/Semester: ${term}
        - Subject: ${subject}
        - Topic: ${topic}
        
        Structure the response beautifully using Markdown. Include: Lesson Objectives, Materials Needed, an engaging Introduction/Hook, a Step-by-Step Lesson Outline, and short Quiz Questions.
    `;

try {
        // Blazing-fast API call to Groq Cloud using an optimized flagship open model
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b', // Fast, highly efficient flagship model
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Groq API Error Details:', data);
            return res.status(response.status).json({ 
                error: data.error?.message || `Groq API error status: ${response.status}` 
            });
        }

        // Groq parses output using standard chat completions structures
        const generatedText = data.choices[0].message.content;
        res.json({ lessonPlan: generatedText });

    } catch (error) {
        console.error('Server Network Error:', error);
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running smoothly on http://localhost:${PORT}`);
});
