import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Shield, Zap, Users } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    google: any;
    handleCredentialResponse: (response: any) => void;
  }
}

const Login: React.FC = () => {
  const { login, loginDev, isLoading } = useAuth();
  const [devEmail, setDevEmail] = useState('');
  const [devName, setDevName] = useState('');
  const [isDevMode, setIsDevMode] = useState(false);

  // Check if we're in development mode
  useEffect(() => {
    setIsDevMode(import.meta.env.DEV || import.meta.env.MODE === 'development');
  }, []);

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render the sign-in button
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
          }
        );
      }
    };

    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      await login(response.credential);
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  // Make handleCredentialResponse available globally
  useEffect(() => {
    window.handleCredentialResponse = handleCredentialResponse;
    return () => {
      delete window.handleCredentialResponse;
    };
  }, []);

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      await loginDev(devEmail.trim(), devName.trim() || undefined);
    } catch (error) {
      console.error('Development login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and features */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Email Dispatcher</h1>
            </div>
            <p className="text-xl text-gray-600">
              Intelligent email delivery platform with multi-provider support and advanced analytics.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Lightning Fast</h3>
                <p className="text-gray-600">Send thousands of emails in seconds with our optimized delivery system.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure & Reliable</h3>
                <p className="text-gray-600">Enterprise-grade security with 99.9% uptime guarantee.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Multi-Provider</h3>
                <p className="text-gray-600">Automatic failover across multiple email service providers.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Sign-In Button */}
              <div className="space-y-2">
                <div id="google-signin-button" className="w-full"></div>
              </div>

              {/* Development Login (only in dev mode) */}
              {isDevMode && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Development Mode
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleDevLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dev-email">Email</Label>
                      <Input
                        id="dev-email"
                        type="email"
                        placeholder="dev@example.com"
                        value={devEmail}
                        onChange={(e) => setDevEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dev-name">Name (optional)</Label>
                      <Input
                        id="dev-name"
                        type="text"
                        placeholder="Developer Name"
                        value={devName}
                        onChange={(e) => setDevName(e.target.value)}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      variant="outline"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : 'Dev Login'}
                    </Button>
                  </form>
                </>
              )}

              <div className="text-center text-sm text-gray-600">
                <p>
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
