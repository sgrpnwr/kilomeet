export type Activity = {
  id: string;
  type: 'RUN' | 'RIDE' | 'WALK';
  distance: number;
  duration: number;
  startedAt: string;
  createdAt: string;
  userId: string;
  user: { id: string; name: string };
  kudosCount: number;
  commentCount: number;
  hasGivenKudos: boolean;
};

export type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string };
};