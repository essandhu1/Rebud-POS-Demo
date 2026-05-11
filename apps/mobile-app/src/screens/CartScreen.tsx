import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/types";
import { useCart } from "../state/CartContext";

const FALLBACK_IMAGE =
  "https://placehold.co/600x600?text=Rebud+Demo+Product";

type Props = NativeStackScreenProps<RootStackParamList, "Cart">;

function formatPrice(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}

export function CartScreen({ navigation }: Props) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyBody}>
            Browse the menu and add some products.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate("HomeMenu")}
          >
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.product.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Image
                  source={{ uri: item.product.imageUrl || FALLBACK_IMAGE }}
                  style={styles.thumb}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.cardPrice}>
                    {formatPrice(item.product.price * item.quantity)}
                  </Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        "Remove item",
                        `Remove ${item.product.name} from your cart?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => removeItem(item.product.id),
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          <View style={styles.footer}>
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValue}>
                {formatPrice(subtotal)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate("Checkout")}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  emptyBody: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 20 },
  browseBtn: { backgroundColor: "#0f172a", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  browseBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  list: { padding: 16, paddingBottom: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#e2e8f0" },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  cardPrice: { fontSize: 15, fontWeight: "600", color: "#0f172a", marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  qtyValue: { fontSize: 15, fontWeight: "700", color: "#0f172a", minWidth: 24, textAlign: "center" },
  removeText: { fontSize: 13, color: "#dc2626", marginTop: 6 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#fff",
  },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subtotalLabel: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  subtotalValue: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  checkoutBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  checkoutBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
