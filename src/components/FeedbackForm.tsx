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
  nickname: string;
  setNickname: (v: string) => void;
  status: Status;
  configured: boolean;
  canSend: boolean;
  send: () => void;
  close: () => void;
}

/**
 * Shared feedback state + send logic. Lifted into a hook so a single source of
 * truth backs BOTH render sites in SearchScreen (the results-list footer and the
 * bottom-anchored area), surviving the transition between them.
 */
export function useFeedbackController(): FeedbackController {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const configured = isEmailjsConfigured();
  const canSend = configured && status !== 'sending' && message.trim().length > 0;

  const close = useCallback(() => {
    setOpen(false);
    setMessage('');
    setNickname('');
    setStatus('idle');
  }, []);

  const send = useCallback(() => {
    if (!(configured && status !== 'sending' && message.trim().length > 0)) return;
    setStatus('sending');
    // Param names must match the EmailJS template variables: {{message}} / {{nickname}}.
    const params = { message: message.trim(), nickname: nickname.trim() };
    console.log(
      '[feedback] sending via EmailJS',
      { serviceId: emailjsConfig.serviceId, templateId: emailjsConfig.templateId },
      'params:',
      params,
    );
    void (async () => {
      try {
        if (Platform.OS === 'web') {
          // @emailjs/browser is browser-targeted; lazy-imported off the startup path.
          const emailjs = (await import('@emailjs/browser')).default;
          const res = await emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, params, {
            publicKey: emailjsConfig.publicKey,
          });
          console.log('[feedback] EmailJS send ok:', res.status, res.text);
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
          const body = await res.text();
          if (!res.ok) throw new Error(`EmailJS HTTP ${res.status}: ${body}`);
          console.log('[feedback] EmailJS REST ok:', body);
        }
        setStatus('success');
        setMessage('');
        setNickname('');
      } catch (err) {
        // EmailJS errors are { status, text } objects, not Error instances —
        // surface the real reason (e.g. 412 Gmail scope) so failures aren't silent.
        const detail =
          err && typeof err === 'object' && 'text' in err
            ? `${(err as { status?: number }).status ?? '?'} ${(err as { text?: string }).text ?? ''}`
            : String(err);
        console.warn('[feedback] send failed:', detail, err);
        setStatus('error'); // message kept so it isn't lost
      }
    })();
  }, [configured, status, message, nickname]);

  return {
    open,
    setOpen,
    message,
    setMessage,
    nickname,
    setNickname,
    status,
    configured,
    canSend,
    send,
    close,
  };
}

/**
 * Bottom-of-Search feedback entry: a subtle button that expands into a small
 * EmailJS-backed form with a close (X). Degrades gracefully when EmailJS is
 * unconfigured (send disabled + a "coming soon" note). State lives in the
 * passed controller.
 */
export function FeedbackForm({ controller }: { controller: FeedbackController }) {
  const tr = useT();
  const {
    open,
    setOpen,
    message,
    setMessage,
    nickname,
    setNickname,
    status,
    configured,
    canSend,
    send,
    close,
  } = controller;

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
      <View style={styles.formHeader}>
        <ThemedText weight="medium" size={typography.caption} color={colors.textSecondary} style={styles.prompt}>
          {tr('feedbackPrompt')}
        </ThemedText>
        <Pressable
          onPress={close}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={tr('a11yClose')}
          testID="feedback-close"
        >
          {({ pressed }) => (
            <Ionicons name="close" size={22} color={pressed ? colors.accent : colors.textSecondary} />
          )}
        </Pressable>
      </View>

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
        value={nickname}
        onChangeText={setNickname}
        placeholder={tr('feedbackNicknamePlaceholder')}
        placeholderTextColor={colors.textPlaceholder}
        autoCapitalize="none"
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
  formHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  prompt: {
    flex: 1,
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
