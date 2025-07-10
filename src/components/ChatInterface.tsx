import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Shield, AlertTriangle, ArrowLeft, Smartphone } from 'lucide-react';
import { ChatDevice, ChatMessage, bluetoothService } from '@/services/bluetoothService';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  device: ChatDevice;
  onBack: () => void;
}

export function ChatInterface({ device, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Start listening for messages from this device
    bluetoothService.startMessageListener(device.id, (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    return () => {
      // Cleanup listener when component unmounts
    };
  }, [device.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      setModerationWarning(null);

      // Check content moderation
      const moderation = await bluetoothService.checkContentModeration(newMessage);
      if (moderation.flagged) {
        setModerationWarning(moderation.reason || 'Content flagged for review');
        return;
      }

      const success = await bluetoothService.sendMessage(device.id, newMessage);

      if (success) {
        // Add sent message to our local messages
        const sentMessage: ChatMessage = {
          id: Date.now().toString(),
          deviceId: device.id,
          message: newMessage,
          timestamp: new Date(),
          sent: true,
          encrypted: true,
        };
        
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        scrollToBottom();
        
        toast({
          title: "Message Sent",
          description: "Your encrypted message has been delivered.",
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Could not send message. Please check connection.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const dismissModerationWarning = () => {
    setModerationWarning(null);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-gradient-card border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            
            <div>
              <h2 className="font-semibold">{device.name}</h2>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${device.connected ? 'border-success text-success' : 'border-destructive text-destructive'}`}
                >
                  {device.connected ? 'Connected' : 'Disconnected'}
                </Badge>
                <Shield className="h-3 w-3 text-success" />
                <span className="text-xs text-success">Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Moderation Warning */}
      {moderationWarning && (
        <Alert className="m-4 border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-warning">{moderationWarning}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissModerationWarning}
              className="text-warning hover:text-warning/80"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No messages yet. Start a secure conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-message ${
                    message.sent
                      ? 'bg-message-sent text-message-sent-foreground ml-12'
                      : 'bg-message-received text-message-received-foreground mr-12'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <div className="flex items-center justify-end space-x-1 mt-2 opacity-70">
                    {message.encrypted && (
                      <Shield className="h-3 w-3" />
                    )}
                    <span className="text-xs">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 bg-gradient-card border-t border-border/50">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your encrypted message..."
            disabled={!device.connected || sending}
            className="flex-1 bg-input/50 border-border/50 focus:border-primary/50"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !device.connected || sending}
            variant="default"
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {!device.connected && (
          <p className="text-xs text-destructive mt-2 text-center">
            Device disconnected. Messages cannot be sent.
          </p>
        )}
      </div>
    </div>
  );
}