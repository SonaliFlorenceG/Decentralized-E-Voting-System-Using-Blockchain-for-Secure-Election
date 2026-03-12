export interface Candidate {
  id: number;
  name: string;
  partySymbol: string;
  voteCount: number;
}

export interface ElectionState {
  isActive: boolean;
  resultsPublished: boolean;
  candidates: Candidate[];
}