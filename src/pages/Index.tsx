import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart, LogOut, Settings, MessageCircle } from 'lucide-react';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    // Don't redirect if still loading auth state or if there's an access token in the URL
    const hasAccessToken = window.location.hash.includes('access_token=');
    
    if (!isLoading && !isAuthenticated && !hasAccessToken) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Show loading state while checking auth or processing access token from URL
  const hasAccessToken = window.location.hash.includes('access_token=');
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-chat flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated && !hasAccessToken) {
    return (
      <div className="min-h-screen bg-gradient-chat flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome to GF.Chat
          </h1>
          <p className="text-muted-foreground">Please sign in to continue</p>
          <Button onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated && hasAccessToken) {
    return (
      <div className="min-h-screen bg-gradient-chat flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Verifying your account...
          </h1>
          <p className="text-muted-foreground">Please wait while we confirm your email</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/settings')}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
      <ChatInterface onFeedbackClick={() => setFeedbackOpen(true)} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
};

export default Index;
