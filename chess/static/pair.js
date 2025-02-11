"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
document.addEventListener('DOMContentLoaded', () => {
    const gameModal = document.getElementById('gameModal');
    const closeModal = document.querySelector('.close');
    const gamesTableBody = document.getElementById('gamesTableBody');
    const selectedDateSpan = document.getElementById('selectedDateDisplay');
    // Fetch and display games
    async function fetchAndDisplayGames(selectedDate) {
        const formattedDate = (0, utils_1.formatDate)(selectedDate);
        try {
            const response = await fetch(utils_1.getPlayersUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ game_date: formattedDate }),
            });
            if (!response.ok)
                throw new Error('Error fetching games');
            const data = await response.json();
            if (data.games) {
                await displayGamesInModal(data.games);
                if (selectedDateSpan)
                    selectedDateSpan.textContent = formattedDate;
                if (gameModal) {
                    gameModal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                }
            }
        }
        catch (error) {
            console.error('Error fetching games:', error);
        }
    }
    async function displayGamesInModal(games) {
        var _c, _d;
        if (!gamesTableBody)
            return;
        gamesTableBody.innerHTML = '';
        for (const board of utils_1.BOARDS) {
            const game = games.find((g) => g.boardLetter === board) || {};
            const row = `
                <tr>
                    <td>${board}</td>
                    <td>
                        <select class="player-select" data-player="white_player">
                            ${await (0, utils_1.populatePlayerDropdown)(((_c = game.white) === null || _c === void 0 ? void 0 : _c.toString()) || 'N/A')}
                        </select>
                    </td>
                    <td>
                        <select name="result-${board}" class="result-select">
                            <option value="NONE" ${game.result === 'U' ? 'selected' : ''}></option>
                            <option value="White" ${game.result === 'White' ? 'selected' : ''}>White</option>
                            <option value="Black" ${game.result === 'Black' ? 'selected' : ''}>Black</option>
                            <option value="Draw" ${game.result === 'Draw' ? 'selected' : ''}>Draw</option>
                        </select>
                    </td>
                    <td>
                        <select class="player-select" data-player="black_player">
                            ${await (0, utils_1.populatePlayerDropdown)(((_d = game.black) === null || _d === void 0 ? void 0 : _d.toString()) || 'N/A')}
                        </select>
                    </td>
                </tr>
            `;
            gamesTableBody.insertAdjacentHTML('beforeend', row);
        }
        document.querySelectorAll('.player-select').forEach((select) => {
            select.addEventListener('change', function () {
                (0, utils_1.handlePlayerSelection)(this);
            });
        });
    }
    const gameResultsForm = document.getElementById('gameResultsForm');
    gameResultsForm === null || gameResultsForm === void 0 ? void 0 : gameResultsForm.addEventListener('submit', async function (event) {
        var _c;
        event.preventDefault();
        const selectedDate = ((_c = document.getElementById('game-date')) === null || _c === void 0 ? void 0 : _c.value) || '';
        const formattedDate = (0, utils_1.formatDate)(selectedDate);
        const gamesData = [];
        const rows = document.querySelectorAll('#gamesTableBody tr');
        rows.forEach((row) => {
            var _c;
            const board = ((_c = row.querySelector('td:first-child')) === null || _c === void 0 ? void 0 : _c.textContent) || 'Unknown Board';
            const whiteSelect = row.querySelector('select[data-player="white_player"]');
            const resultSelect = row.querySelector('.result-select');
            const blackSelect = row.querySelector('select[data-player="black_player"]');
            gamesData.push({
                boardLetter: board,
                white: (whiteSelect === null || whiteSelect === void 0 ? void 0 : whiteSelect.value) ? parseInt(whiteSelect.value, 10) : null,
                result: resultSelect === null || resultSelect === void 0 ? void 0 : resultSelect.value,
                black: (blackSelect === null || blackSelect === void 0 ? void 0 : blackSelect.value) ? parseInt(blackSelect.value, 10) : null,
                dateOfMatch: formattedDate,
                modifiedBy: 1, // Replace with dynamic user ID
                isActive: true,
                createdAt: new Date().toISOString(),
            });
        });
        try {
            const response = await fetch(utils_1.saveGamesUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ game_date: formattedDate, games: gamesData }),
            });
            if (!response.ok)
                throw new Error('Error saving game results');
            const data = await response.json();
            if (data.status === 'success') {
                alert('Game results sent successfully!');
            }
        }
        catch (error) {
            alert(`Error submitting game results: ${error}`);
            console.error('Error submitting game results:', error);
        }
    });
    closeModal === null || closeModal === void 0 ? void 0 : closeModal.addEventListener('click', function () {
        if (gameModal) {
            gameModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});
