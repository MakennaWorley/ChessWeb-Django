const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

document.addEventListener('DOMContentLoaded', function () {
    const dateSubmitBtn = document.getElementById('dateSubmitBtn');
    const gameModal = document.getElementById('gameModal');
    const closeModal = document.getElementsByClassName('close')[0];
    const newGamesTableBody = document.getElementById('newGamesTableBody');
    const selectedDateSpan = document.getElementById('selectedDateDisplay');

    dateSubmitBtn.addEventListener('click', async function (event) {
        event.preventDefault();
        const selectedDate = document.getElementById('selectedDate').value;

        if (!selectedDate) {
            alert('Please select a date before continuing.');
            return;
        }

        const formattedDate = formatDate(selectedDate);

        if (formattedDate) {
            if (!cachedPlayers) {
                await fetchPlayers();
            }

            newGamesTableBody.innerHTML = '';

            selectedDateSpan.textContent = formattedDate;

            for (const board of BOARDS) {
                const row = `
                        <tr>
                            <td>${board}</td>
                            <td>
                                <select class="player-select" data-player="white_player">
                                    ${await populatePlayerDropdown('N/A')}
                                </select>
                            </td>
                            <td>
                                <select class="player-select" data-player="black_player">
                                    ${await populatePlayerDropdown('N/A')}
                                </select>
                            </td>
                        </tr>
                        `;
                newGamesTableBody.insertAdjacentHTML('beforeend', row);
            }

            document.querySelectorAll('.player-select').forEach(select => {
                select.addEventListener('change', function () {
                    handlePlayerSelection(this);
                });
            });

            selectedDateSpan.textContent = selectedDate;
            gameModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    });

    document.getElementById('newGamesForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const selectedDate = document.getElementById('selectedDate').value;
        const formattedDate = formatDate(selectedDate);

        const separateClassesChecked = document.getElementById('separateClasses').checked;

        gamesData = []

        document.querySelectorAll('#newGamesTableBody tr').forEach((row, index) => {
            const board = row.querySelector('td:nth-child(1)').textContent;
            const whitePlayer = row.querySelector('td:nth-child(2) select').value;
            const blackPlayer = row.querySelector('td:nth-child(3) select').value;

            if (whitePlayer !== "N/A" && blackPlayer !== "N/A") {
                gamesData.push({board, whitePlayer, blackPlayer});
            }
        });

        fetch(newPairingsUrl, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({
                game_date: formattedDate,
                games: gamesData,
                separate_classes: separateClassesChecked
            })
        }).then(response => {
            if (response.ok) {
                alert('Pairings saved successfully!');
                gameModal.style.display = 'none';
            } else {
                alert('Error pairing games');
            }
        });
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