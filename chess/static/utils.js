let cachedRatings = null;
let cachedRatingsVolunteers = false;
let cachedPlayers = null;
let cachedGames = null;
let cachedGameDate  = null;

const BOARDS = [
                        ...Array.from({length: 5}, (_, i) => `G-${i + 1}`),
                        ...Array.from({length: 6}, (_, i) => `H-${i + 1}`),
                        ...Array.from({length: 22}, (_, i) => `I-${i + 1}`),
                        ...Array.from({length: 22}, (_, i) => `J-${i + 1}`)
                    ];

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}

async function fetchPlayers() {
    if (cachedPlayers) {
        return cachedPlayers
    }

    try {
        const response = await fetch(getPlayersUrl);
        if (!response.ok) {
            throw new Error('Error reading data');
        }
        const data = await response.json();
        cachedPlayers = data.players;
        return cachedPlayers;

    } catch (error) {
        console.error('There was a problem fetching player data:', error);
        return [];
    }
}

async function fetchGames() {
    const gameDate = formatDate(gameDateSelect.value);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    try {
        const response = await fetch(getGamesUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({ game_date: gameDate }),
        });

        if (!response.ok) {
            throw new Error('Bad Request');
        }

        const data = await response.json();
        if (data.status === "error") {
            console.error("Server response:", data.message);
        }

        return data;
    } catch (error) {
        console.error('Error fetching pairings data:', error);
    }
}

async function fetchRatingsSheet(showVolunteers) {
    const ratingsSheetDiv = document.getElementById('ratings_sheet');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    if (cachedRatings && cachedRatingsVolunteers === showVolunteers) {
        ratingsSheetDiv.innerHTML = generateRatingsSheetHTML(cachedRatings);
    }

    try {
        const response = await fetch(getRatingsSheetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({ show_volunteers: showVolunteers }),
        });
        if (!response.ok) {
            throw new Error('Error reading data');
        }
        const data = await response.json();
        cachedRatings = data.players;

        ratingsSheetDiv.innerHTML = generateRatingsSheetHTML(cachedRatings);
    } catch (error) {
        console.error('There was a problem fetching player data:', error);
    }
}

async function fetchPairingsSheet() {
    const pairingsSheetDiv = document.getElementById('pairings_sheet');
    const gameDate = formatDate(gameDateSelect.value);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    if (cachedGames && cachedGameDate === gameDate) {
        pairingsSheetDiv.innerHTML = generatePairingsSheetHTML(cachedGames);
        return;
    }

    try {
        const response = await fetch(getPairingsSheetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({ game_date: gameDate }),
        });

        if (!response.ok) {
            throw new Error('Bad Request');
        }

        const data = await response.json();
        if (data.status === "error") {
            console.error("Server response:", data.message);
        }

        cachedGames = data.games || [];
        cachedGameDate = gameDate;

        pairingsSheetDiv.innerHTML = generatePairingsSheetHTML(data.games || []);
    } catch (error) {
        console.error('Error fetching pairings data:', error);
    }
}

async function populatePlayerDropdown(selectedPlayer) {
    let dropdownHTML = '';

    if (Array.isArray(cachedPlayers)) {
        cachedPlayers.forEach(player => {
            const playerName = `${player.name}`;
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

function generateRatingsSheetHTML(players) {
    let html = `
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Rating</th>
                <th>Rating Change</th>
                <th>Grade</th>
                <th>Coach(s)</th>
                <th>Parent or Guardian</th>
                <th>Parent Email</th>
                <th>Parent Phone Number</th>
            </tr>
        </thead>
        <tbody>
    `;

    players.forEach(player => {
        html += `
            <tr>
                <td>${player.name}</td>
                <td>${player.rating}</td>
                <td>${player.improved_rating}</td>
                <td>${player.grade}</td>
                <td>${player.lesson_class}</td>
                <td>${player.parent_or_guardian}</td>
                <td>${player.email}</td>
                <td>${player.phone}</td>
            </tr>
        `;
    });

    html += `
        </tbody>
    </table>`;

    return html;
}

function generatePairingsSheetHTML(games) {
    let html = `
    <table>
        <thead>
            <tr>
                <th>Board</th>
                <th>White Player</th>
                <th>Result</th>
                <th>Black Player</th>
            </tr>
        </thead>
    <tbody>`;

    const gamesMap = Object.fromEntries(games.map(game => [game.board, game]));

    BOARDS.forEach(board => {
        const game = gamesMap[board];
        html += `
            <tr>
                <td>${board}</td>
                <td>${game ? game.white_player : 'N/A'}</td>
                <td>${game ? game.result : ''}</td>
                <td>${game ? game.black_player : 'N/A'}</td>
            </tr>
        `;
    });

    html += `
        </tbody>
    </table>`;

    return html;
}
