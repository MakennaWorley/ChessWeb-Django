import {Player, Game} from "./appInterfaces";

interface AppState {
  cachedRatings: Player[];
  cachedRatingsVolunteers: boolean;
  cachedPlayers: Player[];
  cachedGames: Game[];
  cachedGameDate: string;
}

export const appState: AppState = {
  cachedRatings: [],
  cachedRatingsVolunteers: false,
  cachedPlayers: [],
  cachedGames: [],
  cachedGameDate: "",
};