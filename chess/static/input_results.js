"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
document.addEventListener('DOMContentLoaded', function () {
    const dateSubmitBtn = document.getElementById('dateSubmitBtn');
    const gameModal = document.getElementById('gameModal');
    const closeModal = document.getElementsByClassName('close')[0];
    const gamesTableBody = document.getElementById('gamesTableBody');
    const selectedDateSpan = document.getElementById('selectedDate');
    dateSubmitBtn === null || dateSubmitBtn === void 0 ? void 0 : dateSubmitBtn.addEventListener('click', async function (event) {
        var _c;
        event.preventDefault();
        const selectedDate = ((_c = document.getElementById('game-date')) === null || _c === void 0 ? void 0 : _c.value) || '';
        const formattedDate = formatDate(selectedDate);
        if (formattedDate) {
            if (cachedGames && cachedGameDate === formattedDate) {
                await displayGamesInModal(cachedGames);
                if (selectedDateSpan)
                    selectedDateSpan.textContent = formattedDate;
                if (gameModal)
                    gameModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
            else {
                try {
                    const response = await fetch(utils_1.getGamesUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': utils_1.csrfToken,
                        },
                        body: JSON.stringify({ game_date: formattedDate }),
                    });
                    const data = await response.json();
                    if (data.games) {
                        cachedGames = data.games;
                        cachedGameDate = formattedDate;
                        await displayGamesInModal(data.games);
                        if (selectedDateSpan)
                            selectedDateSpan.textContent = formattedDate;
                        if (gameModal)
                            gameModal.style.display = 'block';
                        document.body.style.overflow = 'hidden';
                    }
                }
                catch (error) {
                    console.error('Error fetching games:', error);
                }
            }
        }
    });
    async function displayGamesInModal(games) {
        if (!cachedPlayers) {
            await fetchPlayers();
        }
        if (!gamesTableBody)
            return;
        gamesTableBody.innerHTML = '';
        for (const board of BOARDS) {
            const game = games.find((game) => game.board === board) || {};
            const row = `
                <tr>
                    <td>${board}</td>
                    <td>
                        <select class="player-select" data-player="white_player">
                            ${await populatePlayerDropdown(game.white_player || 'N/A')}
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
                            ${await populatePlayerDropdown(game.black_player || 'N/A')}
                        </select>
                    </td>
                </tr>
            `;
            gamesTableBody.insertAdjacentHTML('beforeend', row);
        }
        document.querySelectorAll('.player-select').forEach((select) => {
            select.addEventListener('change', function () {
                handlePlayerSelection(this);
            });
        });
    }
    const gameResultsForm = document.getElementById('gameResultsForm');
    gameResultsForm === null || gameResultsForm === void 0 ? void 0 : gameResultsForm.addEventListener('submit', async function (event) {
        var _c;
        event.preventDefault();
        const selectedDate = ((_c = document.getElementById('game-date')) === null || _c === void 0 ? void 0 : _c.value) || '';
        const formattedDate = formatDate(selectedDate);
        const gamesData = [];
        const rows = document.querySelectorAll('#gamesTableBody tr');
        rows.forEach((row) => {
            var _c;
            const board = ((_c = row.querySelector('td:first-child')) === null || _c === void 0 ? void 0 : _c.textContent) || 'Unknown Board';
            const whiteSelect = row.querySelector('select[data-player="white_player"]');
            const resultSelect = row.querySelector('.result-select');
            const blackSelect = row.querySelector('select[data-player="black_player"]');
            const white = (whiteSelect === null || whiteSelect === void 0 ? void 0 : whiteSelect.value) || 'N/A';
            const result = (resultSelect === null || resultSelect === void 0 ? void 0 : resultSelect.value) || 'NONE';
            const black = (blackSelect === null || blackSelect === void 0 ? void 0 : blackSelect.value) || 'N/A';
            gamesData.push({ board, white, result, black });
        });
        if (gameModal)
            gameModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        try {
            const response = await fetch(utils_1.saveGamesUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': utils_1.csrfToken,
                },
                body: JSON.stringify({ game_date: formattedDate, games: gamesData }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                let errorMessage = 'There was a problem saving the game results.';
                if (errorData === null || errorData === void 0 ? void 0 : errorData.message) {
                    errorMessage += `\nError details: ${errorData.message}`;
                }
                throw new Error(errorMessage);
            }
            else {
                const data = await response.json();
                if (data.status === 'success') {
                    alert('Game results sent successfully!');
                }
            }
        }
        catch (error) {
            alert(`Error submitting game results: ${error.message || error}`);
            console.error('Error submitting game results:', error);
        }
    });
    closeModal === null || closeModal === void 0 ? void 0 : closeModal.addEventListener('click', function () {
        if (gameModal)
            gameModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    window.addEventListener('click', function (event) {
        if (event.target === gameModal) {
            if (gameModal)
                gameModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});
