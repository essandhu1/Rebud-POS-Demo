import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type RootStackParamList = {
  HomeMenu: undefined;
  ProductDetail: undefined;
  Cart: undefined;
  Checkout: undefined;
  OrderStatus: undefined;
  RewardsProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type ScreenName = keyof RootStackParamList;

const routes: { name: ScreenName; label: string }[] = [
  { name: "HomeMenu", label: "Home / Menu" },
  { name: "ProductDetail", label: "Product Detail" },
  { name: "Cart", label: "Cart" },
  { name: "Checkout", label: "Checkout" },
  { name: "OrderStatus", label: "Order Status" },
  { name: "RewardsProfile", label: "Rewards / Profile" },
];

function PlaceholderScreen({
  title,
  currentRoute,
  navigate,
}: {
  title: string;
  currentRoute: ScreenName;
  navigate: (name: ScreenName) => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Placeholder screen for POC scaffolding</Text>
      <View style={styles.links}>
        {routes
          .filter((route) => route.name !== currentRoute)
          .map((route) => (
            <TouchableOpacity
              key={route.name}
              onPress={() => navigate(route.name)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{route.label}</Text>
            </TouchableOpacity>
          ))}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomeMenu">
        <Stack.Screen name="HomeMenu" options={{ title: "Home / Menu" }}>
          {({ navigation }) => (
            <PlaceholderScreen
              title="Home / Menu"
              currentRoute="HomeMenu"
              navigate={navigation.navigate}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="ProductDetail" options={{ title: "Product Detail" }}>
          {({ navigation }) => (
            <PlaceholderScreen
              title="Product Detail"
              currentRoute="ProductDetail"
              navigate={navigation.navigate}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Cart">
          {({ navigation }) => (
            <PlaceholderScreen
              title="Cart"
              currentRoute="Cart"
              navigate={navigation.navigate}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Checkout">
          {({ navigation }) => (
            <PlaceholderScreen
              title="Checkout"
              currentRoute="Checkout"
              navigate={navigation.navigate}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="OrderStatus" options={{ title: "Order Status" }}>
          {({ navigation }) => (
            <PlaceholderScreen
              title="Order Status"
              currentRoute="OrderStatus"
              navigate={navigation.navigate}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="RewardsProfile" options={{ title: "Rewards / Profile" }}>
          {({ navigation }) => (
            <PlaceholderScreen
              title="Rewards / Profile"
              currentRoute="RewardsProfile"
              navigate={navigation.navigate}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#475569", marginBottom: 20, textAlign: "center" },
  links: { width: "100%", maxWidth: 340, gap: 10 },
  button: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
});
