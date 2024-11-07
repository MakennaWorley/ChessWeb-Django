function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function fetchGames() {
    const gameDate = formatDate(gameDateSelect.value);

    fetch("{% url 'update_games' %}", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
        },
        body: JSON.stringify({
            game_date: gameDate,
        }),
    }).then(response => response.json()).then(data => {
        const gamesTbody = document.getElementById('games-tbody');
        gamesTbody.innerHTML = '';

        const boards = [
            ...Array.from({length: 5}, (_, i) => `G-${i + 1}`),
            ...Array.from({length: 6}, (_, i) => `H-${i + 1}`),
            ...Array.from({length: 22}, (_, i) => `I-${i + 1}`),
            ...Array.from({length: 22}, (_, i) => `J-${i + 1}`)
        ];

        boards.forEach((board, index) => {
            const game = data.games ? data.games.find(game => game.board === board) : null;

            const row = `<tr>
                                    <td>${board}</td>
                                    <td>${game ? game.white : 'N/A'}</td>
                                    <td>${game ? game.result : ''}</td>
                                    <td>${game ? game.black : 'N/A'}</td>
                                 </tr>`;
            gamesTbody.insertAdjacentHTML('beforeend', row);
        });
    }).catch(error => console.error('Error:', error));
}

async function fetchPlayers() {
    if (cachedPlayers) {
        return cachedPlayers;
    }

    try {
        const response = await fetch("{% url 'get_players' %}");
        if (!response.ok) {
            throw new Error('Error reading data');
        }
        const data = await response.json();
        cachedPlayers = data.players;
        return cachedPlayers;
    } catch (error) {
        console.error('There was a problem fetching player data:', error);
    }
}

async function populatePlayerDropdown(selectedPlayer) {
    let dropdownHTML = '';

    const players = await fetchPlayers();

    if (Array.isArray(players)) {
        players.forEach(player => {
            const playerName = `${player.last_name}, ${player.first_name}`;
            dropdownHTML += `<option value="${playerName}" ${playerName === selectedPlayer ? 'selected' : ''}>${playerName}</option>`;
        });
    }

    dropdownHTML += `<option value="N/A" ${selectedPlayer === 'N/A' ? 'selected' : ''}>N/A</option>`;
    return dropdownHTML;
}

// Function to handle player selection and set other occurrences of that player to N/A
function handlePlayerSelection(selectedDropdown) {
    const selectedPlayer = selectedDropdown.value;
    const playerDropdowns = document.querySelectorAll('.player-select');

    playerDropdowns.forEach(dropdown => {
        if (dropdown !== selectedDropdown && dropdown.value === selectedPlayer) {
            dropdown.value = 'N/A';
        }
    });
}