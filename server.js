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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key is missing on the server' });
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
        // Fetch call to Gemini 2.5 Flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error! Status: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;

        // Send the AI response back to the frontend
        res.json({ lessonPlan: generatedText });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Failed to generate lesson plan due to a server error.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running smoothly on http://localhost:${PORT}`);
});
