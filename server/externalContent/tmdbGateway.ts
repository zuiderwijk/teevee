export type TmdbMovieIdentityCandidate = {
  id: string;
  title: string;
  originalTitle: string;
  alternativeTitles: string[];
  releaseYear: number | null;
  directors: string[];
  cast: string[];
};

export type TmdbSeriesIdentityCandidate = {
  id: string;
  name: string;
  originalName: string;
  alternativeTitles: string[];
  cast: string[];
};

export type TmdbDirectedMovieCredit = {
  id: string;
  releaseYear: number | null;
};

export interface TmdbGateway {
  searchMovieIds(query: string): Promise<string[]>;
  getMovie(id: string): Promise<TmdbMovieIdentityCandidate>;
  getDirectedMovieCredits(directorName: string): Promise<TmdbDirectedMovieCredit[]>;
  searchSeriesIds(query: string): Promise<string[]>;
  getSeries(id: string): Promise<TmdbSeriesIdentityCandidate>;
  seriesHasEpisode(seriesId: string, seasonNumber: number, episodeNumber: number): Promise<boolean>;
}
