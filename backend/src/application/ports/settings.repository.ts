export type AutoActionGlobal = {
  enabled: boolean;
  action: 'none' | 'resolved' | 'archived';
  afterHours: number | null;
  updatedAt: string;
};

export abstract class SettingsRepository {
  abstract getAutoActionGlobal(): Promise<AutoActionGlobal | null>;
  abstract setAutoActionGlobal(input: { enabled: boolean; action: 'none' | 'resolved' | 'archived'; afterHours?: number | null }): Promise<AutoActionGlobal>;
}
