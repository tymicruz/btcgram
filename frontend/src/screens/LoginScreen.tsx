import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // harmless no-op on iOS - this check matters once Android's added
      await GoogleSignin.hasPlayServices();

      console.log('[auth] starting Google sign-in...');
      const response = await GoogleSignin.signIn();

      if (response.type !== 'success' || !response.data.idToken) {
        console.log('[auth] Google sign-in cancelled or returned no token');
        return;
      }

      console.log('[auth] got Google ID token, signing in to Supabase...');
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
      });

      if (error) {
        console.log('[auth] Supabase error', error.message);
        setErrorMsg(error.message);
      }
      // on success, AuthContext's listener picks up the new session and
      // navigates us away, same as email/password
    } catch (err) {
      console.log('[auth] Google sign-in error', err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
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

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={[styles.googleButton, loading && styles.submitButtonDisabled]}
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        <Text style={styles.googleText}>Continue with Google</Text>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#33312c',
  },
  dividerText: {
    color: '#8b887f',
    fontSize: 13,
    marginHorizontal: 10,
  },
  googleButton: {
    backgroundColor: '#1c1b19',
    borderWidth: 1,
    borderColor: '#33312c',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  googleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
