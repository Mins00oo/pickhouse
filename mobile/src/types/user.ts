export interface User {
  id: string;
  email?: string;
  nickname?: string;
  authProviders: {
    apple?: string;
    kakao?: string;
  };
  createdAt: string;
}
