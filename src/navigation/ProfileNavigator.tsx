import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import ProfileHomeScreen from '../screens/profile/ProfileHomeScreen';
import PlanListScreen from '../screens/profile/PlanListScreen';
import PlanDetailScreen from '../screens/profile/PlanDetailScreen';
import PlanCreatorScreen from '../screens/workouts/PlanCreatorScreen';
import AISuggestionsScreen from '../screens/profile/AISuggestionsScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import FriendsScreen from '../screens/profile/FriendsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} />
      <Stack.Screen name="PlanList" component={PlanListScreen} />
      <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
      <Stack.Screen name="PlanCreator" component={PlanCreatorScreen} />
      <Stack.Screen name="AISuggestions" component={AISuggestionsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
    </Stack.Navigator>
  );
}
