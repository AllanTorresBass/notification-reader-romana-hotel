import { Text, type TextProps } from 'react-native';

import { fonts } from '@/constants/theme';

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: fonts.mono }]} />;
}
