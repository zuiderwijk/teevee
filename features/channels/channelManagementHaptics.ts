import * as Haptics from 'expo-haptics';

export async function channelManagementPickHaptic(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics are enhancement-only; unsupported/device-disabled engines fail open.
  }
}

export async function channelManagementDropHaptic(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics are enhancement-only; unsupported/device-disabled engines fail open.
  }
}
