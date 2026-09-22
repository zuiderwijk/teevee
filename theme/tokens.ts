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
    railTick: string;
    editorialAccent: string;
    editorialAccentSurface: string;
    accent: string;
    currentTime: string;
    onCurrentTime: string;
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
    railTick: '#80807A',
    editorialAccent: '#315A63',
    editorialAccentSurface: '#E4ECEE',
    accent: '#202020',
    currentTime: '#D64B42',
    onCurrentTime: '#0D0D0D',
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
    railTick: '#72726B',
    editorialAccent: '#A9C9CF',
    editorialAccentSurface: '#1C2527',
    accent: '#F4F4F1',
    currentTime: '#F06B61',
    onCurrentTime: '#0D0D0D',
    programme: '#242422',
    programmeCurrent: '#30302D'
  }
};
