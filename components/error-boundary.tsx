import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Catches any React render error and displays it on-screen instead of going
// black. Also catches the async init in the root layout via the captured-error
// state. Take a screenshot of this screen and send to dev for debugging.
type Props = { children: ReactNode };
type State = { error: Error | null; info: string | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    this.setState({ error, info: info.componentStack ?? null });
    // eslint-disable-next-line no-console
    console.error('[LATAKIA] root crash:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>App Error</Text>
        <Text style={styles.subtitle}>Take a screenshot of this screen.</Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text selectable style={styles.errMessage}>
            {this.state.error.message ?? String(this.state.error)}
          </Text>
          {this.state.error.stack && (
            <Text selectable style={styles.stack}>
              {this.state.error.stack}
            </Text>
          )}
          {this.state.info && (
            <Text selectable style={styles.stack}>
              {this.state.info}
            </Text>
          )}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '800', color: '#a8341c', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 12 },
  scroll: { flex: 1, backgroundColor: '#fafafa', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  scrollContent: { padding: 12 },
  errMessage: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 12 },
  stack: { fontSize: 11, fontFamily: 'monospace', color: '#333', marginBottom: 12 },
});
