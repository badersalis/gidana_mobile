import { StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 16 },
  serviceRow: { flexDirection: 'row', gap: 10 },
  chip: { backgroundColor: COLORS.border },
  chipSelected: { backgroundColor: COLORS.primary },
  chipTextSelected: { color: '#fff' },
  planCard: { marginBottom: 8, borderWidth: 2, borderColor: 'transparent', borderRadius: 10 },
  planCardSelected: { borderColor: COLORS.primary },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  planLeft: { flexDirection: 'row', alignItems: 'center' },
  planName: { fontWeight: '600', color: COLORS.text },
  planPrice: { fontWeight: '700', color: COLORS.primary },
  divider: { marginVertical: 8 },
  summaryCard: { borderRadius: 10, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: COLORS.textLight },
  totalLabel: { fontWeight: '700', color: COLORS.text },
  totalAmount: { fontWeight: '800', color: COLORS.primary, fontSize: 16 },
  walletCard: { marginBottom: 8, borderWidth: 2, borderColor: 'transparent', borderRadius: 10 },
  walletCardSelected: { borderColor: COLORS.primary },
  payBtn: { marginTop: 24, borderRadius: 10 },
  payContent: { paddingVertical: 6 },
});
