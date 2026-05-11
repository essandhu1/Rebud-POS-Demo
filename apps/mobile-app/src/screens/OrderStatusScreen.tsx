import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/types";
import { ApiRequestError } from "../lib/api";
import {
  fetchOrderById,
  ORDER_MOBILE_LABELS,
  type OrderStatusResponse,
} from "../services/orders";

const STATUS_ORDER = ["placed", "accepted", "preparing", "ready", "completed"];

type Props = NativeStackScreenProps<RootStackParamList, "OrderStatus">;

function centsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusStep(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : -1;
}

export function OrderStatusScreen({ route, navigation }: Props) {
  const initialOrderId = route.params?.orderId ?? "";
  const [orderId, setOrderId] = useState(initialOrderId);
  const [inputValue, setInputValue] = useState(initialOrderId);
  const [order, setOrder] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(!!initialOrderId);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (id: string, isPoll = false) => {
    if (!isPoll) setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderById(id);
      setOrder(data);
      return data;
    } catch (e) {
      if (!isPoll) {
        setError(
          e instanceof ApiRequestError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not load order"
        );
        setOrder(null);
      }
      return null;
    } finally {
      if (!isPoll) setLoading(false);
    }
  }, []);

  // Start polling when we have an orderId and have successfully loaded
  useEffect(() => {
    if (!orderId) return;

    void load(orderId, false);

    pollRef.current = setInterval(async () => {
      const data = await load(orderId, true);
      // Stop polling on terminal states
      if (data && ["completed", "cancelled"].includes(data.status) && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 3000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [orderId, load]);

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (trimmed && /^\d+$/.test(trimmed)) {
      setOrderId(trimmed);
    }
  };

  // ── No orderId yet — show search ──
  if (!orderId) {
    return (
      <SafeAreaView style={styles.centered} edges={["left", "right"]}>
        <Text style={styles.title}>Track Your Order</Text>
        <Text style={styles.subtitle}>
          Enter your order ID to see its status
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Order ID (e.g. 1)"
          value={inputValue}
          onChangeText={setInputValue}
          keyboardType="number-pad"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Track Order</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Loading ──
  if (loading && !order) {
    return (
      <SafeAreaView style={styles.centered} edges={["left", "right"]}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>Loading order…</Text>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (error || !order) {
    return (
      <SafeAreaView style={styles.centered} edges={["left", "right"]}>
        <Text style={styles.errorTitle}>Unable to load order</Text>
        <Text style={styles.errorBody}>{error ?? "Order not found"}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => void load(orderId, false)}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Order status display ──
  const currentStep = statusStep(order.status);
  const isCancelled = order.status === "cancelled";
  const isTerminal = ["completed", "cancelled"].includes(order.status);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <FlatList
        data={order.items}
        keyExtractor={(item, idx) => `${item.productId}-${idx}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Order header */}
            <View style={styles.header}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <Text style={styles.orderMeta}>
                {new Date(order.placedAt).toLocaleString()}
              </Text>
            </View>

            {/* Progress UI */}
            <View style={styles.progressCard}>
              {isCancelled ? (
                <View style={styles.cancelledBanner}>
                  <Text style={styles.cancelledText}>
                    This order was cancelled
                  </Text>
                </View>
              ) : (
                STATUS_ORDER.map((s, idx) => {
                  const done = idx <= currentStep;
                  const active = idx === currentStep;
                  return (
                    <View key={s} style={styles.progressRow}>
                      <View style={styles.progressDotRow}>
                        <View
                          style={[
                            styles.progressDot,
                            done && styles.progressDotDone,
                            active && styles.progressDotActive,
                          ]}
                        >
                          {done ? (
                            <Text style={styles.progressDotText}>
                              {idx + 1}
                            </Text>
                          ) : null}
                        </View>
                        {idx < STATUS_ORDER.length - 1 && (
                          <View
                            style={[
                              styles.progressLine,
                              done && styles.progressLineDone,
                            ]}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.progressLabel,
                          done && styles.progressLabelDone,
                          active && styles.progressLabelActive,
                        ]}
                      >
                        {ORDER_MOBILE_LABELS[s] ?? s}
                      </Text>
                    </View>
                  );
                })
              )}

              {!isTerminal && (
                <Text style={styles.pollingHint}>
                  Auto-refreshing every 3s…
                </Text>
              )}
              {isTerminal && (
                <Text style={styles.pollingHint}>
                  Order {order.status === "completed" ? "complete" : "cancelled"}
                </Text>
              )}
            </View>

            {/* Summary */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>
                {centsToDollars(order.totalCents)}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Items</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemBody}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.productName}
              </Text>
              <Text style={styles.itemMeta}>
                {item.quantity} × {centsToDollars(item.unitPriceCents)}
              </Text>
            </View>
            <Text style={styles.itemTotal}>
              {centsToDollars(item.lineTotalCents)}
            </Text>
          </View>
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
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 20 },
  input: {
    width: "100%",
    maxWidth: 280,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 12,
  },
  searchBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  searchBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  loadingText: { marginTop: 12, fontSize: 15, color: "#475569" },
  errorTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 8, textAlign: "center" },
  errorBody: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 20 },
  retryBtn: { backgroundColor: "#0f172a", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  retryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  list: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 16 },
  orderNumber: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  orderMeta: { fontSize: 13, color: "#64748b", marginTop: 4 },
  progressCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  progressRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  progressDotRow: { alignItems: "center", width: 28 },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotDone: { backgroundColor: "#0f172a" },
  progressDotActive: { backgroundColor: "#0f172a", borderWidth: 3, borderColor: "#94a3b8" },
  progressDotText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  progressLine: { width: 2, flex: 1, backgroundColor: "#e2e8f0", minHeight: 20 },
  progressLineDone: { backgroundColor: "#0f172a" },
  progressLabel: {
    fontSize: 14,
    color: "#94a3b8",
    marginLeft: 10,
    marginTop: 3,
    marginBottom: 14,
  },
  progressLabelDone: { color: "#0f172a", fontWeight: "600" },
  progressLabelActive: { color: "#0f172a", fontWeight: "700" },
  cancelledBanner: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelledText: { fontSize: 15, fontWeight: "600", color: "#dc2626" },
  pollingHint: { fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  summaryValue: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemBody: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  itemMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
});