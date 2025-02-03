export interface Exercise {
  id: number;
  name: string;
  category: string;
  duration: number;
  caloriesBurned: number;
  date: string;
  user_id?: number;
}