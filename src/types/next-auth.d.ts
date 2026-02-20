import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    role?: string;
    subscriptionStatus?: string;
    onboardingCompleted?: boolean;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      subscriptionStatus: string;
      onboardingCompleted: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    subscriptionStatus: string;
    onboardingCompleted: boolean;
  }
}
