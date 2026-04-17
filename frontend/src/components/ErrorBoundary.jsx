import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "#f43f5e" }}>
          <h2>Something went wrong.</h2>
          <button onClick={() => window.location.reload()} style={{ color: "#06b6d4", cursor: "pointer", background: "none", border: "none", textDecoration: "underline" }}>
            Try refreshing the page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;