export type RewindGroup = "playstyle" | "personality" | "fortress" | "sumo";

export interface VoteOption {
  name: string;
  percent: number;
}

export interface SurveyQuestion {
  id: number;
  title: string;
  group: RewindGroup;
  responses: number;
  options: VoteOption[];
}

export const REWIND_2025_QUESTIONS: SurveyQuestion[] = [
  { id: 1, title: "Cleanest Cutter", group: "playstyle", responses: 28, options: [{ name: "Ampz", percent: 46.4 }, { name: "Ninja Potato", percent: 28.6 }, { name: "Force", percent: 10.7 }, { name: "Olive", percent: 10.7 }, { name: "Pizza", percent: 3.6 }] },
  { id: 2, title: "Cleanest Turns", group: "playstyle", responses: 27, options: [{ name: "Apple", percent: 40.7 }, { name: "Noodles", percent: 33.3 }, { name: "Kronkleberry", percent: 14.8 }, { name: "N", percent: 11.1 }, { name: "Ampz", percent: 0 }] },
  { id: 3, title: "Ugliest Turns", group: "playstyle", responses: 27, options: [{ name: "Johnny", percent: 33.3 }, { name: "Force", percent: 29.6 }, { name: "Andrei", percent: 22.2 }, { name: "Olive", percent: 14.8 }] },
  { id: 4, title: "Best Mazer", group: "playstyle", responses: 27, options: [{ name: "Kronkleberry", percent: 37 }, { name: "Ellis", percent: 33.3 }, { name: "Apple", percent: 18.5 }, { name: "N", percent: 11.1 }] },
  { id: 5, title: "Most Aggressive", group: "playstyle", responses: 28, options: [{ name: "Gazelle", percent: 53.6 }, { name: "Pizza", percent: 25 }, { name: "Force", percent: 21.4 }, { name: "Olive", percent: 0 }] },
  { id: 6, title: "Most Passive", group: "playstyle", responses: 28, options: [{ name: "Mikemacx", percent: 46.4 }, { name: "Tj", percent: 35.7 }, { name: "Nelg", percent: 10.7 }, { name: "Jz", percent: 7.1 }] },
  { id: 7, title: "Biggest Tunneler", group: "playstyle", responses: 28, options: [{ name: "Ninja Potato", percent: 57.1 }, { name: "Gazelle", percent: 35.7 }, { name: "Olive", percent: 7.1 }, { name: "Pizza", percent: 0 }] },
  { id: 8, title: "Should Come Out of Retirement", group: "personality", responses: 28, options: [{ name: "Koala", percent: 42.9 }, { name: "Magi", percent: 28.6 }, { name: "Mr", percent: 17.9 }, { name: "Carnage", percent: 10.7 }] },
  { id: 9, title: "Love to See Them Lose", group: "personality", responses: 27, options: [{ name: "Apple", percent: 55.6 }, { name: "Cadillac", percent: 14.8 }, { name: "Sanity", percent: 11.1 }, { name: "Nelg", percent: 11.1 }, { name: "Ellis", percent: 7.4 }] },
  { id: 10, title: "Love to See Them Win", group: "personality", responses: 27, options: [{ name: "Morbit", percent: 48.1 }, { name: "Ugin", percent: 33.3 }, { name: "Sanity", percent: 14.8 }, { name: "Cookie", percent: 3.7 }] },
  { id: 11, title: "Best Meme / Instant Chat", group: "personality", responses: 27, options: [{ name: "LoL!", percent: 40.7 }, { name: "Ashi's Insta Chats", percent: 33.3 }, { name: "Average Sanity Play", percent: 22.2 }, { name: "Cadi's Insta Chats", percent: 3.7 }] },
  { id: 12, title: "Biggest Rager", group: "personality", responses: 28, options: [{ name: "Nelg", percent: 42.9 }, { name: "Apple", percent: 25 }, { name: "Elis", percent: 17.9 }, { name: "Cadillac", percent: 14.3 }] },
  { id: 13, title: "Biggest Tron Addict", group: "personality", responses: 28, options: [{ name: "Sanity", percent: 67.9 }, { name: "Nelg", percent: 17.9 }, { name: "Pizza", percent: 7.1 }, { name: "Elis", percent: 7.1 }] },
  { id: 14, title: "Cutest Couple", group: "personality", responses: 27, options: [{ name: "Cookie and Johnny", percent: 48.1 }, { name: "Sanity and Morbit", percent: 29.6 }, { name: "Sanity and Ampz", percent: 14.8 }, { name: "Wolf and Tx", percent: 7.4 }] },
  { id: 15, title: "Most Beloved", group: "personality", responses: 27, options: [{ name: "Johnny", percent: 44.4 }, { name: "Morbit", percent: 22.2 }, { name: "Koala", percent: 22.2 }, { name: "Sanity", percent: 11.1 }] },
  { id: 16, title: "Should Unbind Chat Key", group: "personality", responses: 26, options: [{ name: "Andrei", percent: 61.5 }, { name: "Apple", percent: 16.4 }, { name: "Pizza", percent: 11.5 }, { name: "Cadillac", percent: 7.7 }, { name: "Nelg", percent: 3.8 }] },
  { id: 17, title: "Soothing Voice", group: "personality", responses: 27, options: [{ name: "Kronkleberry", percent: 29.6 }, { name: "Wind", percent: 29.6 }, { name: "Nanu", percent: 22.2 }, { name: "Koala", percent: 18.5 }, { name: "Johnny", percent: 0 }] },
  { id: 18, title: "Favorite Tronner to Have in Server", group: "personality", responses: 29, options: [{ name: "Fini", percent: 37.9 }, { name: "Noodles", percent: 24.1 }, { name: "FoFo", percent: 13.8 }, { name: "Kronkleberry", percent: 13.8 }, { name: "Morbit", percent: 10.3 }] },
  { id: 19, title: "Funniest Tronner", group: "personality", responses: 26, options: [{ name: "Hall", percent: 46.2 }, { name: "Kronkleberry", percent: 19.2 }, { name: "Sanity", percent: 19.2 }, { name: "Andrei", percent: 15.4 }] },
  { id: 20, title: "Community MVP", group: "personality", responses: 28, options: [{ name: "Kronkleberry", percent: 53.6 }, { name: "Nelg", percent: 21.4 }, { name: "Deli", percent: 21.4 }, { name: "Nanu", percent: 3.6 }] },
  { id: 21, title: "Love Playing With Them", group: "fortress", responses: 26, options: [{ name: "Wolf", percent: 30.8 }, { name: "Olive", percent: 30.8 }, { name: "Nanu", percent: 19.2 }, { name: "Kronkleberry", percent: 15.4 }, { name: "Ampz", percent: 3.8 }] },
  { id: 22, title: "Hate Playing Against Them", group: "fortress", responses: 25, options: [{ name: "Orly", percent: 44 }, { name: "Ampz", percent: 32 }, { name: "Wind", percent: 12 }, { name: "Pizza", percent: 8 }, { name: "Jz", percent: 4 }] },
  { id: 23, title: "Best Center", group: "fortress", responses: 25, options: [{ name: "Gazelle", percent: 72 }, { name: "Deso", percent: 16 }, { name: "Hall", percent: 8 }, { name: "DGM", percent: 4 }] },
  { id: 24, title: "Best Winger", group: "fortress", responses: 25, options: [{ name: "Ninja Potato", percent: 40 }, { name: "Kronkleberry", percent: 32 }, { name: "Pizza", percent: 12 }, { name: "Hall", percent: 12 }, { name: "Force", percent: 4 }] },
  { id: 25, title: "Best Sweeper", group: "fortress", responses: 24, options: [{ name: "Ampz", percent: 87.5 }, { name: "Wolf", percent: 8.3 }, { name: "Koala", percent: 4.2 }, { name: "Deso", percent: 0 }] },
  { id: 26, title: "Best Defender", group: "fortress", responses: 25, options: [{ name: "Wind", percent: 48 }, { name: "Nanu", percent: 20 }, { name: "Ampz", percent: 20 }, { name: "Tx", percent: 8 }, { name: "Orly", percent: 4 }] },
  { id: 27, title: "Scariest Center/Wing Duo", group: "fortress", responses: 24, options: [{ name: "Gazelle and Kronkleberry", percent: 79.2 }, { name: "Force and Hall", percent: 12.5 }, { name: "Ampz and Kronkleberry", percent: 4.2 }, { name: "DGM and Kronkleberry", percent: 4.2 }] },
  { id: 28, title: "Scariest Sweep Duo", group: "fortress", responses: 26, options: [{ name: "Ampz and Wolf", percent: 65.4 }, { name: "Ampz and Koala", percent: 23.1 }, { name: "Nelg and Deso", percent: 7.7 }, { name: "Olive and Deso", percent: 3.8 }] },
  { id: 29, title: "Fortress MVP", group: "fortress", responses: 26, options: [{ name: "Ampz", percent: 88.5 }, { name: "Kronkleberry", percent: 11.5 }, { name: "Force", percent: 0 }, { name: "Koala", percent: 0 }] },
  { id: 30, title: "Most Improved", group: "fortress", responses: 26, options: [{ name: "Sanity", percent: 38.5 }, { name: "Ugin", percent: 38.5 }, { name: "Morbit", percent: 11.5 }, { name: "Elis", percent: 11.5 }] },
  { id: 31, title: "Love Playing With Them", group: "sumo", responses: 27, options: [{ name: "Sanity", percent: 37 }, { name: "Johnny", percent: 29.6 }, { name: "Koala", percent: 18.5 }, { name: "Doov", percent: 11.1 }, { name: "Morbit", percent: 3.7 }] },
  { id: 32, title: "Hate Playing Against Them", group: "sumo", responses: 26, options: [{ name: "Apple", percent: 34.6 }, { name: "N", percent: 23.1 }, { name: "Johnny", percent: 23.1 }, { name: "Tj", percent: 19.2 }] },
  { id: 33, title: "Best Attacker", group: "sumo", responses: 28, options: [{ name: "Olive", percent: 46.4 }, { name: "Gazelle", percent: 21.4 }, { name: "Pizza", percent: 17.9 }, { name: "Ampz", percent: 7.1 }, { name: "Force", percent: 7.1 }] },
  { id: 34, title: "Best Defender", group: "sumo", responses: 28, options: [{ name: "Apple", percent: 35.7 }, { name: "N", percent: 25 }, { name: "Wolf", percent: 21.4 }, { name: "Noodles", percent: 17.9 }] },
  { id: 35, title: "Favorite TST Teammate", group: "sumo", responses: 28, options: [{ name: "Koala", percent: 35.7 }, { name: "N", percent: 25 }, { name: "Sanity", percent: 21.4 }, { name: "Doov", percent: 10.7 }, { name: "Morbit", percent: 7.1 }] },
  { id: 36, title: "Sumo MVP", group: "sumo", responses: 28, options: [{ name: "N", percent: 39.3 }, { name: "Apple", percent: 35.7 }, { name: "Wolf", percent: 14.3 }, { name: "Noodles", percent: 10.7 }] },
  { id: 37, title: "Most Improved", group: "sumo", responses: 27, options: [{ name: "Melon", percent: 44.4 }, { name: "Ugin", percent: 22.2 }, { name: "Sanity", percent: 18.5 }, { name: "Elis", percent: 11.1 }, { name: "Morbit", percent: 3.7 }] }
];
