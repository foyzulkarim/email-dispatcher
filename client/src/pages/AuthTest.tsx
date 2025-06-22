import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Loader2, User, Shield, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const AuthTest: React.FC = () => {
  const { user, token, isAuthenticated, refreshToken } = useAuth();
  const { get, post } = useApi();
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  const runAuthTests = async () => {
    setIsRunningTests(true);
    const results: Record<string, any> = {};

    try {
      // Test 1: Get current user
      console.log('Testing: Get current user...');
      try {
        const response = await get('/auth/me');
        const data = await response.json();
        results.getCurrentUser = {
          success: response.ok,
          data: data,
          status: response.status
        };
      } catch (error) {
        results.getCurrentUser = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 2: Verify token
      console.log('Testing: Verify token...');
      try {
        const response = await get('/auth/verify');
        const data = await response.json();
        results.verifyToken = {
          success: response.ok,
          data: data,
          status: response.status
        };
      } catch (error) {
        results.verifyToken = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 3: Get user-specific data (if user exists)
      if (user) {
        console.log('Testing: Get user jobs...');
        try {
          const response = await get(`/email/${user.id}/jobs?limit=5`);
          const data = await response.json();
          results.getUserJobs = {
            success: response.ok,
            data: data,
            status: response.status
          };
        } catch (error) {
          results.getUserJobs = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }

        console.log('Testing: Get user providers...');
        try {
          const response = await get(`/user-provider/${user.id}`);
          const data = await response.json();
          results.getUserProviders = {
            success: response.ok,
            data: data,
            status: response.status
          };
        } catch (error) {
          results.getUserProviders = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      // Test 4: Test unauthorized endpoint (should fail gracefully)
      console.log('Testing: Unauthorized access...');
      try {
        const response = await get('/auth/me', { requireAuth: false });
        results.unauthorizedAccess = {
          success: response.status === 401,
          status: response.status,
          note: 'Should return 401 when no auth header'
        };
      } catch (error) {
        results.unauthorizedAccess = {
          success: true,
          note: 'Correctly blocked unauthorized access'
        };
      }

      setTestResults(results);
      toast.success('Authentication tests completed');
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Test execution failed');
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      await refreshToken();
      toast.success('Token refreshed successfully');
    } catch (error) {
      toast.error('Token refresh failed');
    }
  };

  const TestResult: React.FC<{ title: string; result: any }> = ({ title, result }) => {
    if (!result) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span className="font-medium">{title}</span>
          {result.status && (
            <Badge variant={result.success ? "default" : "destructive"}>
              {result.status}
            </Badge>
          )}
        </div>
        {result.error && (
          <p className="text-sm text-red-600 ml-6">{result.error}</p>
        )}
        {result.note && (
          <p className="text-sm text-gray-600 ml-6">{result.note}</p>
        )}
        {result.data && (
          <details className="ml-6">
            <summary className="text-sm text-gray-600 cursor-pointer">View Response</summary>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Authentication Test Page</h1>
        <p className="text-gray-600">Test and verify authentication functionality</p>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Authentication Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? "Authenticated" : "Not Authenticated"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Token Present</p>
              <Badge variant={token ? "default" : "secondary"}>
                {token ? "Yes" : "No"}
              </Badge>
            </div>
          </div>

          {user && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  <span>User Information</span>
                  {user.role === 'admin' && (
                    <Badge variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><strong>Name:</strong> {user.name}</div>
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>ID:</strong> {user.id}</div>
                  <div><strong>Role:</strong> {user.role}</div>
                </div>
              </div>
            </>
          )}

          {token && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Token Information</h4>
                <div className="text-sm">
                  <div><strong>Length:</strong> {token.length} characters</div>
                  <div><strong>Preview:</strong> {token.substring(0, 50)}...</div>
                </div>
                <Button
                  onClick={handleRefreshToken}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Token
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* API Tests */}
      <Card>
        <CardHeader>
          <CardTitle>API Authentication Tests</CardTitle>
          <CardDescription>
            Test various authenticated API endpoints to verify the authentication system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runAuthTests}
            disabled={!isAuthenticated || isRunningTests}
            className="w-full"
          >
            {isRunningTests ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Authentication Tests'
            )}
          </Button>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-4">
              <Separator />
              <h4 className="font-medium">Test Results</h4>
              <div className="space-y-3">
                <TestResult title="Get Current User" result={testResults.getCurrentUser} />
                <TestResult title="Verify Token" result={testResults.verifyToken} />
                <TestResult title="Get User Jobs" result={testResults.getUserJobs} />
                <TestResult title="Get User Providers" result={testResults.getUserProviders} />
                <TestResult title="Unauthorized Access Test" result={testResults.unauthorizedAccess} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Development Info */}
      {import.meta.env.DEV && (
        <Card>
          <CardHeader>
            <CardTitle>Development Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>API URL:</strong> {import.meta.env.VITE_API_URL}</div>
            <div><strong>Google Client ID:</strong> {import.meta.env.VITE_GOOGLE_CLIENT_ID || 'Not configured'}</div>
            <div><strong>Environment:</strong> {import.meta.env.MODE}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuthTest;
