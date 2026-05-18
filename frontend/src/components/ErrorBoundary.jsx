import { Component } from 'react'
import { COLORS } from '../utils/constants.js'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <p style={{ color: COLORS.DANGER, fontSize: 16, fontWeight: 700, textAlign: 'center', margin: 0 }}>
            Something went wrong.
          </p>
          <p style={{ color: COLORS.TEXT_MUTED, fontSize: 13, textAlign: 'center', margin: 0 }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ padding: '12px 24px', background: COLORS.ACCENT, color: '#fff', border: 'none', borderRadius: COLORS.RADIUS, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
