import { z } from 'zod';

import type { UserIntegration } from '../../shared/api/models/integration';

export type DisplayStatus = UserIntegration['status'];

export const githubRepositoriesFormSchema = z.object({
  repositories: z.array(z.string().trim().min(1, 'Select a valid repository.')).max(100, 'Select at most 100 repositories.'),
});

export type GithubRepositoriesFormValues = z.infer<typeof githubRepositoriesFormSchema>;
