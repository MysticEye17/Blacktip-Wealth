import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import Card from '../components/Card';
import Field from '../components/Field';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function continueToPayment() {
    if (!email || !password || (mode === 'signup' && !name)) {
      Alert.alert('Missing info', 'Add the required account details to continue.');
      return;
    }

    navigation.navigate('Payment', { email });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.brandRow}>
        <Image source={require('../../assets/blacktip-logo-official.png')} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.replace('Welcome')}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.layout}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>Website access</Text>
          <Text style={styles.title}>Create your Blacktip Wealth account.</Text>
          <Text style={styles.text}>Save your planning profile, unlock the full action plan, and keep your 99-cent purchase attached to your email.</Text>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.segment}>
            <TouchableOpacity style={[styles.segmentButton, mode === 'signup' && styles.segmentActive]} onPress={() => setMode('signup')}>
              <Text style={[styles.segmentText, mode === 'signup' && styles.segmentTextActive]}>Sign up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentButton, mode === 'login' && styles.segmentActive]} onPress={() => setMode('login')}>
              <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>Log in</Text>
            </TouchableOpacity>
          </View>

          {mode === 'signup' ? <Field label="Name" value={name} keyboardType="default" onChangeText={setName} /> : null}
          <Field label="Email" value={email} keyboardType="email-address" autoCapitalize="none" onChangeText={setEmail} />
          <Field label="Password" value={password} keyboardType="default" secureTextEntry onChangeText={setPassword} />

          <TouchableOpacity style={styles.primaryButton} onPress={continueToPayment}>
            <Text style={styles.primaryText}>{mode === 'signup' ? 'Create account' : 'Log in'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.replace('Main')}>
            <Text style={styles.secondaryText}>Preview without account</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { minHeight: '100%', padding: 24, paddingTop: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18 },
  logo: { width: 144, height: 58 },
  backButton: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF' },
  backText: { color: theme.colors.deepBlue, fontWeight: '900' },
  layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 22, alignItems: 'center', marginTop: 44 },
  copy: { flex: 1, minWidth: 280 },
  kicker: { color: theme.colors.primary, fontWeight: '900', textTransform: 'uppercase', marginBottom: 10 },
  title: { color: theme.colors.secondary, fontSize: 44, lineHeight: 50, fontWeight: '900' },
  text: { color: theme.colors.text, fontSize: 18, lineHeight: 28, marginTop: 14, maxWidth: 620 },
  formCard: { flex: 1, minWidth: 300, maxWidth: 520 },
  segment: { flexDirection: 'row', backgroundColor: theme.colors.panel, borderRadius: 8, padding: 4, marginBottom: 16 },
  segmentButton: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  segmentActive: { backgroundColor: '#FFFFFF' },
  segmentText: { color: theme.colors.muted, fontWeight: '900' },
  segmentTextActive: { color: theme.colors.deepBlue },
  primaryButton: { backgroundColor: theme.colors.deepBlue, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 6 },
  primaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  secondaryButton: { padding: 15, alignItems: 'center' },
  secondaryText: { color: theme.colors.primary, fontWeight: '900' },
});
