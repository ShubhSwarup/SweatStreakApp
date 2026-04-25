import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { WorkoutsStackParamList } from './types';
import WorkoutHubScreen from '../screens/workouts/WorkoutHubScreen';
import TemplateDetailScreen from '../screens/workouts/TemplateDetailScreen';
import ActiveSessionScreen from '../screens/workouts/ActiveSessionScreen';
import TemplateCreatorScreen from '../screens/workouts/TemplateCreatorScreen';
import PlanCreatorScreen from '../screens/workouts/PlanCreatorScreen';

const Stack = createNativeStackNavigator<WorkoutsStackParamList>();

export default function WorkoutsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutHub" component={WorkoutHubScreen} />
      <Stack.Screen name="TemplateDetail" component={TemplateDetailScreen} />
      <Stack.Screen
        name="ActiveSession"
        component={ActiveSessionScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="TemplateCreator" component={TemplateCreatorScreen} />
      <Stack.Screen name="PlanCreator" component={PlanCreatorScreen} />
    </Stack.Navigator>
  );
}
