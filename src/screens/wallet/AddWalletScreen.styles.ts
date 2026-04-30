import { StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  label: { fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 8 },
  input: { marginBottom: 12, backgroundColor: COLORS.card },
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  providerBtn: { borderRadius: 8 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  segmented: { marginBottom: 16 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginBottom: 20,
  },
  button: { borderRadius: 8 },
  buttonContent: { paddingVertical: 6 },
});
