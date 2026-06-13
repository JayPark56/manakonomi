import { Text, type TextProps } from 'react-native';
import { colors, fonts } from '../theme';

type Weight = keyof typeof fonts;

interface ThemedTextProps extends TextProps {
  /** Paperlogy weight key. Defaults to regular (body). */
  weight?: Weight;
  size?: number;
  color?: string;
}

export function ThemedText({
  weight = 'regular',
  size = 16,
  color = colors.textPrimary,
  style,
  ...rest
}: ThemedTextProps) {
  // Paperlogy covers every supported language, so one family for all.
  return (
    <Text {...rest} style={[{ fontFamily: fonts[weight], fontSize: size, color }, style]} />
  );
}
