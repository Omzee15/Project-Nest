import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Function to decode JWT token and check expiration
  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  };

  // Function to clear authentication data
  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          // Verify user data is valid
          JSON.parse(user);
          
          // Check if token is still valid
          if (isTokenValid(token)) {
            setIsAuthenticated(true);
          } else {
            console.log('Token expired, clearing auth data');
            clearAuthData();
            setIsAuthenticated(false);
            
            // Show toast only if not already on login page
            if (window.location.pathname !== '/login') {
              toast({
                title: "Session Expired",
                description: "Your session has expired. Please login again.",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error('Invalid user data:', error);
          clearAuthData();
          setIsAuthenticated(false);
          
          if (window.location.pathname !== '/login') {
            toast({
              title: "Authentication Error",
              description: "Invalid session data. Please login again.",
              variant: "destructive",
            });
          }
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    
    // Set up interval to periodically check token validity
    const interval = setInterval(checkAuth, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;