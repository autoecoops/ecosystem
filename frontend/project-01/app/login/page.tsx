import { AuthForm } from '@/components/auth/auth-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            machops
          </h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}