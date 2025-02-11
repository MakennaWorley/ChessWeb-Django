export const BOARDS: string[] = [
    ...Array.from({length: 5}, (_, i) => `G-${i + 1}`),
    ...Array.from({length: 6}, (_, i) => `H-${i + 1}`),
    ...Array.from({length: 22}, (_, i) => `I-${i + 1}`),
    ...Array.from({length: 22}, (_, i) => `J-${i + 1}`)
];

export const getPlayersUrl = "{% url 'get_players' %}";
export const getPairingsSheetUrl = "{% url 'get_games' %}";
export const getRatingsSheetUrl = "{% url 'get_ratings_sheet' %}";
export const getGamesUrl = "{% url 'get_games' %}";
export const saveGamesUrl = "{% url 'save_games' %}";
export const newPairingsUrl = "{% url 'new_pairings' %}";