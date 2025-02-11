import {
    Player,
    Game
} from './appInterfaces';

import { appState } from "./appState"

import {
    BOARDS,
    getPlayersUrl,
    getPairingsSheetUrl,
    getRatingsSheetUrl,
    getGamesUrl,
} from "./appVariables";

const gameDateSelect = document.getElementById('game-date') as HTMLInputElement | null;

export const getCsrfToken = (): string =>
    (document.querySelector('[name=csrfmiddlewaretoken]') as HTMLInputElement | null)?.value || '';

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}

/* Doesn't need to worry about player data being different since the database only holds one instance of a specific player */
export async function fetchPlayers() {
    if (appState.cachedPlayers.length > 0) {
        return appState.cachedPlayers;
    }

    try {
        const response = await fetch(getPlayersUrl);
        if (!response.ok) {
            throw new Error('Error reading data');
        }
        const data = await response.json();
        appState.cachedPlayers = data.players;
        return appState.cachedPlayers;

    } catch (error) {
        console.error('There was a problem fetching player data:', error);
        return [];
    }
}

/* Needs the date to function since the games are tied to the date of the match */
export async function fetchGames() {
    if (!gameDateSelect) {
        throw new Error("game-date element not found");
    }

    const gameDate = formatDate(gameDateSelect.value);

    try {
        const response = await fetch(getGamesUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({game_date: gameDate}),
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

/* Doesn't need to worry about player data being different since the database only holds one instance of a specific player,
*  but needs to have the variable of showVolunteers */
export async function fetchRatingsSheet(showVolunteers: boolean) {
    const ratingsSheetDiv = document.getElementById('ratings_sheet');

    if (appState.cachedRatings && appState.cachedRatingsVolunteers === showVolunteers) {
        ratingsSheetDiv!.innerHTML = generateRatingsSheetHTML(appState.cachedRatings);
    }

    try {
        const response = await fetch(getRatingsSheetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({show_volunteers: showVolunteers}),
        });
        if (!response.ok) {
            throw new Error('Error reading data');
        }
        const data = await response.json();
        appState.cachedRatings = data.players;

        ratingsSheetDiv!.innerHTML = generateRatingsSheetHTML(appState.cachedRatings);
    } catch (error) {
        console.error('There was a problem fetching player data:', error);
    }
}

/* Needs the date to function since the games are tied to the date of the match */
export async function fetchPairingsSheet() {
    const pairingsSheetDiv = document.getElementById('pairings_sheet');
    const gameDateSelect = document.getElementById('game-date') as HTMLInputElement | null;

    if (!gameDateSelect) {
        throw new Error("game-date element not found");
    }

    const gameDate = formatDate(gameDateSelect.value);

    if (appState.cachedGames && appState.cachedGameDate === gameDate) {
        pairingsSheetDiv!.innerHTML = generatePairingsSheetHTML(appState.cachedGames);
        return;
    }

    try {
        const response = await fetch(getPairingsSheetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({game_date: gameDate}),
        });

        if (!response.ok) {
            throw new Error('Bad Request');
        }

        const data = await response.json();
        if (data.status === "error") {
            console.error("Server response:", data.message);
        }

        appState.cachedGames = data.games || [];
        appState.cachedGameDate = gameDate;

        pairingsSheetDiv!.innerHTML = generatePairingsSheetHTML(data.games || []);
    } catch (error) {
        console.error('Error fetching pairings data:', error);
    }
}

/* Doesn't need to worry about player data being different since the database only holds one instance of a specific player */
async function populatePlayerDropdown(selectedPlayer: Player) {
    let dropdownHTML = '';

    if (Array.isArray(appState.cachedPlayers)) {
        appState.cachedPlayers.forEach(player => {
            const playerName = `${player.name}`;
            dropdownHTML += `<option value="${playerName}" ${playerName === selectedPlayer.name ? 'selected' : ''}>${playerName}</option>`;
        });
    }

    dropdownHTML += `<option value="N/A" ${selectedPlayer.name === 'N/A' ? 'selected' : ''}>N/A</option>`;
    return dropdownHTML;
}

// Function to handle player selection and set other occurrences of that player to N/A
function handlePlayerSelection(selectedDropdown: HTMLSelectElement): void {
    const selectedPlayer = selectedDropdown.value;
    const playerDropdowns = document.querySelectorAll<HTMLSelectElement>('.player-select');

    playerDropdowns.forEach((dropdown) => {
        if (dropdown !== selectedDropdown && dropdown.value === selectedPlayer) {
            dropdown.value = 'N/A';
        }
    });
}

export async function displayGamesInModal(games: any[], gamesTableBody: HTMLElement) {
    if (!appState.cachedPlayers) {
        await fetchPlayers();
    }

    if (!gamesTableBody) return;
    gamesTableBody.innerHTML = '';

    for (const board of BOARDS) {
        const game = games.find((game: any) => game.board === board) || {};

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
        select.addEventListener('change', (event) => {
            handlePlayerSelection(event.currentTarget as HTMLSelectElement);
        });
    });
}

// Generating the ratings sheet table
export function generateRatingsSheetHTML(players: Player[]) {
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
                <td>${player.improvedRating}</td>
                <td>${player.grade}</td>
                <td>${player.lessonClass}</td>
                <td>${player.parentOrGuardian}</td>
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

// Generating the pairing sheet table
export function generatePairingsSheetHTML(games: Game[]) {
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

    const gamesMap: { [key: string]: Game } = {};
    games.forEach((game) => {
        const key = `${game.boardLetter}-${game.boardNumber}`;
        gamesMap[key] = game;
    });

    BOARDS.forEach(board => {
        const game = gamesMap[board];
        html += `
            <tr>
                <td>${board}</td>
                <td>${game ? game.white : 'N/A'}</td>
                <td>${game ? game.result : ''}</td>
                <td>${game ? game.black : 'N/A'}</td>
            </tr>
        `;
    });

    html += `
        </tbody>
    </table>`;

    return html;
}
