export interface NotificationPrefs {
  automationTriggered: boolean;
  connectionAlerts: boolean;
  weeklyDigest: boolean;
}

function getDefaultPrefs(): NotificationPrefs {
  return {
    automationTriggered: true,
    connectionAlerts: true,
    weeklyDigest: true,
  };
}

export function parseSettingsJson(json: string | null | undefined) {
  try {
    return JSON.parse(json ?? "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function getNotificationPrefs(json: string | null | undefined): NotificationPrefs {
  const settings = parseSettingsJson(json);
  const prefs = (settings.notifications ?? {}) as Partial<NotificationPrefs>;
  return { ...getDefaultPrefs(), ...prefs };
}
