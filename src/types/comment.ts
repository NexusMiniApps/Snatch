export interface Comment {
  id: string;
  username: string;
  profilePictureUrl?: string;
  comment: string;
  tags: string[];
  score?: number;
}
