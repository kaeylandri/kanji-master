export type MissionPeriod = "daily" | "weekly" | "monthly";

export type MissionDefinition = {
  id: string;
  period: MissionPeriod;
  title: string;
  description: string;
  target: number;
  rewardExp: number;
  rewardCoins: number;
  eventType: string; // "kanji_correct", "kotoba_correct", "session_complete", "exam_complete"
};

export type MissionProgress = {
  missionId: string;
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
};