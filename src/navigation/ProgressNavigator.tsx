import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProgressStackParamList } from './types';
import ProgressHubScreen from '../screens/progress/ProgressHubScreen';
import PastSessionDetailScreen from '../screens/progress/PastSessionDetailScreen';
import ExerciseProgressDetailScreen from '../screens/progress/ExerciseProgressDetailScreen';

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export default function ProgressNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgressHub" component={ProgressHubScreen} />
      <Stack.Screen name="PastSessionDetail" component={PastSessionDetailScreen} />
      <Stack.Screen name="ExerciseProgressDetail" component={ExerciseProgressDetailScreen} />
    </Stack.Navigator>
  );
}
