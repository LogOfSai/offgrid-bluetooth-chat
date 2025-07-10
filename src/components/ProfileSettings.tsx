import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Edit3, Save, X, Smartphone, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  displayName: string;
  deviceName: string;
  avatarColor: string;
  avatarInitials: string;
}

export function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile>({
    displayName: 'Anonymous User',
    deviceName: `MeshChat_${Math.random().toString(36).substr(2, 4)}`,
    avatarColor: 'hsl(199, 95%, 55%)',
    avatarInitials: 'AU'
  });
  const [editing, setEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const { toast } = useToast();

  const avatarColors = [
    'hsl(199, 95%, 55%)', // Primary blue
    'hsl(263, 70%, 65%)', // Purple
    'hsl(142, 71%, 45%)', // Green
    'hsl(38, 92%, 50%)',  // Orange
    'hsl(0, 86%, 59%)',   // Red
    'hsl(280, 100%, 70%)', // Magenta
    'hsl(60, 100%, 50%)',  // Yellow
    'hsl(180, 100%, 50%)', // Cyan
  ];

  useEffect(() => {
    // Load profile from localStorage
    const savedProfile = localStorage.getItem('meshchat-profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      setTempProfile(parsed);
    }
  }, []);

  const saveProfile = () => {
    // Generate initials from display name
    const initials = tempProfile.displayName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2) || 'AU';

    const updatedProfile = {
      ...tempProfile,
      avatarInitials: initials
    };

    setProfile(updatedProfile);
    localStorage.setItem('meshchat-profile', JSON.stringify(updatedProfile));
    setEditing(false);

    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully.",
    });
  };

  const cancelEdit = () => {
    setTempProfile(profile);
    setEditing(false);
  };

  const updateTempProfile = (field: keyof UserProfile, value: string) => {
    setTempProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Customize how you appear to other MeshChat users
        </p>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Identity</span>
            {!editing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={saveProfile}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar 
              className="w-20 h-20 ring-2 ring-primary/20"
              style={{ backgroundColor: editing ? tempProfile.avatarColor : profile.avatarColor }}
            >
              <AvatarFallback 
                className="text-white font-bold text-lg"
                style={{ backgroundColor: editing ? tempProfile.avatarColor : profile.avatarColor }}
              >
                {editing ? tempProfile.avatarInitials : profile.avatarInitials}
              </AvatarFallback>
            </Avatar>

            {editing && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Avatar Color</Label>
                <div className="flex flex-wrap gap-2">
                  {avatarColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateTempProfile('avatarColor', color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        tempProfile.avatarColor === color
                          ? 'border-foreground scale-110'
                          : 'border-border hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            {editing ? (
              <Input
                id="displayName"
                value={tempProfile.displayName}
                onChange={(e) => updateTempProfile('displayName', e.target.value)}
                placeholder="Enter your display name"
                maxLength={20}
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{profile.displayName}</span>
              </div>
            )}
          </div>

          {/* Device Name */}
          <div className="space-y-2">
            <Label htmlFor="deviceName">Device Name</Label>
            {editing ? (
              <Input
                id="deviceName"
                value={tempProfile.deviceName}
                onChange={(e) => updateTempProfile('deviceName', e.target.value)}
                placeholder="Enter device name"
                maxLength={15}
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span>{profile.deviceName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security Info */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-success" />
            <span>Privacy & Security</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">End-to-End Encryption</span>
            <Badge variant="outline" className="border-success text-success">
              Enabled
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">No Internet Required</span>
            <Badge variant="outline" className="border-success text-success">
              Offline Mode
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Auto-Pairing</span>
            <Badge variant="outline" className="border-success text-success">
              BLE Direct
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
            Your messages are encrypted and sent directly between devices. 
            No data is stored on external servers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfileSettings;