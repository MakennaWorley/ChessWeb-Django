import {
    getCsrfToken,
    formatDate,
} from './appFunctions';

import {
    Game
} from './appInterfaces';

import {
    saveGamesUrl,
} from "./appVariables";

document.addEventListener('DOMContentLoaded', () => {
    const gameModal = document.getElementById('gameModal') as HTMLElement;
    const closeModal = document.querySelector('.close') as HTMLElement;

    const gameResultsForm = document.getElementById('gameResultsForm') as HTMLFormElement | null;

    gameResultsForm?.addEventListener('submit', async function (event) {
        event.preventDefault();

        const selectedDate = (document.getElementById('game-date') as HTMLInputElement | null)?.value || '';
        const formattedDate = formatDate(selectedDate);
        const gamesData: Game[] = [];
        const rows = document.querySelectorAll('#gamesTableBody tr');

        rows.forEach((row) => {
            const board = row.querySelector('td:first-child')?.textContent || 'Unknown Board';
            const [boardLetter, boardNumberStr] = board.split("-");
            const boardNumber = parseInt(boardNumberStr, 10);

            const whiteSelect = row.querySelector('select[data-player="white_player"]') as HTMLSelectElement | null;
            const resultSelect = row.querySelector('.result-select') as HTMLSelectElement | null;
            const blackSelect = row.querySelector('select[data-player="black_player"]') as HTMLSelectElement | null;

            gamesData.push({
                id: null,
                dateOfMatch: formattedDate,
                white: whiteSelect?.value ? parseInt(whiteSelect.value, 10) : null,
                black: blackSelect?.value ? parseInt(blackSelect.value, 10) : null,
                boardLetter: boardLetter,
                boardNumber: boardNumber,
                result: resultSelect?.value as 'White' | 'Black' | 'Draw' | 'U',
                modifiedBy: null,
                isActive: null,
                createdAt: null,
                endAt: null,
            });
        });

        try {
            const response = await fetch(saveGamesUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken(),
                },
                body: JSON.stringify({ game_date: formattedDate, games: gamesData }),
            });

            if (!response.ok) throw new Error('Error saving game results');

            const data = await response.json();

            if (data.status === 'success') {
                alert('Game results sent successfully!');
            }
        } catch (error) {
            alert(`Error submitting game results: ${error}`);
            console.error('Error submitting game results:', error);
        }
    });

    closeModal?.addEventListener('click', function () {
        if (gameModal) {
            gameModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});
