import {
    getCsrfToken,
    formatDate,
    displayGamesInModal
} from './appFunctions';

import { appState } from "./appState"

import {
    getGamesUrl,
    saveGamesUrl,
} from "./appVariables";

document.addEventListener('DOMContentLoaded', function () {
    const dateSubmitBtn = document.getElementById('dateSubmitBtn') as HTMLButtonElement;
    const gameModal = document.getElementById('gameModal') as HTMLElement;
    const closeModal = document.getElementsByClassName('close')[0] as HTMLElement;
    const gamesTableBody = document.getElementById('gamesTableBody') as HTMLElement;
    const selectedDateSpan = document.getElementById('selectedDate') as HTMLElement;

    dateSubmitBtn?.addEventListener('click', async function (event) {
        event.preventDefault();
        const selectedDate = (document.getElementById('game-date') as HTMLInputElement)?.value || '';
        const formattedDate = formatDate(selectedDate);

        if (formattedDate) {
            if (appState.cachedGames && appState.cachedGameDate === formattedDate) {
                await displayGamesInModal(appState.cachedGames, gamesTableBody);
                if (selectedDateSpan) selectedDateSpan.textContent = formattedDate;
                if (gameModal) gameModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            } else {
                try {
                    const response = await fetch(getGamesUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCsrfToken(),
                        },
                        body: JSON.stringify({ game_date: formattedDate }),
                    });

                    const data = await response.json();

                    if (data.games) {
                        appState.cachedGames = data.games;
                        appState.cachedGameDate = formattedDate;

                        await displayGamesInModal(data.games, gamesTableBody);
                        if (selectedDateSpan) selectedDateSpan.textContent = formattedDate;
                        if (gameModal) gameModal.style.display = 'block';
                        document.body.style.overflow = 'hidden';
                    }
                } catch (error) {
                    console.error('Error fetching games:', error);
                }
            }
        }
    });

    const gameResultsForm = document.getElementById('gameResultsForm') as HTMLFormElement;
    gameResultsForm?.addEventListener('submit', async function (event) {
        event.preventDefault();

        const selectedDate = (document.getElementById('game-date') as HTMLInputElement)?.value || '';
        const formattedDate = formatDate(selectedDate);
        const gamesData: any[] = [];
        const rows = document.querySelectorAll('#gamesTableBody tr');

        rows.forEach((row) => {
            const board = row.querySelector('td:first-child')?.textContent || 'Unknown Board';
            const whiteSelect = row.querySelector('select[data-player="white_player"]') as HTMLSelectElement;
            const resultSelect = row.querySelector('.result-select') as HTMLSelectElement;
            const blackSelect = row.querySelector('select[data-player="black_player"]') as HTMLSelectElement;

            const white = whiteSelect?.value || 'N/A';
            const result = resultSelect?.value || 'NONE';
            const black = blackSelect?.value || 'N/A';

            gamesData.push({ board, white, result, black });
        });

        if (gameModal) gameModal.style.display = 'none';
        document.body.style.overflow = 'auto';

        try {
            const response = await fetch(saveGamesUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken(),
                },
                body: JSON.stringify({ game_date: formattedDate, games: gamesData }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                let errorMessage = 'There was a problem saving the game results.';

                if (errorData?.message) {
                    errorMessage += `\nError details: ${errorData.message}`;
                }

                throw new Error(errorMessage);
            } else {
                const data = await response.json();
                if (data.status === 'success') {
                    alert('Game results sent successfully!');
                }
            }
        } catch (error: any) {
            alert(`Error submitting game results: ${error.message || error}`);
            console.error('Error submitting game results:', error);
        }
    });

    closeModal?.addEventListener('click', function () {
        if (gameModal) gameModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    window.addEventListener('click', function (event) {
        if (event.target === gameModal) {
            if (gameModal) gameModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});