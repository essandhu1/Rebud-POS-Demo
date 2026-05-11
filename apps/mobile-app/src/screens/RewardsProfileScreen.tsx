import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
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
import { fetchCustomerRewards, type RewardsDetail } from "../services/rewards";

type Props = NativeStackScreenProps<RootStackParamList, "RewardsProfile">;

export function RewardsProfileScreen({}: Props) {
  const [customerId, setCustomerId] = useState("");
  const [data, setData] = useState<RewardsDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCustomerRewards(id);
      setData(result);
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load rewards"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    const trimmed = customerId.trim();
    if (trimmed && /^\d+$/.test(trimmed)) {
      void load(trimmed);
    }
  };

  // ── Search view (no data yet) ──
  if (!data && !loading) {
    return (
      <SafeAreaView style={styles.centered} edges={["left", "right"]}>
        <Text style={styles.title}>Rewards & Loyalty</Text>
        <Text style={styles.subtitle}>
          Enter your customer ID to see your rewards
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Customer ID (e.g. 1)"
          value={customerId}
          onChangeText={setCustomerId}
          keyboardType="number-pad"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>View Rewards</Text>
        </TouchableOpacity>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={["left", "right"]}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>Loading rewards…</Text>
      </SafeAreaView>
    );
  }

  // ── Rewards display ──
  const { customer, events } = data!;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Customer card */}
            <View style={styles.customerCard}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.customerSub}>
                {customer.phone ?? customer.email ?? "No contact on file"}
              </Text>

              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceValue}>
                    {customer.loyaltyPointsBalance}
                  </Text>
                  <Text style={styles.balanceLabel}>Points Balance</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceValue}>
                    {customer.lifetimePointsEarned}
                  </Text>
                  <Text style={styles.balanceLabel}>Lifetime Earned</Text>
                </View>
              </View>
            </View>

            {/* Back button */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                setData(null);
                setCustomerId("");
              }}
            >
              <Text style={styles.backBtnText}>← Search another customer</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>
              Points History ({events.length})
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <View style={styles.eventBody}>
              <Text style={styles.eventType}>
                {item.eventType === "earn"
                  ? "Points Earned"
                  : item.eventType === "redeem"
                    ? "Points Redeemed"
                    : item.eventType === "adjustment"
                      ? "Adjustment"
                      : item.eventType}
              </Text>
              {item.description && (
                <Text style={styles.eventDesc}>{item.description}</Text>
              )}
              {item.orderId && (
                <Text style={styles.eventOrder}>
                  Order #{item.orderId}
                </Text>
              )}
              <Text style={styles.eventDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View>
              <Text
                style={[
                  styles.eventPoints,
                  item.pointsDelta > 0 && styles.eventPointsPositive,
                  item.pointsDelta < 0 && styles.eventPointsNegative,
                ]}
              >
                {item.pointsDelta > 0 ? "+" : ""}
                {item.pointsDelta}
              </Text>
              <Text style={styles.eventBalance}>
                Balance: {item.pointsBalanceAfter}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyEvents}>
            <Text style={styles.emptyEventsText}>
              No loyalty events yet. Complete an order to earn points!
            </Text>
          </View>
        }
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
  errorBox: {
    marginTop: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    maxWidth: 300,
  },
  errorText: { color: "#dc2626", fontSize: 13, textAlign: "center" },
  loadingText: { marginTop: 12, fontSize: 15, color: "#475569" },
  list: { padding: 16, paddingBottom: 32 },
  customerCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  customerName: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  customerSub: { fontSize: 13, color: "#64748b", marginBottom: 16 },
  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceItem: { flex: 1, alignItems: "center" },
  balanceValue: { fontSize: 28, fontWeight: "800", color: "#0f172a" },
  balanceLabel: { fontSize: 12, color: "#64748b", marginTop: 2 },
  balanceDivider: { width: 1, height: 40, backgroundColor: "#e2e8f0" },
  backBtn: { marginBottom: 16 },
  backBtnText: { fontSize: 14, color: "#475569" },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  eventBody: { flex: 1 },
  eventType: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  eventDesc: { fontSize: 12, color: "#475569", marginTop: 2 },
  eventOrder: { fontSize: 12, color: "#64748b", marginTop: 1 },
  eventDate: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  eventPoints: { fontSize: 16, fontWeight: "700", textAlign: "right" },
  eventPointsPositive: { color: "#16a34a" },
  eventPointsNegative: { color: "#dc2626" },
  eventBalance: { fontSize: 11, color: "#94a3b8", textAlign: "right", marginTop: 2 },
  emptyEvents: { padding: 24, alignItems: "center" },
  emptyEventsText: { fontSize: 14, color: "#94a3b8", textAlign: "center" },
});
