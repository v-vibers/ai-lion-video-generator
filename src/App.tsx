import React from 'react'
import { useSubscribeDev } from '@subscribe.dev/react'
import './App.css'

// Sign-in screen component
function UnauthenticatedApp({ signIn }: { signIn: () => void }) {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-section">
          <h1 className="app-title">🦁 AI Lion Video Generator</h1>
          <p className="app-subtitle">Create stunning lion videos with AI</p>
        </div>
        <div className="auth-buttons">
          <button className="btn-primary" onClick={signIn}>
            Sign In
          </button>
          <button className="btn-secondary" onClick={signIn}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  )
}

// Authenticated app with video generation
function AuthenticatedApp() {
  const { client, usage, subscribe, subscriptionStatus, user, signOut, useStorage } = useSubscribeDev()

  const [videoState, setVideoState, syncStatus] = useStorage!('lion-video-state', {
    currentVideo: '',
    lastGeneratedAt: 0,
    prompt: ''
  })

  const [customPrompt, setCustomPrompt] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const lionPrompts = [
    'A majestic lion running through the African savanna at sunset',
    'A powerful lion roaring in slow motion, mane flowing',
    'A lion pride resting under an acacia tree',
    'A young lion cub playing with its siblings',
    'A lion stalking through tall grass in golden hour light'
  ]

  const generateVideo = async (prompt: string) => {
    if (!client) return

    setLoading(true)
    setError(null)

    try {
      const { output } = await client.run('wan-video/wan-2.2-5b-fast', {
        input: {
          prompt,
          aspect_ratio: '16:9'
        }
      })

      const videoUrl = output[0] as string
      setVideoState({
        currentVideo: videoUrl,
        lastGeneratedAt: Date.now(),
        prompt
      })
    } catch (err: any) {
      if (err.type === 'insufficient_credits') {
        setError('Insufficient credits. Please upgrade your plan.')
      } else if (err.type === 'rate_limit_exceeded') {
        const retrySeconds = Math.ceil(err.retryAfter / 1000)
        setError(`Rate limit exceeded. Please try again in ${retrySeconds} seconds.`)
      } else {
        setError('Failed to generate video. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCustomGenerate = () => {
    if (customPrompt.trim()) {
      generateVideo(customPrompt)
    }
  }

  const lastGenDate = videoState.lastGeneratedAt
    ? new Date(videoState.lastGeneratedAt).toLocaleString()
    : null

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">🦁 AI Lion Video Generator</h1>
          <div className="user-section">
            <div className="user-info">
              <span className="user-email">{user?.email}</span>
              <button className="btn-text" onClick={signOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Billing Panel */}
        <div className="billing-panel">
          <div className="stat-card">
            <div className="stat-label">Plan</div>
            <div className="stat-value">{subscriptionStatus?.plan?.name ?? 'Free'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Credits</div>
            <div className="stat-value">{usage?.remainingCredits ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Status</div>
            <div className="stat-value">{subscriptionStatus?.status ?? 'none'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Storage Sync</div>
            <div className="stat-value">{syncStatus}</div>
          </div>
          <button className="btn-upgrade" onClick={subscribe!}>
            Manage Subscription
          </button>
        </div>

        {/* Video Player */}
        <div className="video-section">
          {videoState.currentVideo ? (
            <div className="video-player">
              <video
                key={videoState.currentVideo}
                controls
                autoPlay
                loop
                className="video-element"
                src={videoState.currentVideo}
              >
                Your browser does not support the video tag.
              </video>
              <div className="video-info">
                <p className="video-prompt">
                  <strong>Prompt:</strong> {videoState.prompt}
                </p>
                {lastGenDate && (
                  <p className="video-date">Generated: {lastGenDate}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="video-placeholder">
              <div className="placeholder-content">
                <span className="placeholder-icon">🎬</span>
                <p>No video generated yet</p>
                <p className="placeholder-hint">Choose a prompt below to get started</p>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p className="loading-text">Generating your lion video...</p>
            </div>
          )}
        </div>

        {/* Prompt Selection */}
        <div className="prompt-section">
          <h2 className="section-title">Choose a Lion Scene</h2>
          <div className="prompt-grid">
            {lionPrompts.map((prompt, index) => (
              <button
                key={index}
                className="prompt-card"
                onClick={() => generateVideo(prompt)}
                disabled={loading}
              >
                <span className="prompt-number">{index + 1}</span>
                <span className="prompt-text">{prompt}</span>
              </button>
            ))}
          </div>

          {/* Custom Prompt */}
          <div className="custom-prompt-section">
            <h3 className="section-subtitle">Or Create Your Own</h3>
            <div className="custom-prompt-input">
              <input
                type="text"
                placeholder="Describe your lion video scene..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomGenerate()}
                disabled={loading}
                className="prompt-input"
              />
              <button
                className="btn-generate"
                onClick={handleCustomGenerate}
                disabled={loading || !customPrompt.trim()}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Main App component with routing
function App() {
  const { isSignedIn, signIn } = useSubscribeDev()

  return isSignedIn ? <AuthenticatedApp /> : <UnauthenticatedApp signIn={signIn} />
}

export default App
