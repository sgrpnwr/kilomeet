export type Activity = {
  id: string;
  type: 'RUN' | 'RIDE' | 'WALK';
  distance: number; // meters
  duration: number; // seconds
  startedAt: string;
  createdAt: string;
  userId: string;
  user: { id: string; name: string };
};