import '@testing-library/jest-native/extend-expect';

jest.mock('lucide-react-native', () => {
  const React = require('react');
  return {
    Plus: () => React.createElement('PlusIcon'),
  };
});

jest.mock('@/hooks/use-theme-colors', () => ({
  useThemeColors: () => ({
    colors: {
      primary: '#C9A84A',
      primaryForeground: '#1A1814',
      text: '#F0EDE6',
      textMuted: '#A89F8F',
      background: '#1A1814',
      surface: '#241F1A',
      surfaceElevated: '#2E2820',
      border: 'rgba(196, 184, 160, 0.28)',
      success: '#3DAB6E',
      danger: '#E05555',
      warning: '#D9A514',
    },
  }),
}));
