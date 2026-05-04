import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/types";
import { ApiRequestError } from "../lib/api";
import { fetchProducts } from "../services/products";
import type { MenuProduct } from "../types/product";

const FALLBACK_IMAGE =
  "https://placehold.co/600x600?text=Rebud+Demo+Product";

type Props = NativeStackScreenProps<RootStackParamList, "HomeMenu">;

function formatPrice(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}

function potencyLine(p: MenuProduct): string | null {
  const parts: string[] = [];
  if (p.thcPercent != null) parts.push(`THC ${p.thcPercent}%`);
  if (p.cbdPercent != null) parts.push(`CBD ${p.cbdPercent}%`);
  return parts.length ? parts.join(" · ") : null;
}

export function HomeMenuScreen({ navigation }: Props) {
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load menu.";
      setError(msg);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const onRetry = () => void load(false);

  if (loading && products.length === 0 && !error) {
    return (
      <SafeAreaView style={styles.centered} edges={["left", "right"]}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>Loading menu…</Text>
      </SafeAreaView>
    );
  }

  if (error && products.length === 0) {
    return (
      <SafeAreaView style={styles.centered} edges={["left", "right"]}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No products available.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("ProductDetail", { productId: item.id })
            }
          >
            <Image
              source={{ uri: item.imageUrl || FALLBACK_IMAGE }}
              style={styles.thumb}
            />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.cardMeta}>
                {item.category ?? "Uncategorized"}
              </Text>
              <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
              <Text style={styles.cardStock}>
                In stock: {item.stockQuantity}
              </Text>
              {potencyLine(item) ? (
                <Text style={styles.cardPotency}>{potencyLine(item)}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />
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
  listContent: { padding: 16, paddingBottom: 32 },
  emptyText: { textAlign: "center", color: "#64748b", marginTop: 24 },
  card: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
  },
  cardBody: { flex: 1, marginLeft: 12, justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  cardMeta: { fontSize: 13, color: "#64748b", marginTop: 2 },
  cardPrice: { fontSize: 15, fontWeight: "600", color: "#0f172a", marginTop: 6 },
  cardStock: { fontSize: 13, color: "#475569", marginTop: 4 },
  cardPotency: { fontSize: 12, color: "#64748b", marginTop: 4 },
});
