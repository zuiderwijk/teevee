export type TeeveeTheme = {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    accent: string;
    currentTime: string;
    programme: string;
    programmeCurrent: string;
  };
};

export const lightTheme: TeeveeTheme = {
  dark: false,
  colors: {
    background: '#F7F7F5',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#171717',
    textSecondary: '#565656',
    textMuted: '#7A7A78',
    border: '#E4E4E0',
    accent: '#202020',
    currentTime: '#D64B42',
    programme: '#EFEFEB',
    programmeCurrent: '#E5E5DF'
  }
};

export const darkTheme: TeeveeTheme = {
  dark: true,
  colors: {
    background: '#10100F',
    surface: '#191918',
    surfaceElevated: '#222220',
    text: '#F4F4F1',
    textSecondary: '#C2C2BD',
    textMuted: '#8E8E88',
    border: '#30302D',
    accent: '#F4F4F1',
    currentTime: '#F06B61',
    programme: '#242422',
    programmeCurrent: '#30302D'
  }
};
