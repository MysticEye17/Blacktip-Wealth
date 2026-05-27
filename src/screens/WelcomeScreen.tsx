import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.badge}>DecisionEngine</Text>
      <Text style={styles.title}>A personal financial decision engine for young adults.</Text>
      <Text style={styles.copy}>
        Enter as much or as little detail as you want. The app turns your profile into simple money moves for cash, debt, investing, taxes, insurance, marriage, housing, and long-term planning.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.replace('Main')}>
        <Text style={styles.buttonText}>Start planning</Text>
      </TouchableOpacity>
      <Text style={styles.disclaimer}>Educational planning only. Not tax, legal, investment, or insurance advice.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.primaryLight, padding: 26, justifyContent: 'center' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#fff', color: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, fontWeight: '900', marginBottom: 20 },
  title: { fontSize: 38, lineHeight: 44, fontWeight: '900', color: theme.colors.secondary, marginBottom: 18 },
  copy: { color: theme.colors.text, fontSize: 17, lineHeight: 26, marginBottom: 26 },
  button: { backgroundColor: theme.colors.primary, borderRadius: 18, padding: 17, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  disclaimer: { color: theme.colors.muted, marginTop: 18, lineHeight: 20 },
});
