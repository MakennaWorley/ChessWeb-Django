let cachedPlayers = null;

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function fetchPlayers() {}

async function fetchRatingsSheet() {
    const ratingsSheetDiv = document.getElementById('ratings_sheet');

    if (cachedPlayers) {
        ratingsSheetDiv.innerHTML = generateRatingsSheetHTML(cachedPlayers);
    }

    try {
        const response = await fetch(getRatingsSheetUrl);
        if (!response.ok) {
            throw new Error('Error reading data');
        }
        const data = await response.json();
        cachedPlayers = data.players;

        ratingsSheetDiv.innerHTML = generateRatingsSheetHTML(cachedPlayers);
    } catch (error) {
        console.error('There was a problem fetching player data:', error);
    }
}

async function fetchPairingsSheet() {
    const pairingsSheetDiv = document.getElementById('pairings_sheet');
    const gameDate = formatDate(gameDateSelect.value);
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

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

        pairingsSheetDiv.innerHTML = generatePairingsSheetHTML(data.games || []);
    } catch (error) {
        console.error('Error fetching pairings data:', error);
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

    games.forEach(game => {
        html += `
            <tr>
                <td>${game.board}</td>
                <td>${game.white_player}</td>
                <td>${game.result}</td>
                <td>${game.black_player}</td>
            </tr>
        `;
    });

    html += `
        </tbody>
    </table>`;

    return html;
}
