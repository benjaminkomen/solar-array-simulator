import {StyleSheet, View} from "react-native";
import {Stack} from "expo-router";
import {Host, Column, Text} from "@expo/ui/jetpack-compose";
import {paddingAll} from "@expo/ui/jetpack-compose/modifiers";

export default function CompassHelpScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Compass Help",
        }}
      />
      <View style={styles.container}>
        <Host style={styles.host}>
          <Column
            horizontalAlignment="center"
            verticalArrangement={{spacedBy: 12}}
            modifiers={[paddingAll(16)]}
          >
            <Text style={{fontSize: 40}}>
              {"\uD83E\uDDED"}
            </Text>
            <Text style={{fontSize: 18, fontWeight: "bold"}}>
              Array Orientation
            </Text>
            <Text
              color="#999999"
              style={{fontSize: 15, textAlign: "center"}}
            >
              Drag the arrow to indicate which direction the top of your
              panel array faces. This helps track your array&apos;s orientation
              for optimal sun exposure.
            </Text>
          </Column>
        </Host>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  host: {
    flex: 1,
  },
});
