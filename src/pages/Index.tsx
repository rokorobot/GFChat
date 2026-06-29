import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useAuth } from '@/context/AuthContext';
import { Heart } from 'lucide-react';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';

const Index = () => {
  console.log("[GF.Chat] Chat route render");
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    // Don't redirect if still loading auth state or if there's an access token in the URL
    const hasAccessToken = window.location.hash.includes('access_token=');
    
    if (!isLoading && !isAuthenticated && !hasAccessToken) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking auth
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
    return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>GF.Chat redirecting to login...</div>;
  }

  return (
    <>
      <ChatInterface onFeedbackClick={() => setFeedbackOpen(true)} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
};

export default Index;
