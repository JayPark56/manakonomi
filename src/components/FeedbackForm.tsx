import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useT } from '../i18n/LanguageContext';
import { emailjsConfig, isEmailjsConfigured } from '../feedback/emailjsConfig';
import { colors, fonts, radius, spacing, typography } from '../theme';

type Status = 'idle' | 'sending' | 'success' | 'error';

export interface FeedbackController {
  open: boolean;
  setOpen: (v: boolean) => void;
  message: string;
  setMessage: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  status: Status;
  configured: boolean;
  canSend: boolean;
  send: () => void;
}

/**
 * Shared feedback state + send logic. Lifted into a hook so a single source of
 * truth backs BOTH render sites in SearchScreen (the results-list footer and the
 * bottom-anchored area), surviving the transition between them.
 */
export function useFeedbackController(): FeedbackController {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const configured = isEmailjsConfigured();
  const canSend = configured && status !== 'sending' && message.trim().length > 0;

  const send = useCallback(() => {
    if (!(configured && status !== 'sending' && message.trim().length > 0)) return;
    setStatus('sending');
    // Param names must match the EmailJS template variables: {{message}} / {{user_email}}.
    const params = { message: message.trim(), user_email: email.trim() };
    void (async () => {
      try {
        if (Platform.OS === 'web') {
          // @emailjs/browser is browser-targeted; lazy-imported off the startup path.
          const emailjs = (await import('@emailjs/browser')).default;
          await emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, params, {
            publicKey: emailjsConfig.publicKey,
          });
        } else {
          // On native the SDK reads browser-only globals (location.pathname), so
          // POST to the EmailJS REST API directly instead.
          const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              service_id: emailjsConfig.serviceId,
              template_id: emailjsConfig.templateId,
              user_id: emailjsConfig.publicKey,
              template_params: params,
            }),
          });
          if (!res.ok) throw new Error(`EmailJS HTTP ${res.status}`);
        }
        setStatus('success');
        setMessage('');
        setEmail('');
      } catch (err) {
        console.warn('[feedback] send failed:', err);
        setStatus('error'); // message kept so it isn't lost
      }
    })();
  }, [configured, status, message, email]);

  return { open, setOpen, message, setMessage, email, setEmail, status, configured, canSend, send };
}

/**
 * Bottom-of-Search feedback entry: a subtle button that expands into a small
 * EmailJS-backed form. Degrades gracefully when EmailJS is unconfigured (send
 * disabled + a "coming soon" note). State lives in the passed controller.
 */
export function FeedbackForm({ controller }: { controller: FeedbackController }) {
  const tr = useT();
  const { open, setOpen, message, setMessage, email, setEmail, status, configured, canSend, send } =
    controller;

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.openButton, pressed && styles.openButtonPressed]}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.accent} />
        <ThemedText weight="semiBold" size={typography.label} color={colors.accent}>
          {tr('feedbackOpen')}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <View style={styles.form}>
      <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary}>
        {tr('feedbackPrompt')}
      </ThemedText>

      <TextInput
        style={[styles.input, styles.messageInput]}
        value={message}
        onChangeText={setMessage}
        placeholder={tr('feedbackMessagePlaceholder')}
        placeholderTextColor={colors.textPlaceholder}
        multiline
        textAlignVertical="top"
      />
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder={tr('feedbackEmailPlaceholder')}
        placeholderTextColor={colors.textPlaceholder}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />

      {status === 'success' && (
        <ThemedText weight="medium" size={typography.caption} color={colors.accent}>
          {tr('feedbackSuccess')}
        </ThemedText>
      )}
      {status === 'error' && (
        <ThemedText weight="medium" size={typography.caption} color={colors.favorite}>
          {tr('feedbackError')}
        </ThemedText>
      )}
      {!configured && (
        <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary}>
          {tr('feedbackNotReady')}
        </ThemedText>
      )}

      <Pressable
        onPress={send}
        disabled={!canSend}
        style={({ pressed }) => [
          styles.sendButton,
          !canSend && styles.sendButtonDisabled,
          pressed && canSend && styles.sendButtonPressed,
        ]}
      >
        {status === 'sending' ? (
          <ActivityIndicator color={colors.onAccent} />
        ) : (
          <ThemedText weight="bold" size={typography.label} color={colors.onAccent}>
            {tr('feedbackSend')}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  openButtonPressed: {
    opacity: 0.6,
  },
  form: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: typography.label,
    color: colors.textPrimary,
  },
  messageInput: {
    minHeight: 88,
  },
  sendButton: {
    height: 48,
    borderRadius: radius,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonPressed: {
    opacity: 0.85,
  },
});
