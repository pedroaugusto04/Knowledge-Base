import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  connectIntegration,
  fetchGithubRepositories,
  fetchIntegrations,
  fetchIntegrationSession,
  revokeIntegration,
  saveGithubRepositories,
  testIntegration,
} from '../../shared/api/client';
import type { GithubIntegrationRepository, IntegrationConnectionResponse, UserIntegration } from '../../shared/api/models/integration';
import { Badge, EmptyState, PageHead, Panel } from '../../shared/ui/primitives';

type DisplayStatus = UserIntegration['status'];

const statusLabel: Record<DisplayStatus | string, string> = {
  connected: 'conectado',
  missing: 'pendente',
  revoked: 'revogado',
  pending: 'aguardando',
  expired: 'expirado',
  error: 'erro',
  disabled: 'desativado',
};

const statusTone: Record<DisplayStatus | string, string> = {
  connected: 'low',
  missing: 'high',
  revoked: 'medium',
  pending: 'medium',
  expired: 'high',
  error: 'high',
  disabled: 'medium',
};

const integrationLogos: Record<string, { src: string; label: string }> = {
  'github-app': { src: 'https://cdn.simpleicons.org/github/ffffff', label: 'GitHub' },
  whatsapp: { src: 'https://cdn.simpleicons.org/whatsapp/25D366', label: 'WhatsApp' },
  telegram: { src: 'https://cdn.simpleicons.org/telegram/26A5E4', label: 'Telegram' },
};

function integrationId(integration: UserIntegration) {
  return integration.provider;
}

function isAiProvider(provider: string) {
  return provider === 'ai-review' || provider === 'ai-conversation';
}

function IntegrationLogo({ integration }: { integration: UserIntegration }) {
  const logo = integrationLogos[integrationId(integration)];
  if (!logo) return <div className="integration-logo-fallback">{integration.name.slice(0, 2).toUpperCase()}</div>;
  return <img alt={`${logo.label} logo`} className="integration-logo" src={logo.src} />;
}

function IntegrationSteps({ integration }: { integration: UserIntegration }) {
  const steps = integration.steps?.length ? integration.steps : ['Inicie a conexao para liberar esta integracao.'];
  return (
    <ol className="integration-steps">
      {steps.map((step) => <li key={step}>{step}</li>)}
    </ol>
  );
}

function CodeConnectionModal({ connection, onClose }: { connection: IntegrationConnectionResponse; onClose: () => void }) {
  const queryClient = useQueryClient();
  const session = connection.session;
  const sessionQuery = useQuery({
    queryKey: ['integration-session', connection.provider, session?.id],
    queryFn: () => fetchIntegrationSession({ provider: connection.provider, sessionId: session?.id || '' }),
    enabled: session?.status === 'pending',
    refetchInterval: (query) => query.state.data?.session.status === 'pending' ? 2500 : false,
  });
  const currentSession = sessionQuery.data?.session || session;
  const providerLabel = connection.provider === 'telegram' ? 'Telegram' : 'WhatsApp';

  useEffect(() => {
    if (currentSession?.status === 'connected') {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    }
  }, [currentSession?.status, queryClient]);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section aria-labelledby="connection-title" aria-modal="true" className="modal-panel integration-modal" role="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="card-kicker">{connection.provider}</div>
            <h2 id="connection-title">Conectar {providerLabel}</h2>
          </div>
          <button aria-label="Fechar detalhes" className="modal-close" type="button" onClick={onClose}>x</button>
        </div>

        <div className="connection-code" aria-label="Codigo de conexao">{connection.verificationCode}</div>
        <p>Envie <strong>{connection.instruction}</strong> no chat autorizado.</p>
        {connection.pairingUrl ? <a className="integration-link" href={connection.pairingUrl} rel="noreferrer" target="_blank"><span>Abrir pairing</span><code>{connection.pairingUrl}</code></a> : null}
        {currentSession ? <Badge value={statusLabel[currentSession.status] || currentSession.status} tone={statusTone[currentSession.status] || 'medium'} /> : null}
        {currentSession?.connectedAccount ? <p className="meta">Conectado em {currentSession.connectedAccount}</p> : null}
        {currentSession?.lastError ? <p className="form-error">{currentSession.lastError}</p> : null}
      </section>
    </div>
  );
}

function GithubRepositoriesModal({ workspaceSlug, onClose }: { workspaceSlug: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const repositoriesQuery = useQuery({ queryKey: ['github-repositories', workspaceSlug], queryFn: () => fetchGithubRepositories(workspaceSlug) });
  const [selected, setSelected] = useState<string[]>([]);
  const repositories = repositoriesQuery.data?.repositories || [];

  useEffect(() => {
    if (repositoriesQuery.data) setSelected(repositoriesQuery.data.repositories.filter((repo) => repo.selected).map((repo) => repo.fullName));
  }, [repositoriesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => saveGithubRepositories(workspaceSlug, selected),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
  });

  const toggle = (repository: GithubIntegrationRepository) => {
    setSelected((current) => current.includes(repository.fullName)
      ? current.filter((item) => item !== repository.fullName)
      : [...current, repository.fullName]);
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section aria-labelledby="github-repositories-title" aria-modal="true" className="modal-panel integration-modal" role="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="card-kicker">github-app</div>
            <h2 id="github-repositories-title">Selecionar repositorios</h2>
          </div>
          <button aria-label="Fechar detalhes" className="modal-close" type="button" onClick={onClose}>x</button>
        </div>

        {repositoriesQuery.isLoading ? <p className="meta">Carregando repositorios...</p> : null}
        {repositoriesQuery.isError ? <p className="form-error">Nao foi possivel carregar os repositorios.</p> : null}
        <div className="repository-picker">
          {repositories.map((repository) => (
            <label className="repository-option" key={repository.fullName}>
              <input checked={selected.includes(repository.fullName)} type="checkbox" onChange={() => toggle(repository)} />
              <span>
                <strong>{repository.fullName}</strong>
                <small>{repository.private ? 'Privado' : 'Publico'}</small>
              </span>
            </label>
          ))}
        </div>
        <div className="integration-card-foot">
          <span className="meta">{selected.length} selecionados</span>
          <button className="icon-button" disabled={saveMutation.isPending} type="button" onClick={() => saveMutation.mutate()}>Salvar</button>
        </div>
      </section>
    </div>
  );
}

function IntegrationCard({ integration, workspaceSlug, onCodeConnection, onGithubRepositories }: {
  integration: UserIntegration;
  workspaceSlug: string;
  onCodeConnection: (connection: IntegrationConnectionResponse) => void;
  onGithubRepositories: () => void;
}) {
  const queryClient = useQueryClient();
  const [testMessage, setTestMessage] = useState('');
  const connectMutation = useMutation({
    mutationFn: () => connectIntegration({ provider: integration.provider, workspaceSlug }),
    onSuccess: (result) => {
      if (result.primaryAction?.url) {
        window.location.assign(result.primaryAction.url);
        return;
      }
      if (result.session) onCodeConnection(result);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: () => setTestMessage('Nao foi possivel ativar esta integracao.'),
  });
  const revokeMutation = useMutation({
    mutationFn: () => revokeIntegration(integration.provider, workspaceSlug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });
  const testMutation = useMutation({
    mutationFn: () => testIntegration(integration.provider, workspaceSlug),
    onSuccess: (result) => setTestMessage(result.message),
    onError: () => setTestMessage('Nao foi possivel testar a configuracao.'),
  });
  const connected = integration.status === 'connected';
  const actionLabel = connected ? integration.primaryAction?.label || 'Revogar' : integration.primaryAction?.label || 'Conectar';

  return (
    <Panel className="integration-card">
      <div className="integration-card-head">
        <IntegrationLogo integration={integration} />
        <div>
          <h2>{integration.name}</h2>
          <p>{integration.description}</p>
        </div>
      </div>
      <IntegrationSteps integration={integration} />
      {integration.connectedAccount ? <p className="meta">Conta: {integration.connectedAccount}</p> : null}
      {integration.lastError ? <p className="form-error">{integration.lastError}</p> : null}
      {testMessage ? <p className={testMessage.includes('pronta') ? 'meta' : 'form-error'}>{testMessage}</p> : null}
      <div className="integration-card-foot">
        <Badge value={statusLabel[integration.status] || integration.status} tone={statusTone[integration.status] || 'medium'} />
        <div className="integration-actions">
          {integration.provider === 'github-app' && connected ? <button className="filter-chip" type="button" onClick={onGithubRepositories}>Repositorios</button> : null}
          {isAiProvider(integration.provider) ? <button className="filter-chip" disabled={testMutation.isPending} type="button" onClick={() => testMutation.mutate()}>Testar</button> : null}
          <button
            className={connected ? 'filter-chip' : 'icon-button'}
            disabled={connectMutation.isPending || revokeMutation.isPending}
            type="button"
            onClick={() => connected ? revokeMutation.mutate() : connectMutation.mutate()}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </Panel>
  );
}

export function IntegrationsPage() {
  const integrationsQuery = useQuery({ queryKey: ['integrations'], queryFn: fetchIntegrations });
  const [codeConnection, setCodeConnection] = useState<IntegrationConnectionResponse | null>(null);
  const [showGithubRepositories, setShowGithubRepositories] = useState(false);
  const providers = useMemo(() => integrationsQuery.data?.integrations || [], [integrationsQuery.data?.integrations]);

  if (integrationsQuery.isLoading) return <EmptyState>Carregando integracoes...</EmptyState>;
  if (!integrationsQuery.data) return <EmptyState>Nao foi possivel carregar o status das integracoes.</EmptyState>;

  return (
    <>
      <PageHead
        title="Integracoes"
        subtitle={`Workspace ${integrationsQuery.data.workspaceSlug}: conecte provedores por fluxos guiados.`}
      />
      <section className="grid cols-2 integrations-grid">
        {providers.map((integration) => (
          <IntegrationCard
            integration={integration}
            key={integrationId(integration)}
            workspaceSlug={integrationsQuery.data.workspaceSlug}
            onCodeConnection={setCodeConnection}
            onGithubRepositories={() => setShowGithubRepositories(true)}
          />
        ))}
      </section>
      {codeConnection ? <CodeConnectionModal connection={codeConnection} onClose={() => setCodeConnection(null)} /> : null}
      {showGithubRepositories ? <GithubRepositoriesModal workspaceSlug={integrationsQuery.data.workspaceSlug} onClose={() => setShowGithubRepositories(false)} /> : null}
    </>
  );
}
