import { StatusBar } from "expo-status-bar";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootScreenName, RootStackParamList } from "../navigation/types";

const ROUTES: { name: RootScreenName; label: string }[] = [
  { name: "HomeMenu", label: "Home / Menu" },
  { name: "ProductDetail", label: "Product Detail" },
  { name: "Cart", label: "Cart" },
  { name: "Checkout", label: "Checkout" },
  { name: "OrderStatus", label: "Order Status" },
  { name: "RewardsProfile", label: "Rewards / Profile" },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  title: string;
  currentRoute: RootScreenName;
  navigate: Nav["navigate"];
};

/** POC scaffold: jump between stack screens (detail uses menu + tap for real flow). */
export function PlaceholderLinksScreen({ title, currentRoute, navigate }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Placeholder screen for POC scaffolding</Text>
      <View style={styles.links}>
        {ROUTES.filter((r) => r.name !== currentRoute).map((route) => (
          <TouchableOpacity
            key={route.name}
            onPress={() => {
              if (route.name === "ProductDetail") {
                navigate("ProductDetail", { productId: "1" });
              } else {
                navigate(route.name);
              }
            }}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 20,
    textAlign: "center",
  },
  links: { width: "100%", maxWidth: 340, gap: 10 },
  button: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
