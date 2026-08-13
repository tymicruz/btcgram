import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isSignUp) {
      console.log('[auth] signing up...');
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        console.log('[auth] error', error.message);
        setErrorMsg(error.message);
      } else if (!data.session) {
        // signed up successfully, but email confirmation is required
        // before a session gets created - nothing to navigate to yet
        console.log('[auth] signed up, awaiting email confirmation');
        setSuccessMsg('Check your email to confirm your account, then log in.');
      }
      // if data.session does exist, we're already logged in - the
      // AuthContext's listener picks that up and navigates us away
    } else {
      console.log('[auth] logging in...');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.log('[auth] error', error.message);
        setErrorMsg(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>btcgram</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8b887f"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#8b887f"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      {successMsg && <Text style={styles.successText}>{successMsg}</Text>}

      <Pressable
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#111" />
        ) : (
          <Text style={styles.submitText}>{isSignUp ? 'Sign Up' : 'Log In'}</Text>
        )}
      </Pressable>

      <Pressable onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.toggleText}>
          {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#1c1b19',
    borderWidth: 1,
    borderColor: '#33312c',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  errorText: {
    color: '#ff6b5e',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    color: '#7fd88f',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleText: {
    color: '#8b887f',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});
