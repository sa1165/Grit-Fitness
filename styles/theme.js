// Black-themed color palette for Grit
export const colors = {
    // Primary colors
    black: '#000000',
    white: '#FFFFFF',

    // Grays
    darkGray: '#1A1A1A',
    mediumGray: '#2E2E2E',
    lightGray: '#B0B0B0',

    // Accent colors (for future use)
    primary: '#4CAF50',    // Green for success/active states
    secondary: '#2196F3',   // Blue for links/info
    accent: '#FF9800',      // Orange for highlights
    error: '#F44336',       // Red for errors/alerts
};

// Typography
export const typography = {
    // Font families (using system defaults for now)
    regular: 'System',
    medium: 'System',
    bold: 'System',

    // Font sizes
    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 22,
        xxl: 28,
        xxxl: 36,
    },
};

// Spacing
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Border radius
export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

export default {
    colors,
    typography,
    spacing,
    borderRadius,
};
