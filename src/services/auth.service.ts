export class AuthService {
  async signup(body: any) {
    try {
      const response = await fetch(`https://adjutor.lendsqr.com/v2/verification/karma/${body.bvn}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.APP_SECRET}`
        }
      });
      const data = await response.json();
      console.log('Karma Verification Response:', data);
    } catch (error) {
      console.error('Karma Verification Error:', error);
    }

    return {
      id: body.id,
      name: `${body.first_name} ${body.last_name}`,
      email: body.email,
      createdAt: new Date().toISOString(),
      bvn: body.bvn,
    };
  };

  async login(body: any) {
    return {
      id: body.id,
      name: 'Demo User',
      email: 'user@example.com',
      createdAt: new Date().toISOString()
    };
  };
};

export const authService = new AuthService();
