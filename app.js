document.addEventListener('DOMContentLoaded', () => {

    // ===== Pages =====
    const landingPage = document.getElementById('landing-page');
    const quizPage = document.getElementById('quiz-page');
    const resultsPage = document.getElementById('results-page');

    // ===== Buttons =====
    const startBtn = document.getElementById('start-btn');
    const nextBtn = document.getElementById('next-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const homeBtn = document.getElementById('home-btn');

    // ===== Inputs =====
    const playerNameInput = document.getElementById('player-name');
    const difficultySelect = document.getElementById('difficulty');
    const categorySelect = document.getElementById('category');
    const amountInput = document.getElementById('amount');

    // ===== Quiz =====
    const questionText = document.getElementById('question-text');
    const questionCategory = document.getElementById('question-category');
    const questionDifficulty = document.getElementById('question-difficulty');
    const answersContainer = document.getElementById('answers-container');

    // ===== Quiz Info =====
    const questionCounter = document.getElementById('question-counter');
    const scoreDisplay = document.getElementById('score-display');
    const progressFill = document.getElementById('progress-fill');
    const timerDisplay = document.getElementById('timer');

    // ===== Results =====
    const finalScore = document.getElementById('final-score');
    const correctCount = document.getElementById('correct-count');
    const accuracyPercentage = document.getElementById('accuracy-percentage');
    const resultsMessage = document.getElementById('results-message');

    // ===== Stats =====
    const gamesPlayedDisplay = document.getElementById('games-played');
    const bestScoreDisplay = document.getElementById('best-score');
    const averageScoreDisplay = document.getElementById('average-score');
    const historyContainer = document.getElementById('history-container');

    // ===== State =====
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let totalQuestions = 10;

    let answered = false;

    let timer;
    let timeLeft = 15;

    // ===== Utility =====
    function showPage(page) {

        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        page.classList.add('active');
    }

    // ===== Timer =====
    function startTimer() {

        clearInterval(timer);

        timeLeft = 15;

        timerDisplay.textContent = `⏳ ${timeLeft}s`;

        timer = setInterval(() => {

            timeLeft--;

            timerDisplay.textContent = `⏳ ${timeLeft}s`;

            if (timeLeft <= 0) {

                clearInterval(timer);

                autoSubmitQuestion();
            }

        }, 1000);
    }

    // ===== Auto Submit =====
    function autoSubmitQuestion() {

        if (answered) return;

        answered = true;

        const currentQuestion = questions[currentQuestionIndex];

        const buttons = document.querySelectorAll('.answer-btn');

        buttons.forEach(button => {

            button.disabled = true;

            if (button.textContent === currentQuestion.correct_answer) {
                button.classList.add('correct');
            }
        });

        nextBtn.disabled = false;
    }

    // ===== Fetch Trivia =====
    async function fetchTrivia() {

        try {

            const playerName = playerNameInput.value.trim();

            if (!playerName) {
                alert('Please enter your name.');
                return;
            }

            let amount = parseInt(amountInput.value);

            if (isNaN(amount) || amount < 1 || amount > 50) {
                alert('Please enter between 1 and 50 questions.');
                return;
            }

            saveSettings();

            totalQuestions = amount;

            startBtn.disabled = true;
            startBtn.textContent = 'Loading...';

            let query = `/trivia?amount=${amount}&type=multiple`;

            if (difficultySelect.value) {
                query += `&difficulty=${difficultySelect.value}`;
            }

            if (categorySelect.value) {
                query += `&category=${categorySelect.value}`;
            }

            const response = await fetch(query);

            if (!response.ok) {

                const errorData = await response.json();

                throw new Error(errorData.error);
            }

            const data = await response.json();

            questions = data.questions;

            currentQuestionIndex = 0;
            score = 0;

            displayQuestion();

            showPage(quizPage);

        } catch (error) {

            console.error(error);

            alert(`⚠️ ${error.message}`);

        } finally {

            startBtn.disabled = false;
            startBtn.textContent = 'Start Quiz';
        }
    }

    // ===== Display Question =====
    function displayQuestion() {

        answered = false;

        const currentQuestion = questions[currentQuestionIndex];

        questionText.textContent = currentQuestion.question;

        questionCategory.textContent = currentQuestion.category;

        questionDifficulty.textContent =
            currentQuestion.difficulty.toUpperCase();

        questionDifficulty.className =
            `question-difficulty ${currentQuestion.difficulty}`;

        questionCounter.textContent =
            `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;

        scoreDisplay.textContent = `Score: ${score}`;

        progressFill.style.width =
            `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`;

        renderAnswers(currentQuestion);

        nextBtn.disabled = true;

        startTimer();
    }

    // ===== Render Answers =====
    function renderAnswers(question) {

        answersContainer.innerHTML = '';

        question.all_answers.forEach(answer => {

            const button = document.createElement('button');

            button.className = 'answer-btn';

            button.textContent = answer;

            button.addEventListener('click', () => {

                if (answered) return;

                answered = true;

                clearInterval(timer);

                validateAnswer(answer, question.correct_answer, button);
            });

            answersContainer.appendChild(button);
        });
    }

    // ===== Validate =====
    function validateAnswer(selectedAnswer, correctAnswer, buttonElement) {

        const allButtons = document.querySelectorAll('.answer-btn');

        allButtons.forEach(btn => {
            btn.disabled = true;
        });

        if (selectedAnswer === correctAnswer) {

            score++;

            buttonElement.classList.add('correct');

        } else {

            buttonElement.classList.add('incorrect');

            allButtons.forEach(btn => {

                if (btn.textContent === correctAnswer) {
                    btn.classList.add('correct');
                }
            });
        }

        nextBtn.disabled = false;
    }

    // ===== Save Quiz Result =====
    function saveQuizResult() {

        const history =
            JSON.parse(localStorage.getItem('quizHistory')) || [];

        const playerName = playerNameInput.value.trim();

        const result = {
            player: playerName,
            score,
            total: totalQuestions,
            accuracy: Math.round((score / totalQuestions) * 100),
            difficulty: difficultySelect.value || 'Any',
            category:
                categorySelect.options[
                    categorySelect.selectedIndex
                ].text,
            date: new Date().toLocaleString()
        };

        history.push(result);

        localStorage.setItem(
            'quizHistory',
            JSON.stringify(history)
        );
    }

    // ===== Save Settings =====
    function saveSettings() {

        const settings = {
            playerName: playerNameInput.value,
            difficulty: difficultySelect.value,
            category: categorySelect.value,
            amount: amountInput.value
        };

        localStorage.setItem(
            'quizSettings',
            JSON.stringify(settings)
        );
    }

    // ===== Load Settings =====
    function loadSettings() {

        const settings =
            JSON.parse(localStorage.getItem('quizSettings'));

        if (!settings) return;

        playerNameInput.value = settings.playerName || '';
        difficultySelect.value = settings.difficulty || '';
        categorySelect.value = settings.category || '';
        amountInput.value = settings.amount || 10;
    }

    // ===== Load Statistics =====
    function loadStatistics() {

        const history =
            JSON.parse(localStorage.getItem('quizHistory')) || [];

        const gamesPlayed = history.length;

        gamesPlayedDisplay.textContent = gamesPlayed;

        if (gamesPlayed === 0) {

            bestScoreDisplay.textContent = '0';
            averageScoreDisplay.textContent = '0%';

            historyContainer.innerHTML =
                '<p>No games played yet.</p>';

            return;
        }

        let bestScore = 0;
        let totalAccuracy = 0;

        history.forEach(game => {

            if (game.score > bestScore) {
                bestScore = game.score;
            }

            totalAccuracy += game.accuracy;
        });

        const average =
            Math.round(totalAccuracy / gamesPlayed);

        bestScoreDisplay.textContent = bestScore;
        averageScoreDisplay.textContent = `${average}%`;

        historyContainer.innerHTML = '';

        history
            .slice()
            .reverse()
            .slice(0, 5)
            .forEach(game => {

                const div = document.createElement('div');

                div.className = 'history-card';

                div.innerHTML = `
                    <h4>${game.player}</h4>
                    <p>Score: ${game.score}/${game.total}</p>
                    <p>Accuracy: ${game.accuracy}%</p>
                    <p>${game.category}</p>
                    <p>${game.date}</p>
                `;

                historyContainer.appendChild(div);
            });
    }

    // ===== Results =====
    function displayResults() {

        clearInterval(timer);

        saveQuizResult();

        loadStatistics();

        const accuracy =
            Math.round((score / totalQuestions) * 100);

        finalScore.textContent = score;

        correctCount.textContent = score;

        accuracyPercentage.textContent = `${accuracy}%`;

        if (accuracy === 100) {

            resultsMessage.textContent =
                '🎉 Perfect Score!';

        } else if (accuracy >= 80) {

            resultsMessage.textContent =
                '🔥 Amazing job!';

        } else if (accuracy >= 60) {

            resultsMessage.textContent =
                '👍 Great work!';

        } else {

            resultsMessage.textContent =
                '📚 Keep practicing!';
        }

        showPage(resultsPage);
    }

    // ===== Events =====
    startBtn.addEventListener('click', fetchTrivia);

    nextBtn.addEventListener('click', () => {

        currentQuestionIndex++;

        if (currentQuestionIndex < totalQuestions) {

            displayQuestion();

        } else {

            displayResults();
        }
    });

    retakeBtn.addEventListener('click', () => {
        showPage(landingPage);
    });

    homeBtn.addEventListener('click', () => {
        showPage(landingPage);
    });

    // ===== Initialize =====
    loadSettings();
    loadStatistics();
});