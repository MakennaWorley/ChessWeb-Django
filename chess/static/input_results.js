const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

document.addEventListener('DOMContentLoaded', function () {
    const dateSubmitBtn = document.getElementById('dateSubmitBtn');
    const gameModal = document.getElementById('gameModal');
    const closeModal = document.getElementsByClassName('close')[0];
    const gamesTableBody = document.getElementById('gamesTableBody');
    const selectedDateSpan = document.getElementById('selectedDate');

    dateSubmitBtn.addEventListener('click', async function (event) {
        event.preventDefault();
        const selectedDate = document.getElementById('game-date').value;
        const formattedDate = formatDate(selectedDate);

        if (formattedDate) {
            if (cachedGames && cachedGameDate === formattedDate) {
                await displayGamesInModal(cachedGames);
                selectedDateSpan.textContent = formattedDate;
                gameModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            } else {
                try {
                    const response = await fetch(getGamesUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken,
                        },
                        body: JSON.stringify({game_date: formattedDate})
                    });

                    const data = await response.json();

                    if (data.games) {
                        cachedGames = data.games;
                        cachedGameDate = formattedDate;

                        await displayGamesInModal(data.games);
                        selectedDateSpan.textContent = formattedDate;
                        gameModal.style.display = 'block';
                        document.body.style.overflow = 'hidden';
                    }
                } catch (error) {
                    console.error('Error fetching games:', error);
                }
            }
        }
    });

    async function displayGamesInModal(games) {
        if (!cachedPlayers) {
            await fetchPlayers();
        }

        gamesTableBody.innerHTML = '';

        for (const board of BOARDS) {
            const game = games.find(game => game.board === board) || {};

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

        document.querySelectorAll('.player-select').forEach(select => {
            select.addEventListener('change', function () {
                handlePlayerSelection(this);
            });
        });
    }

    document.getElementById('gameResultsForm').addEventListener('submit', async function (event) {
        event.preventDefault();

        const selectedDate = document.getElementById('game-date').value;
        const formattedDate = formatDate(selectedDate);
        const gamesData = [];
        const rows = document.querySelectorAll('#gamesTableBody tr');

        rows.forEach(row => {
            const board = row.querySelector('td:first-child')?.textContent || 'Unknown Board';
            const whiteSelect = row.querySelector('select[data-player="white_player"]');
            const resultSelect = row.querySelector('.result-select');
            const blackSelect = row.querySelector('select[data-player="black_player"]');

            const white = whiteSelect ? whiteSelect.value : 'N/A';
            const result = resultSelect ? resultSelect.value : 'NONE';
            const black = blackSelect ? blackSelect.value : 'N/A';

            gamesData.push({board, white, result, black});
        });

        gameModal.style.display = 'none';
        document.body.style.overflow = 'auto';

        try {
            const response = await fetch(saveGamesUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({game_date: formattedDate, games: gamesData})
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                let errorMessage = 'There was a problem saving the game results.';

                if (errorData && errorData.message) {
                    errorMessage += `\nError details: ${errorData.message}`;
                }

                throw new Error(errorMessage);
            } else {
                const data = await response.json();
                if (data.status === 'success') {
                    let successMessage = 'Game results sent successfully!';

                    if (data.added_games && data.added_games.length > 0) {
                        successMessage += `\n\nAdded games:\n- ${data.added_games.join('\n- ')}`;
                    }
                    if (data.deactivated_games && data.deactivated_games.length > 0) {
                        successMessage += `\n\nDeactivated games:\n- ${data.deactivated_games.join('\n- ')}`;
                    }
                    if (data.updated_games && data.updated_games.length > 0) {
                        successMessage += `\n\nUpdated games:\n- ${data.updated_games.join('\n- ')}`;
                    }
                    if (data.ratings && data.ratings.length > 0) {
                        successMessage += `\n\nUpdated these player's ratings:\n- ${data.ratings.join('\n- ')}`;
                    }

                    alert(successMessage);
                } else {
                    let errorDetails = data.message || 'An unknown error occurred.';

                    if (data.added_games && data.added_games.length > 0) {
                        errorDetails += `\n\nAdded games:\n- ${data.added_games.join('\n- ')}`;
                    }
                    if (data.deactivated_games && data.deactivated_games.length > 0) {
                        errorDetails += `\n\nDeactivated games:\n- ${data.deactivated_games.join('\n- ')}`;
                    }
                    if (data.updated_games && data.updated_games.length > 0) {
                        errorDetails += `\n\nUpdated games:\n- ${data.updated_games.join('\n- ')}`;
                    }
                    if (data.ratings && data.ratings.length > 0) {
                        errorDetails += `\n\nUpdated these player's ratings:\n- ${data.ratings.join('\n- ')}`;
                    }

                    alert(`Error sending game results:\n${errorDetails}`);
                }
            }
        } catch (error) {
            alert(`Error submitting game results: ${error.message || error}`);
            console.error('Error submitting game results:', error);
        }
    });

    // Close the modal when the "close" button is clicked
    closeModal.addEventListener('click', function () {
        gameModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // Close the modal when clicking outside of the modal content
    window.addEventListener('click', function (event) {
        if (event.target === gameModal) {
            gameModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});