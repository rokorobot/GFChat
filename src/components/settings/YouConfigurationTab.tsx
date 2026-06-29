import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Volume2, Mic, User, Calendar } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/useSettings';

export const YouConfigurationTab = () => {
  const { settings, updateSettings } = useSettings();

  if (!settings) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          You Configuration
        </CardTitle>
        <CardDescription>
          Customize your personal preferences and interaction settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Age Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">1</span>
            Age
          </Label>
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <Label className="text-sm font-medium">Your Age: {settings.age}</Label>
            </div>
            <Slider
              value={[settings.age]}
              onValueChange={(value) => updateSettings({ age: value[0] })}
              min={13}
              max={80}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>13</span>
              <span>80</span>
            </div>
          </div>
        </div>

        {/* Gender Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">2</span>
            Gender
          </Label>
          <div className="p-4 border rounded-lg">
            <RadioGroup
              value={settings.gender}
              onValueChange={(value) => updateSettings({ gender: value as 'male' | 'female' })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {settings.age < 18 ? 'Boy' : 'Male'}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {settings.age < 18 ? 'Girl' : 'Female'}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Voice Input Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">3</span>
            Voice Input
          </Label>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-primary" />
              <Label className="text-sm font-medium">Enable Voice Input</Label>
            </div>
            <Switch
              checked={settings.voiceInput}
              onCheckedChange={(checked) => updateSettings({ voiceInput: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};