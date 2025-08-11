export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    accent: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

export const themes: Record<string, ThemeConfig> = {
  vibrant: {
    name: "Vibrant",
    colors: {
      primary: "#FF6B6B",
      secondary: "#4ECDC4",
      accent: "#FFE66D",
      background: "#F7F9FC",
      surface: "#FFFFFF",
      text: "#2D3436",
      textSecondary: "#636E72",
      success: "#00B894",
      warning: "#FDCB6E",
      error: "#E17055",
      info: "#74B9FF"
    },
    gradients: {
      primary: "linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)",
      secondary: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
      accent: "linear-gradient(135deg, #FFE66D 0%, #FFD93D 100%)"
    },
    shadows: {
      sm: "0 2px 4px rgba(0, 0, 0, 0.1)",
      md: "0 4px 12px rgba(0, 0, 0, 0.15)",
      lg: "0 8px 24px rgba(0, 0, 0, 0.2)"
    },
    borderRadius: {
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem"
    }
  },
  ocean: {
    name: "Ocean",
    colors: {
      primary: "#0984E3",
      secondary: "#00CEC9",
      accent: "#6C5CE7",
      background: "#F5F7FA",
      surface: "#FFFFFF",
      text: "#2D3436",
      textSecondary: "#636E72",
      success: "#00B894",
      warning: "#FDCB6E",
      error: "#E17055",
      info: "#74B9FF"
    },
    gradients: {
      primary: "linear-gradient(135deg, #0984E3 0%, #74B9FF 100%)",
      secondary: "linear-gradient(135deg, #00CEC9 0%, #55EFC4 100%)",
      accent: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)"
    },
    shadows: {
      sm: "0 2px 4px rgba(0, 0, 0, 0.08)",
      md: "0 4px 12px rgba(0, 0, 0, 0.12)",
      lg: "0 8px 24px rgba(0, 0, 0, 0.16)"
    },
    borderRadius: {
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem"
    }
  },
  sunset: {
    name: "Sunset",
    colors: {
      primary: "#FF7675",
      secondary: "#FDCB6E",
      accent: "#E84393",
      background: "#FFF5F5",
      surface: "#FFFFFF",
      text: "#2D3436",
      textSecondary: "#636E72",
      success: "#00B894",
      warning: "#FDCB6E",
      error: "#E17055",
      info: "#74B9FF"
    },
    gradients: {
      primary: "linear-gradient(135deg, #FF7675 0%, #FD79A8 100%)",
      secondary: "linear-gradient(135deg, #FDCB6E 0%, #F39C12 100%)",
      accent: "linear-gradient(135deg, #E84393 0%, #FD79A8 100%)"
    },
    shadows: {
      sm: "0 2px 4px rgba(0, 0, 0, 0.1)",
      md: "0 4px 12px rgba(0, 0, 0, 0.15)",
      lg: "0 8px 24px rgba(0, 0, 0, 0.2)"
    },
    borderRadius: {
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem"
    }
  },
  forest: {
    name: "Forest",
    colors: {
      primary: "#00B894",
      secondary: "#55A3FF",
      accent: "#FDCB6E",
      background: "#F0FFF4",
      surface: "#FFFFFF",
      text: "#2D3436",
      textSecondary: "#636E72",
      success: "#00B894",
      warning: "#FDCB6E",
      error: "#E17055",
      info: "#74B9FF"
    },
    gradients: {
      primary: "linear-gradient(135deg, #00B894 0%, #55EFC4 100%)",
      secondary: "linear-gradient(135deg, #55A3FF 0%, #74B9FF 100%)",
      accent: "linear-gradient(135deg, #FDCB6E 0%, #F39C12 100%)"
    },
    shadows: {
      sm: "0 2px 4px rgba(0, 0, 0, 0.08)",
      md: "0 4px 12px rgba(0, 0, 0, 0.12)",
      lg: "0 8px 24px rgba(0, 0, 0, 0.16)"
    },
    borderRadius: {
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem"
    }
  },
  royal: {
    name: "Royal",
    colors: {
      primary: "#6C5CE7",
      secondary: "#A29BFE",
      accent: "#FD79A8",
      background: "#F8F7FF",
      surface: "#FFFFFF",
      text: "#2D3436",
      textSecondary: "#636E72",
      success: "#00B894",
      warning: "#FDCB6E",
      error: "#E17055",
      info: "#74B9FF"
    },
    gradients: {
      primary: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)",
      secondary: "linear-gradient(135deg, #A29BFE 0%, #D6A2E8 100%)",
      accent: "linear-gradient(135deg, #FD79A8 0%, #FDCB6E 100%)"
    },
    shadows: {
      sm: "0 2px 4px rgba(108, 92, 231, 0.1)",
      md: "0 4px 12px rgba(108, 92, 231, 0.15)",
      lg: "0 8px 24px rgba(108, 92, 231, 0.2)"
    },
    borderRadius: {
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem"
    }
  }
};

export const defaultTheme = "vibrant";