import { useState } from 'react';
import { CDNImage } from '../../shared/ui/CDNImage';

type DemoStep = 'problem' | 'capture' | 'value' | 'cta';

const DEMO_AI_SESSION = {
  id: 'demo-session-1',
  timestamp: new Date().toISOString(),
  messages: [
    {
      role: 'user',
      content: 'We\'re getting transient timeouts on staging environment. Should we increase retry timeout?',
    },
    {
      role: 'assistant',
      content: 'Yes, I recommend increasing from 2s to 5s. Here\'s the implementation:\n\n```typescript\nconst retryConfig = {\n  maxAttempts: 3,\n  initialDelay: 5000, // increased from 2000\n};\n```',
    },
    {
      role: 'user',
      content: 'Got it, deploying now.',
    },
  ],
};

const DEMO_NOTE = {
  id: 'demo-note-1',
  title: 'Transient timeouts on staging',
  path: 'Projects/demo-app/infrastructure/retry-policy',
  summary: 'Increased retry timeout from 2s to 5s to handle transient staging timeouts',
  occurredAt: new Date().toISOString(),
  source: 'ai-chat',
};

export function DemoInteractive() {
  const [step, setStep] = useState<DemoStep>('problem');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<typeof DEMO_NOTE | null>(null);

  const handleStartCapture = () => {
    setStep('capture');
    setIsCapturing(true);
    setCaptureProgress(0);

    // Simulate capture progress
    const interval = setInterval(() => {
      setCaptureProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCapturing(false);
          setStep('value');
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleSearch = () => {
    if (searchQuery.toLowerCase().includes('timeout')) {
      setSearchResult(DEMO_NOTE);
    }
  };

  const handleReset = () => {
    setStep('problem');
    setSearchQuery('');
    setSearchResult(null);
  };

  return (
    <div className="demo-interactive">
      {step === 'problem' && (
        <div className="demo-step demo-problem">
          <div className="demo-header">
            <span className="demo-badge">Step 1 of 3</span>
            <h2>The Context Gap</h2>
            <p>Git history tells you <strong>what</strong> changed, but rarely explains <strong>why</strong>.</p>
          </div>

          <div className="demo-problem-visual">
            <div className="demo-git-timeline">
              <div className="demo-commit">
                <span className="demo-commit-hash">4d2e9a</span>
                <span className="demo-commit-msg">fix retry timeout</span>
                <span className="demo-commit-question">Why 5s? Who approved?</span>
              </div>
              <div className="demo-commit">
                <span className="demo-commit-hash">9b8c1a</span>
                <span className="demo-commit-msg">update webhook config</span>
                <span className="demo-commit-question">Config changed without review?</span>
              </div>
            </div>
            <div className="demo-problem-caption">
              <p>💬 Chat threads are lost. Decisions disappear in AI sessions.</p>
            </div>
          </div>

          <button className="demo-button primary" onClick={handleStartCapture}>
            See How Kote Captures Context →
          </button>
        </div>
      )}

      {step === 'capture' && (
        <div className="demo-step demo-capture">
          <div className="demo-header">
            <span className="demo-badge">Step 2 of 3</span>
            <h2>Capture in Action</h2>
            <p>Watch Kote automatically capture an AI session in real-time.</p>
          </div>

          <div className="demo-capture-visual">
            <div className="demo-ai-chat">
              {DEMO_AI_SESSION.messages.map((msg, idx) => (
                <div key={idx} className={`demo-message ${msg.role}`}>
                  <span className="demo-message-role">{msg.role === 'user' ? 'You' : 'AI'}</span>
                  <p className="demo-message-content">{msg.content}</p>
                </div>
              ))}
            </div>

            <div className="demo-capture-progress">
              <div className="demo-progress-bar">
                <div 
                  className="demo-progress-fill" 
                  style={{ width: `${captureProgress}%` }}
                />
              </div>
              <p className="demo-progress-text">
                {isCapturing ? (
                  <>
                    {captureProgress < 30 && 'Detecting AI session...'}
                    {captureProgress >= 30 && captureProgress < 60 && 'Extracting code snippets...'}
                    {captureProgress >= 60 && captureProgress < 90 && 'Generating summary...'}
                    {captureProgress >= 90 && 'Creating note...'}
                  </>
                ) : (
                  '✓ Note captured successfully!'
                )}
              </p>
            </div>
          </div>

          {!isCapturing && (
            <button className="demo-button primary" onClick={() => setStep('value')}>
              See the Value →
            </button>
          )}
        </div>
      )}

      {step === 'value' && (
        <div className="demo-step demo-value">
          <div className="demo-header">
            <span className="demo-badge">Step 3 of 3</span>
            <h2>Instant Retrieval</h2>
            <p>Ask questions and get answers from your captured context.</p>
          </div>

          <div className="demo-search-box">
            <input
              type="text"
              className="demo-search-input"
              placeholder="Try: 'How did we handle retry timeout?'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="demo-search-button" onClick={handleSearch}>
              Search
            </button>
          </div>

          {searchResult && (
            <div className="demo-search-result">
              <div className="demo-result-header">
                <CDNImage src="https://cdn.simpleicons.org/openai/ffffff" style={{ width: '16px', height: '16px' }} alt="AI" fallback="🤖" />
                <span className="demo-result-source">From AI session captured 2 min ago</span>
              </div>
              <h3 className="demo-result-title">{searchResult.title}</h3>
              <p className="demo-result-summary">{searchResult.summary}</p>
              <div className="demo-result-meta">
                <span className="demo-result-path">{searchResult.path}</span>
                <span className="demo-result-time">Just now</span>
              </div>
            </div>
          )}

          <div className="demo-value-actions">
            <button className="demo-button primary" onClick={() => setStep('cta')}>
              Ready to Capture Your Context?
            </button>
            <button className="demo-button secondary" onClick={handleReset}>
              Replay Demo
            </button>
          </div>
        </div>
      )}

      {step === 'cta' && (
        <div className="demo-step demo-cta">
          <div className="demo-header">
            <h2>Start Capturing Your Development Context</h2>
            <p>Connect GitHub and install the VS Code extension to automatically capture AI sessions, code reviews, and technical decisions.</p>
          </div>

          <div className="demo-cta-actions">
            <a href="/auth?mode=signup" className="demo-button primary large">
              Create Free Account
            </a>
            <a href="/auth" className="demo-button secondary large">
              Sign In
            </a>
          </div>

          <div className="demo-cta-features">
            <div className="demo-feature">
              <span className="demo-feature-icon">🐙</span>
              <span>GitHub Integration</span>
            </div>
            <div className="demo-feature">
              <span className="demo-feature-icon">⚡</span>
              <span>AI Session Capture</span>
            </div>
            <div className="demo-feature">
              <span className="demo-feature-icon">🔍</span>
              <span>Semantic Search</span>
            </div>
          </div>

          <button className="demo-button text" onClick={handleReset}>
            ← Replay Demo
          </button>
        </div>
      )}
    </div>
  );
}
