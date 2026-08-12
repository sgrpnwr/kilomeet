import { router, Tabs } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GlassTabBar } from '@/components/ui/GlassTabBar';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen
        name="record"
        options={{ title: 'Record' }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // stop it from switching to the empty placeholder tab
            router.push('/track'); // go to the real GPS tracking screen instead
          },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}