import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { RootStackParamList } from "./src/navigation/types";
import { CartProvider } from "./src/state/CartContext";
import { HomeMenuScreen } from "./src/screens/HomeMenuScreen";
import { PlaceholderLinksScreen } from "./src/screens/PlaceholderLinksScreen";
import { ProductDetailScreen } from "./src/screens/ProductDetailScreen";
import { CartScreen } from "./src/screens/CartScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="HomeMenu">
            <Stack.Screen
              name="HomeMenu"
              component={HomeMenuScreen}
              options={{ title: "Home / Menu" }}
            />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ title: "Product Detail" }}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{ title: "Cart" }}
            />
            <Stack.Screen name="Checkout">
              {({ navigation }) => (
                <PlaceholderLinksScreen
                  title="Checkout"
                  currentRoute="Checkout"
                  navigate={navigation.navigate}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="OrderStatus" options={{ title: "Order Status" }}>
              {({ navigation }) => (
                <PlaceholderLinksScreen
                  title="Order Status"
                  currentRoute="OrderStatus"
                  navigate={navigation.navigate}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="RewardsProfile"
              options={{ title: "Rewards / Profile" }}
            >
              {({ navigation }) => (
                <PlaceholderLinksScreen
                  title="Rewards / Profile"
                  currentRoute="RewardsProfile"
                  navigate={navigation.navigate}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  );
}
