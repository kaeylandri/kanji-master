// utils/battleTypes.ts

export type BattleMode = 'kanji' | 'kotoba' | 'random';
export type BattleStatus = 'waiting' | 'countdown' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface BattleMatch {
  id: string;
  mode: BattleMode;
  status: BattleStatus;
  created_by: string;
  started_at: string | null;
  ends_at: string | null;
  remaining_ms: number | null;
  paused_at: string | null;
  pause_count: number;
  total_paused_ms: number;
  completed_at: string | null;
  winner_id: string | null;
  result_type: 'win' | 'draw' | 'cancelled' | null;
}

export interface BattleParticipant {
  id: string;
  match_id: string;
  user_id: string;
  score: number;
  correct_count: number;
  wrong_count: number;
  status: 'waiting' | 'ready' | 'active' | 'disconnected' | 'forfeited' | 'completed';
  profiles?: { // Join data
    username: string;
    avatar_url: string;
  };
}

export interface BattleQuestion {
  id: string;
  match_id: string;
  question_order: number;
  item_type: 'kanji' | 'kotoba';
  item_id: number;
  question_text: string;
  options: string[];
  // correct_answer TIDAK ADA di interface ini karena tidak dikirim ke client
}