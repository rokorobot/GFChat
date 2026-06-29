import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bot, Plus, Trash2, User } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/components/ui/use-toast';

export const AIConfigurationTab = () => {
  const { settings, updateSettings, addPersonality, deletePersonality, getCurrentPersonalityText, getPersonalityPrompts, selectPresetPersonality } = useSettings();
  const { toast } = useToast();
  const [isCreatingPersonality, setIsCreatingPersonality] = useState(false);
  const [newPersonalityName, setNewPersonalityName] = useState('');
  const [newPersonalityDescription, setNewPersonalityDescription] = useState('');

  if (!settings) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Configuration
        </CardTitle>
        <CardDescription>
          Customize your AI girlfriend's behavior and characteristics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personality Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">1</span>
            AI Personality
          </Label>
          
          {/* Default AI Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-primary" />
              <Label className="text-sm font-medium">Use Default AI</Label>
            </div>
            <Switch
              checked={settings.useDefaultAI}
              onCheckedChange={(checked) => updateSettings({ useDefaultAI: checked })}
            />
          </div>

          {!settings.useDefaultAI && (
            <div className="space-y-4">
              {/* Quick Personality Selection */}
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Quick Select Personality</Label>
                <Select onValueChange={(value) => selectPresetPersonality(value as keyof ReturnType<typeof getPersonalityPrompts>)}>
                  <SelectTrigger className="w-full bg-background border-border">
                    <SelectValue placeholder="Choose a preset personality..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border shadow-lg z-50">
                    {Object.entries(getPersonalityPrompts()).map(([name, description]) => (
                      <SelectItem key={name} value={name} className="hover:bg-accent">
                        <div>
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground">{String(description)}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Saved Personalities Dropdown */}
              {settings.savedPersonalities.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="personality-select" className="text-sm text-muted-foreground">
                    Select Customised Personality
                  </Label>
                  <Select 
                    value={settings.currentPersonality} 
                    onValueChange={(value) => updateSettings({ currentPersonality: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a personality" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.savedPersonalities.map((personality) => (
                        <SelectItem key={personality.id} value={personality.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{personality.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePersonality(personality.id);
                              }}
                              className="ml-2 h-6 w-6 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Create New Personality */}
              {!isCreatingPersonality && settings.savedPersonalities.length < 5 && (
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingPersonality(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Personality
                </Button>
              )}

              {/* New Personality Form */}
              {isCreatingPersonality && (
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="personality-name" className="text-sm text-muted-foreground">
                      Personality Name
                    </Label>
                    <Input
                      id="personality-name"
                      placeholder="E.g., Caring Sarah, Playful Emma"
                      value={newPersonalityName}
                      onChange={(e) => setNewPersonalityName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personality-description" className="text-sm text-muted-foreground">
                      Personality Description
                    </Label>
                    <Textarea
                      id="personality-description"
                      placeholder="E.g., Be caring, playful, and supportive. Show interest in my hobbies and always be encouraging..."
                      value={newPersonalityDescription}
                      onChange={(e) => setNewPersonalityDescription(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (newPersonalityName.trim() && newPersonalityDescription.trim()) {
                          const success = addPersonality(newPersonalityName.trim(), newPersonalityDescription.trim());
                          if (success) {
                            setNewPersonalityName('');
                            setNewPersonalityDescription('');
                            setIsCreatingPersonality(false);
                            toast({
                              title: "Personality Created",
                              description: "Your new AI personality has been saved!",
                            });
                          } else {
                            toast({
                              title: "Limit Reached",
                              description: "You can only have up to 5 personalities.",
                              variant: "destructive",
                            });
                          }
                        } else {
                          toast({
                            title: "Missing Information",
                            description: "Please provide both name and description.",
                            variant: "destructive",
                          });
                        }
                      }}
                      size="sm"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreatingPersonality(false);
                        setNewPersonalityName('');
                        setNewPersonalityDescription('');
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* AI Gender Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">2</span>
            AI Gender
          </Label>
          <div className="p-4 border rounded-lg">
            <RadioGroup
              value={settings.aiGender}
              onValueChange={(value) => updateSettings({ aiGender: value as 'male' | 'female', voiceType: value === 'male' ? 'onyx' : 'nova' })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="ai-male" />
                <Label htmlFor="ai-male" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Male
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="ai-female" />
                <Label htmlFor="ai-female" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Female
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <Separator />

        {/* Appearance Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">3</span>
            Appearance
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="avatar-style" className="text-sm text-muted-foreground">
                Avatar Style
              </Label>
              <Select value={settings.avatarStyle} onValueChange={(value) => updateSettings({ avatarStyle: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose avatar style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="artistic">Artistic</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme" className="text-sm text-muted-foreground">
                Chat Theme
              </Label>
              <Select value={settings.chatTheme} onValueChange={(value) => updateSettings({ chatTheme: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="romantic">Romantic</SelectItem>
                  <SelectItem value="playful">Playful</SelectItem>
                  <SelectItem value="elegant">Elegant</SelectItem>
                  <SelectItem value="cozy">Cozy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Voice Settings Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">4</span>
            Voice Settings
          </Label>
          <div className="space-y-4">
            {/* Voice Output Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔊</span>
                <Label className="text-sm font-medium">Voice Output</Label>
              </div>
              <Switch
                checked={settings.voiceOutput}
                onCheckedChange={(checked) => updateSettings({ voiceOutput: checked })}
              />
            </div>
            
            {/* Voice Type Selection - only show when voice output is enabled */}
            {settings.voiceOutput && (
              <div className="space-y-2">
                <Label htmlFor="voice-type" className="text-sm text-muted-foreground">
                  Voice Type
                </Label>
                <Select value={settings.voiceType} onValueChange={(value) => updateSettings({ voiceType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.aiGender === 'female' ? (
                      <>
                        <SelectItem value="nova">Nova - Bright & Energetic</SelectItem>
                        <SelectItem value="shimmer">Shimmer - Light & Airy</SelectItem>
                        <SelectItem value="alloy">Alloy - Neutral & Clear</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="onyx">Onyx - Deep & Confident</SelectItem>
                        <SelectItem value="echo">Echo - Smooth & Professional</SelectItem>
                        <SelectItem value="fable">Fable - Warm & Expressive</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};