"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageCircle, 
  Search, 
  Clock,
  User,
  CheckCheck,
  Check,
  RefreshCw
} from 'lucide-react';
import { MobileLayout } from '@/components/mobile/mobile-layout';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserConversations, type Conversation } from '@/lib/message-store';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { withAuth } from '@/lib/auth-guard';

function MobileMessagesPage() {
  const router = useRouter();
  const { handleAsyncError } = useErrorHandler();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = async () => {
    await handleAsyncError(async () => {
      const userConversations = await getUserConversations();
      setConversations(userConversations);
    }, {
      title: 'Failed to load conversations',
      description: 'Please try refreshing the page'
    });
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.task_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? '1d' : `${diffInDays}d`;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'waiting_for_wysa':
        return 'bg-yellow-100 text-yellow-800';
      case 'wysa_accepted':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <MobileLayout title="Messages">
        <LoadingPage message="Loading your conversations..." />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Messages">
      <div className="flex flex-col h-full">
        {/* Search Header */}
        <div className="p-4 bg-white border-b border-gray-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No matching conversations' : 'No conversations yet'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start a conversation by posting a task or accepting one'
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => router.push('/mobile/create-task')}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Post a Task
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <Link
                  key={conversation.conversation_id}
                  href={`/mobile/messages/${conversation.task_id}?user=${conversation.other_user_id}`}
                  className="block"
                >
                  <Card className="mx-4 my-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={conversation.other_user_avatar || undefined} />
                            <AvatarFallback className="bg-teal-100 text-teal-600 font-semibold">
                              {conversation.other_user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.unread_count > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {conversation.other_user_name}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.last_message_at)}
                            </span>
                          </div>

                          <div className="mb-2">
                            <Badge className={`text-xs ${getStatusBadgeColor(conversation.task_status)}`}>
                              {getStatusLabel(conversation.task_status)}
                            </Badge>
                          </div>

                          <p className="text-sm font-medium text-gray-700 mb-1 truncate">
                            {conversation.task_title}
                          </p>

                          <p className="text-sm text-gray-600 truncate">
                            {conversation.last_message}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200">
          <p className="text-center text-xs text-gray-500">
            Messages are secure and private
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}

export default withAuth(MobileMessagesPage);