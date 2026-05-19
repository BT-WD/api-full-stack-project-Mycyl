
// ...existing code...
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// simple Fisher-Yates shuffle
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// decode items when using encode=url3986
function decodeItem(item) {
    return decodeURIComponent(item);
}

// GET /trivia?amount=10&category=18&difficulty=easy&type=multiple
app.get('/trivia', async (req, res) => {
    try {
        const { amount = 10, category, difficulty, type } = req.query;
        const params = new URLSearchParams();
        params.append('amount', amount);
        if (category) params.append('category', category);
        if (difficulty) params.append('difficulty', difficulty);
        if (type) params.append('type', type);

        // ask API to return url-encoded strings so we can decode reliably
        params.append('encode', 'url3986');

        const url = `https://opentdb.com/api.php?${params.toString()}`;
        const response = await axios.get(url);
        const data = response.data;

        if (data.response_code !== 0) {
            return res.status(502).json({ error: 'OpenTDB returned no results or an error', code: data.response_code });
        }

        const questions = data.results.map(q => {
            const decodedQuestion = decodeItem(q.question);
            const decodedCorrect = decodeItem(q.correct_answer);
            const decodedIncorrect = q.incorrect_answers.map(a => decodeItem(a));
            const all_answers = shuffle([decodedCorrect, ...decodedIncorrect].slice());
            return {
                category: decodeItem(q.category),
                type: q.type,
                difficulty: q.difficulty,
                question: decodedQuestion,
                correct_answer: decodedCorrect,
                incorrect_answers: decodedIncorrect,
                all_answers
            };
        });

        res.json({ questions });
    } catch (err) {
        console.error(err?.message || err);
        res.status(500).json({ error: 'Failed to fetch trivia' });
    }
});

app.listen(PORT, () => {
    console.log(`Trivia API proxy listening on http://localhost:${PORT}`);
});
// ...existing code...