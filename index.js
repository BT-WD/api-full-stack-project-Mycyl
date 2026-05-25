const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Serve Static Files =====
app.use(express.static(__dirname));

// ===== Shuffle Function =====
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

// ===== Decode API Text =====
function decodeItem(item) {
    return decodeURIComponent(item);
}

// ===== Trivia API Route =====
app.get('/trivia', async (req, res) => {
    try {
        const {
            amount = 10,
            category,
            difficulty,
            type = 'multiple'
        } = req.query;

        const params = new URLSearchParams();

        params.append('amount', amount);

        if (category) {
            params.append('category', category);
        }

        if (difficulty) {
            params.append('difficulty', difficulty);
        }

        params.append('type', type);

        // Proper encoding
        params.append('encode', 'url3986');

        const url = `https://opentdb.com/api.php?${params.toString()}`;

        console.log(`Fetching trivia from: ${url}`);

        const response = await axios.get(url);

        const data = response.data;

        if (data.response_code !== 0) {
            return res.status(502).json({
                error: 'No trivia questions found for selected options.'
            });
        }

        const questions = data.results.map(q => {
            const decodedCorrect = decodeItem(q.correct_answer);

            const decodedIncorrect = q.incorrect_answers.map(answer =>
                decodeItem(answer)
            );

            return {
                category: decodeItem(q.category),
                type: q.type,
                difficulty: q.difficulty,
                question: decodeItem(q.question),
                correct_answer: decodedCorrect,
                incorrect_answers: decodedIncorrect,
                all_answers: shuffle([
                    decodedCorrect,
                    ...decodedIncorrect
                ])
            };
        });

        res.json({ questions });

    } catch (error) {
        console.error('SERVER ERROR:', error.message);

        res.status(500).json({
            error: 'Failed to fetch trivia questions.'
        });
    }
});

// ===== Start Server =====
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});