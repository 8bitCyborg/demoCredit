export class UserService {
  async getProfile(userId: string) {
    return {
      id: userId,
      name: 'Demo User',
      email: 'user@example.com',
      createdAt: new Date().toISOString()
    };
  }
}

export const userService = new UserService();
