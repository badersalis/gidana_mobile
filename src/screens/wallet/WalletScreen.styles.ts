import { StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { marginTop: 100 },
  header: { padding: 16, paddingTop: 20 },
  headerTitle: { fontWeight: '700', color: COLORS.text },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.textLight, marginTop: 16 },
  emptySubtext: { color: COLORS.textLight, textAlign: 'center', marginTop: 8 },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: COLORS.primary },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  authTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginTop: 16 },
  authSub: { color: COLORS.textLight, textAlign: 'center', marginBottom: 8 },
  authBtn: { width: '100%', borderRadius: 8 },
  regBtn: { width: '100%', borderRadius: 8, borderColor: COLORS.primary },
});
