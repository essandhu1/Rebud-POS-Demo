import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/types";
import { ApiRequestError } from "../lib/api";
import { fetchProductById } from "../services/products";
import type { MenuProduct } from "../types/product";
import { useCart } from "../state/CartContext";

const FALLBACK_IMAGE =
  "https://placehold.co/600x600?text=Rebud+Demo+Product";

type Props = NativeStackScreenProps<RootStackParamList, "ProductDetail">;

function formatPrice(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}

export function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const [product, setProduct] = useState<MenuProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductById(productId);
      setProduct(data);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load product.";
      setError(msg);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !product) {
    return (
      <SafeAreaView style={styles.centered} edges={["left", "right"]}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>Loading product…</Text>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.centered} edges={["left", "right"]}>
        <Text style={styles.errorTitle}>Unable to load product</Text>
        <Text style={styles.errorBody}>{error ?? "Unknown error"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void load()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const potencyParts: string[] = [];
  if (product.thcPercent != null) potencyParts.push(`THC ${product.thcPercent}%`);
  if (product.cbdPercent != null) potencyParts.push(`CBD ${product.cbdPercent}%`);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image
          source={{ uri: product.imageUrl || FALLBACK_IMAGE }}
          style={styles.hero}
        />
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.category}>{product.category ?? "Uncategorized"}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={styles.stock}>Available: {product.stockQuantity}</Text>
        {potencyParts.length > 0 ? (
          <Text style={styles.potency}>{potencyParts.join(" · ")}</Text>
        ) : null}
        <Text style={styles.sku}>SKU: {product.sku}</Text>
        {product.description ? (
          <Text style={styles.description}>{product.description}</Text>
        ) : null}

        {/* Quantity controls */}
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.quantityBtn}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.quantityBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityBtn}
            onPress={() =>
              setQuantity((q) => Math.min(product.stockQuantity, q + 1))
            }
          >
            <Text style={styles.quantityBtnText}>+</Text>
          </TouchableOpacity>
          <Text style={styles.quantityLabel}>Qty</Text>
        </View>

        {/* Add to Cart */}
        {added ? (
          <View style={styles.addedBanner}>
            <Text style={styles.addedBannerText}>Added to cart ✓</Text>
            <TouchableOpacity
              style={styles.viewCartBtn}
              onPress={() => navigation.navigate("Cart")}
            >
              <Text style={styles.viewCartBtnText}>View Cart</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.addToCartBtn,
              product.stockQuantity === 0 && styles.addToCartBtnDisabled,
            ]}
            disabled={product.stockQuantity === 0}
            onPress={() => {
              addItem(product, quantity);
              setAdded(true);
              setTimeout(() => setAdded(false), 2500);
            }}
          >
            <Text style={styles.addToCartBtnText}>
              {product.stockQuantity === 0
                ? "Out of Stock"
                : `Add to Cart — ${formatPrice(product.price * quantity)}`}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  centered: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 15, color: "#475569" },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  errorBody: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scroll: { paddingBottom: 32 },
  hero: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  category: { fontSize: 14, color: "#64748b", marginBottom: 8 },
  price: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  stock: { fontSize: 15, color: "#475569", marginBottom: 8 },
  potency: { fontSize: 14, color: "#64748b", marginBottom: 12 },
  sku: { fontSize: 13, color: "#64748b", marginBottom: 16 },
  description: { fontSize: 15, lineHeight: 22, color: "#334155", paddingHorizontal: 16 },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 8,
  },
  quantityBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  quantityBtnText: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  quantityValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    minWidth: 32,
    textAlign: "center",
  },
  quantityLabel: { fontSize: 13, color: "#64748b", marginLeft: 4 },
  addToCartBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  addToCartBtnDisabled: { backgroundColor: "#94a3b8" },
  addToCartBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  addedBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addedBannerText: { fontSize: 15, fontWeight: "600", color: "#166534" },
  viewCartBtn: {
    backgroundColor: "#166534",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewCartBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
