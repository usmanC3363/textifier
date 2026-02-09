import React from 'react';

export class DocumentErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-lg font-semibold">
            Document failed to load
          </h2>
          <p className="text-sm text-muted-foreground">
            Please try refreshing or check back later.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
