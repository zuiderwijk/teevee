import { type ColorValue, StyleSheet, View } from 'react-native';

type AppTabIconName = 'guide' | 'tonight' | 'search';

type AppTabIconProps = {
  name: AppTabIconName;
  color: ColorValue;
  focused: boolean;
};

function SearchIcon({ color }: { color: ColorValue }) {
  return (
    <View style={styles.searchIcon}>
      <View style={[styles.searchCircle, { borderColor: color }]} />
      <View style={[styles.searchHandle, { backgroundColor: color }]} />
    </View>
  );
}

function GuideIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
  return (
    <View style={styles.guideIcon}>
      <View style={[styles.guideBody, { borderColor: color }]}>
        <View
          style={[
            styles.guideScreen,
            {
              backgroundColor: color,
              opacity: focused ? 1 : 0.72,
            },
          ]}
        />
      </View>
      <View style={[styles.antennaLeft, { backgroundColor: color }]} />
      <View style={[styles.antennaRight, { backgroundColor: color }]} />
    </View>
  );
}

function TonightIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
  return (
    <View style={[styles.tonightCircle, { borderColor: color }]}>
      <View
        style={[
          styles.tonightNeedle,
          {
            borderColor: color,
            backgroundColor: focused ? color : 'transparent',
          },
        ]}
      />
    </View>
  );
}

export function AppTabIcon({ name, color, focused }: AppTabIconProps) {
  if (name === 'guide') return <GuideIcon color={color} focused={focused} />;
  if (name === 'tonight') return <TonightIcon color={color} focused={focused} />;
  return <SearchIcon color={color} />;
}

const styles = StyleSheet.create({
  guideIcon: {
    width: 24,
    height: 23,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  guideBody: {
    width: 20,
    height: 16,
    borderWidth: 1.6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideScreen: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  antennaLeft: {
    position: 'absolute',
    width: 7,
    height: 1.5,
    left: 6,
    top: 2,
    borderRadius: 1,
    transform: [{ rotate: '35deg' }],
  },
  antennaRight: {
    position: 'absolute',
    width: 7,
    height: 1.5,
    right: 6,
    top: 2,
    borderRadius: 1,
    transform: [{ rotate: '-35deg' }],
  },
  tonightCircle: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tonightNeedle: {
    width: 7,
    height: 7,
    borderWidth: 1.4,
    transform: [{ rotate: '45deg' }],
  },
  searchIcon: {
    width: 22,
    height: 22,
  },
  searchCircle: {
    position: 'absolute',
    left: 2,
    top: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.6,
  },
  searchHandle: {
    position: 'absolute',
    width: 8,
    height: 1.6,
    left: 13,
    top: 15,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
});
