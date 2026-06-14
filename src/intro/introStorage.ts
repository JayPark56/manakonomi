import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'intro:completed:v1';

/** Whether the user has finished (or skipped) the intro at least once. */
export async function getIntroCompleted(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setIntroCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, 'true');
  } catch {
    /* best-effort */
  }
}
