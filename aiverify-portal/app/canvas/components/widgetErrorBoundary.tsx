import React from "react";

class WidgetErrorBoundary extends React.Component<{ children: React.ReactNode, widgetName: string }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode, widgetName: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-red-700 font-medium mb-2">Widget Error</h3>
          <p className="text-red-600">{this.props.widgetName} failed to render</p>
          <p className="text-red-500 text-sm mt-2 font-mono">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export { WidgetErrorBoundary }