import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '100vh',
                        p: 3
                    }}
                >
                    <Paper sx={{ p: 4, maxWidth: 600 }}>
                        <Typography variant="h4" gutterBottom color="error">
                            Oops! Something went wrong
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            The application encountered an unexpected error. This has been logged for investigation.
                        </Typography>
                        {this.state.error && (
                            <Typography
                                variant="body2"
                                sx={{
                                    p: 2,
                                    bgcolor: 'grey.100',
                                    borderRadius: 1,
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    mb: 2,
                                    overflow: 'auto'
                                }}
                            >
                                {this.state.error.toString()}
                            </Typography>
                        )}
                        <Button variant="contained" onClick={this.handleReset}>
                            Return to Home
                        </Button>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
