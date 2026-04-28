import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../store/sessionStore';
import type { MainTabParamList } from './types';
import DashboardNavigator from './DashboardNavigator';
import WorkoutsNavigator from './WorkoutsNavigator';
import ProgressNavigator from './ProgressNavigator';
import ProfileNavigator from './ProfileNavigator';
import SessionMiniBanner from '../components/session/SessionMiniBanner';
import ExercisePickerSheet from '../components/sheets/ExercisePickerSheet';
import ExerciseDetailSheet from '../components/sheets/ExerciseDetailSheet';
import CreateWorkoutChooserSheet from '../components/sheets/CreateWorkoutChooserSheet';
import RestTimerSheet from '../components/sheets/RestTimerSheet';
import PlateCalculatorSheet from '../components/sheets/PlateCalculatorSheet';
import SessionActionSheet from '../components/sheets/SessionActionSheet';
import PRCelebrationModal from '../components/sheets/PRCelebrationModal';
import XPLevelUpModal from '../components/sheets/XPLevelUpModal';
import SessionSummaryModal from '../components/sheets/SessionSummaryModal';
import { useUIStore } from '../store/uiStore';
import { colors } from '../constants/colors';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabBarStyle = {
  backgroundColor: colors.surfaceContainerLow,
  borderTopColor: colors.outlineVariant,
  borderTopWidth: StyleSheet.hairlineWidth,
  height: 60,
};


function workoutsTabBarStyle(route: Parameters<typeof getFocusedRouteNameFromRoute>[0]) {
  return getFocusedRouteNameFromRoute(route) === 'ActiveSession'
    ? { display: 'none' as const }
    : tabBarStyle;
}

function GlobalOverlays() {
  const activeOverlay = useUIStore(state => state.activeOverlay);
  return (
    <>
      {activeOverlay === 'exercisePicker' && <ExercisePickerSheet />}
      {activeOverlay === 'exerciseDetail' && <ExerciseDetailSheet />}
      {activeOverlay === 'createWorkoutChooser' && <CreateWorkoutChooserSheet />}
      {activeOverlay === 'restTimer' && <RestTimerSheet />}
      {activeOverlay === 'plateCalculator' && <PlateCalculatorSheet />}
      {activeOverlay === 'sessionAction' && <SessionActionSheet />}
      {activeOverlay === 'prCelebration' && <PRCelebrationModal />}
      {activeOverlay === 'xpLevelUp' && <XPLevelUpModal />}
      {activeOverlay === 'sessionSummary' && <SessionSummaryModal />}
    </>
  );
}

export default function MainNavigator() {
  const fetchActiveSession = useSessionStore(s => s.fetchActiveSession);

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
        }}
      >
        <Tab.Screen
          name="DashboardTab"
          component={DashboardNavigator}
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
          }}
        />
        <Tab.Screen
          name="WorkoutsTab"
          component={WorkoutsNavigator}
          options={({ route }) => ({
            title: 'Workouts',
            tabBarStyle: workoutsTabBarStyle(route),
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={22} color={color} />
            ),
          })}
        />
        <Tab.Screen
          name="ProgressTab"
          component={ProgressNavigator}
          options={{
            title: 'Progress',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileNavigator}
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <SessionMiniBanner />
      <GlobalOverlays />
    </View>
  );
}
