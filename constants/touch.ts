/** WCAG / Apple HIG minimum interactive target (44×44 pt). */
export const MIN_TOUCH_TARGET = 44;

export const touchTargetStyle = {
  minWidth: MIN_TOUCH_TARGET,
  minHeight: MIN_TOUCH_TARGET,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
