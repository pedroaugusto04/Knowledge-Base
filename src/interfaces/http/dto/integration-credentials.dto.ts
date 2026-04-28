import { z } from 'zod';

import { ExternalIdentityProvider, IntegrationProvider as IntegrationProviderEnum } from '../../../contracts/enums.js';

const workspaceSlugSchema = z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9._-]+$/).default('default');
const repoFullNameSchema = z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);

const externalIdentitySchema = z.object({
  provider: z.nativeEnum(ExternalIdentityProvider),
  identityType: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  externalId: z.string().trim().min(1).max(180),
});

export const integrationProviderSchema = z.nativeEnum(IntegrationProviderEnum);
export const guidedIntegrationProviderSchema = z.enum([
  IntegrationProviderEnum.GithubApp,
  IntegrationProviderEnum.Whatsapp,
  IntegrationProviderEnum.Telegram,
  IntegrationProviderEnum.AiReview,
  IntegrationProviderEnum.AiConversation,
]);
export const aiIntegrationProviderSchema = z.enum([IntegrationProviderEnum.AiReview, IntegrationProviderEnum.AiConversation]);

export const providerParamSchema = z.object({
  provider: integrationProviderSchema,
});

export const guidedProviderParamSchema = z.object({
  provider: guidedIntegrationProviderSchema,
});

export const aiProviderParamSchema = z.object({
  provider: aiIntegrationProviderSchema,
});

export const resolveIntegrationCredentialBodySchema = z
  .object({
    workspaceSlug: workspaceSlugSchema.optional(),
    userId: z.string().uuid().optional(),
    externalIdentity: externalIdentitySchema.optional(),
  })
  .strict()
  .refine((body) => Boolean(body.userId || body.externalIdentity), { message: 'user_or_external_identity_required' })
  .transform((body) => ({
    ...body,
    workspaceSlug: body.workspaceSlug || 'default',
  }));

export const workspaceQuerySchema = z.object({
  workspaceSlug: workspaceSlugSchema.optional(),
}).transform((query) => ({
  workspaceSlug: query.workspaceSlug || 'default',
}));

export const connectIntegrationBodySchema = z
  .object({
    workspaceSlug: workspaceSlugSchema.optional(),
  })
  .strict()
  .transform((body) => ({
    workspaceSlug: body.workspaceSlug || 'default',
  }));

export const githubAppCallbackQuerySchema = z.object({
  state: z.string().trim().min(1).max(300),
  code: z.string().trim().min(1).max(500),
  installation_id: z.union([z.string(), z.number()]).transform((value) => String(value).trim()),
});

export const sessionParamSchema = z.object({
  provider: guidedIntegrationProviderSchema,
  sessionId: z.string().uuid(),
});

export const githubRepositoriesBodySchema = z
  .object({
    workspaceSlug: workspaceSlugSchema.optional(),
    repositories: z.array(repoFullNameSchema).max(100),
  })
  .strict()
  .transform((body) => ({
    workspaceSlug: body.workspaceSlug || 'default',
    repositories: Array.from(new Set(body.repositories)),
  }));

export type ResolveIntegrationCredentialBody = z.infer<typeof resolveIntegrationCredentialBodySchema>;
export type ProviderParam = z.infer<typeof providerParamSchema>;
export type GuidedProviderParam = z.infer<typeof guidedProviderParamSchema>;
export type AiProviderParam = z.infer<typeof aiProviderParamSchema>;
export type WorkspaceQuery = z.infer<typeof workspaceQuerySchema>;
export type ConnectIntegrationBody = z.infer<typeof connectIntegrationBodySchema>;
export type GithubAppCallbackQuery = z.infer<typeof githubAppCallbackQuerySchema>;
export type SessionParam = z.infer<typeof sessionParamSchema>;
export type GithubRepositoriesBody = z.infer<typeof githubRepositoriesBodySchema>;
